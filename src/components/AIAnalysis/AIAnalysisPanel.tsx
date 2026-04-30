import { useMemo } from 'react';
import { useClaudeAPI } from '../../hooks/useClaudeAPI';
import { useDashboard } from '../../store/dashboardStore';
import type { AIRecommendation, ComparisonResult } from '../../types';
import { buildAnalysisPrompt } from '../../utils/prompt';
import { ExportButtons } from './ExportButtons';
import { RecommendationCard } from './RecommendationCard';

interface Props {
  comparison: ComparisonResult;
}

const BUCKET_META: Array<{
  key: AIRecommendation['bucket'];
  title: string;
  subtitle: string;
  cls: string;
}> = [
  {
    key: 'sofort',
    title: 'Sofortmaßnahmen',
    subtitle: 'Diese Woche umsetzbar',
    cls: 'bg-emerald-50 border-emerald-200',
  },
  {
    key: 'mittelfristig',
    title: 'Mittelfristige Optimierungen',
    subtitle: 'Dieser Monat',
    cls: 'bg-amber-50 border-amber-200',
  },
  {
    key: 'strategisch',
    title: 'Strategische Maßnahmen',
    subtitle: 'Dieses Quartal',
    cls: 'bg-blue-50 border-blue-200',
  },
];

export function AIAnalysisPanel({ comparison }: Props) {
  const { anthropicApiKey, setAnthropicApiKey } = useDashboard();
  const { state, analyze, reset } = useClaudeAPI();

  const promptText = useMemo(
    () =>
      buildAnalysisPrompt({
        periods: comparison.selectedPeriods,
        kpis: comparison.kpisPerPeriod,
        comparison,
      }),
    [comparison],
  );

  const onRun = () => analyze(anthropicApiKey, promptText);

  const grouped: Record<AIRecommendation['bucket'], AIRecommendation[]> = {
    sofort: [],
    mittelfristig: [],
    strategisch: [],
  };
  for (const r of state.recommendations) grouped[r.bucket].push(r);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">KI-Analyse via Claude</h3>
          <p className="text-sm text-slate-500">
            Strukturierte Optimierungs-Empfehlungen, gestützt auf alle gewählten Perioden.
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <input
            type="password"
            value={anthropicApiKey}
            onChange={(e) => setAnthropicApiKey(e.target.value)}
            placeholder="Anthropic API-Key"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono w-64"
          />
          <button
            onClick={onRun}
            disabled={state.status === 'loading' || comparison.selectedPeriods.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {state.status === 'loading' ? 'Analyse läuft …' : 'KI-Analyse starten'}
          </button>
          {state.status === 'done' && (
            <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-900">
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Dein API-Key verlässt deinen Browser nicht. Modell: <code className="bg-slate-100 px-1 rounded">claude-sonnet-4-6</code>.
      </p>

      {state.status === 'error' && state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {state.error}
        </div>
      )}

      {state.status === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm mb-4">
          Die Analyse läuft, bitte einen Moment …
        </div>
      )}

      {state.status === 'done' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {state.recommendations.length} Empfehlungen analysiert
            </span>
            {state.rawMarkdown && <ExportButtons markdown={state.rawMarkdown} />}
          </div>

          {BUCKET_META.map((meta) => (
            <div key={meta.key} className={`rounded-xl border p-4 ${meta.cls}`}>
              <div className="mb-3">
                <h4 className="text-base font-semibold text-slate-900">{meta.title}</h4>
                <p className="text-xs text-slate-600">{meta.subtitle}</p>
              </div>
              {grouped[meta.key].length === 0 ? (
                state.bucketTexts[meta.key] ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
                    {state.bucketTexts[meta.key]}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">Keine Empfehlungen in diesem Bucket.</p>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[meta.key].map((r, idx) => (
                    <RecommendationCard key={idx} rec={r} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {state.status === 'idle' && (
        <p className="text-sm text-slate-500">
          Klicke auf „KI-Analyse starten", um konkrete, datenbasierte Optimierungs-Empfehlungen zu erhalten.
        </p>
      )}
    </div>
  );
}
