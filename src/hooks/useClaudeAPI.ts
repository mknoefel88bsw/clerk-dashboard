import { useCallback, useState } from 'react';
import type { AIRecommendation } from '../types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { type?: string; message?: string };
}

export interface ClaudeState {
  status: 'idle' | 'loading' | 'done' | 'error';
  error: string | null;
  rawMarkdown: string | null;
  recommendations: AIRecommendation[];
  bucketTexts: Record<'sofort' | 'mittelfristig' | 'strategisch', string>;
}

const initialState: ClaudeState = {
  status: 'idle',
  error: null,
  rawMarkdown: null,
  recommendations: [],
  bucketTexts: { sofort: '', mittelfristig: '', strategisch: '' },
};

export function useClaudeAPI() {
  const [state, setState] = useState<ClaudeState>(initialState);

  const analyze = useCallback(async (apiKey: string, prompt: string) => {
    if (!apiKey) {
      setState({ ...initialState, status: 'error', error: 'Anthropic API-Key fehlt.' });
      return;
    }
    setState({ ...initialState, status: 'loading' });
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      let data: ClaudeResponse | null = null;
      try {
        data = await res.json();
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const apiMessage = data?.error?.message;
        let userMessage: string;
        if (res.status === 401) {
          userMessage = 'API-Key ungültig oder abgelaufen.';
        } else if (res.status === 429) {
          userMessage = 'Rate Limit erreicht — bitte gleich nochmal versuchen.';
        } else if (res.status >= 500) {
          userMessage = `Anthropic-Server-Fehler (${res.status}). Bitte erneut versuchen.`;
        } else {
          userMessage = apiMessage ?? `Anfrage fehlgeschlagen (HTTP ${res.status}).`;
        }
        setState({ ...initialState, status: 'error', error: userMessage });
        return;
      }

      const text = (data?.content ?? [])
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text!)
        .join('\n');

      const parsed = parseClaudeMarkdown(text);
      setState({
        status: 'done',
        error: null,
        rawMarkdown: text,
        recommendations: parsed.recommendations,
        bucketTexts: parsed.bucketTexts,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      let hint = '';
      if (/cors/i.test(msg)) hint = ' (CORS — Header anthropic-dangerous-direct-browser-access prüfen)';
      setState({
        ...initialState,
        status: 'error',
        error: `Verbindung fehlgeschlagen: ${msg}${hint}`,
      });
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { state, analyze, reset };
}

interface ParseResult {
  recommendations: AIRecommendation[];
  bucketTexts: Record<'sofort' | 'mittelfristig' | 'strategisch', string>;
}

const BUCKET_HEADINGS: Array<{ key: 'sofort' | 'mittelfristig' | 'strategisch'; pattern: RegExp }> = [
  { key: 'sofort', pattern: /^##\s*Sofortma(ß|ss)nahmen/im },
  { key: 'mittelfristig', pattern: /^##\s*Mittelfristige Optimierungen/im },
  { key: 'strategisch', pattern: /^##\s*Strategische Ma(ß|ss)nahmen/im },
];

function parseClaudeMarkdown(markdown: string): ParseResult {
  const recommendations: AIRecommendation[] = [];
  const bucketTexts: ParseResult['bucketTexts'] = { sofort: '', mittelfristig: '', strategisch: '' };

  const sections: Record<'sofort' | 'mittelfristig' | 'strategisch', string> = {
    sofort: '',
    mittelfristig: '',
    strategisch: '',
  };

  const matches = BUCKET_HEADINGS.map((b) => {
    const m = markdown.match(b.pattern);
    return m ? { key: b.key, idx: m.index ?? -1 } : null;
  }).filter((x): x is { key: 'sofort' | 'mittelfristig' | 'strategisch'; idx: number } => !!x && x.idx >= 0);

  matches.sort((a, b) => a.idx - b.idx);
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].idx;
    const end = i + 1 < matches.length ? matches[i + 1].idx : markdown.length;
    const block = markdown.slice(start, end);
    const body = block.replace(/^##.*\n?/, '');
    sections[matches[i].key] = body.trim();
  }

  bucketTexts.sofort = sections.sofort;
  bucketTexts.mittelfristig = sections.mittelfristig;
  bucketTexts.strategisch = sections.strategisch;

  for (const bucket of ['sofort', 'mittelfristig', 'strategisch'] as const) {
    const lines = sections[bucket].split('\n');
    for (const line of lines) {
      const trimmed = line.trim().replace(/^[-*]\s*/, '');
      if (!trimmed) continue;
      if (!trimmed.includes('|')) continue;
      const parts = trimmed.split('|').map((p) => p.trim());
      const fields: Record<string, string> = {};
      for (const p of parts) {
        const m = p.match(/^\*?\*?(Handlung|Clerk\.io Feature|Impact|Aufwand)\*?\*?\s*:?\s*(.*)$/i);
        if (m) {
          fields[m[1].toLowerCase()] = m[2].trim();
        }
      }
      const action = fields['handlung'];
      const feature = fields['clerk.io feature'];
      const impact = fields['impact'];
      const effortRaw = (fields['aufwand'] ?? '').toUpperCase();
      const effort: 'S' | 'M' | 'L' = effortRaw.includes('S')
        ? 'S'
        : effortRaw.includes('L')
          ? 'L'
          : 'M';
      if (action || feature || impact) {
        recommendations.push({
          bucket,
          action: action ?? '',
          clerkFeature: feature ?? '',
          expectedImpact: impact ?? '',
          effort,
          dataReference: '',
        });
      }
    }
  }

  return { recommendations, bucketTexts };
}
