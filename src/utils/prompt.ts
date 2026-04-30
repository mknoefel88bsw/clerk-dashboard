import type { AggregatedKPIs, ComparisonResult, Period } from '../types';
import { fmtInt, fmtPct, fmtEur } from './formatting';

export interface PromptInput {
  periods: Period[];
  kpis: Map<string, AggregatedKPIs>;
  comparison: ComparisonResult;
}

export function buildAnalysisPrompt(input: PromptInput): string {
  const { periods, kpis, comparison } = input;
  const sorted = [...periods].sort((a, b) => a.sortKey - b.sortKey);

  const periodLabels = sorted.map((p) => p.label).join(', ');

  const kpiLines = (key: keyof AggregatedKPIs, formatter: (n: number) => string) =>
    sorted
      .map((p) => {
        const k = kpis.get(p.id);
        return k ? `${p.label}: ${formatter(k[key] as number)}` : `${p.label}: —`;
      })
      .join(' | ');

  const zeroPersistent = comparison.zeroPersistent
    .slice(0, 10)
    .map((z) => `"${z.term}" (Volumen: ${fmtInt(z.searches)}, in ${z.periodsAffected} Perioden)`)
    .join('\n');

  const losers = comparison.losers
    .slice(0, 10)
    .map((l) => `"${l.term}" (Basis: ${fmtInt(l.baseValue)} → aktuell: ${fmtInt(l.currentValue)}, Δ ${l.deltaPct?.toFixed(1) ?? '—'} %)`)
    .join('\n');

  const opportunities = comparison.opportunityRows
    .slice(0, 10)
    .map(
      (o) =>
        `"${o.term}" (Volumen: ${fmtInt(o.searches)}, CR: ${fmtPct(o.conversionRate)}, Score: ${fmtInt(o.score)}, Trend: ${o.trend})`,
    )
    .join('\n');

  return `Du bist ein E-Commerce Search Optimierungsexperte für einen Bogensport-Onlineshop (BogenSportWelt.de). Antworte ausschließlich auf Deutsch.

Analysiere folgende Clerk.io Search-Performance-Daten über ${sorted.length} Zeiträume und gib konkrete Optimierungsempfehlungen:

**Zeiträume:** ${periodLabels}

**KPI-Entwicklung (pro Periode):**
- Gesamtsuchen: ${kpiLines('totalSearches', fmtInt)}
- Ø CTR: ${kpiLines('avgCTR', (n) => fmtPct(n))}
- Ø Conversion Rate: ${kpiLines('avgCR', (n) => fmtPct(n))}
- Revenue: ${kpiLines('revenue', fmtEur)}
- Zero-Result-Quote: ${kpiLines('zeroResultRate', (n) => fmtPct(n))}
- Anzahl einzigartiger Suchbegriffe: ${kpiLines('uniqueTerms', fmtInt)}

**Top Zero-Result-Begriffe (persistent):**
${zeroPersistent || '(keine)'}

**Stärkste Verlierer (nach Volumen-Rückgang):**
${losers || '(keine)'}

**Opportunity Matrix (Top 10 nach Score):**
${opportunities || '(keine)'}

Gib deine Empfehlungen STRIKT in folgendem Format aus, keine Einleitung, kein Fazit:

## Sofortmaßnahmen
- **Handlung:** <konkrete Aktion> | **Clerk.io Feature:** <Synonyms / Boosting / Redirects / Categories / Slot-Personalization / o.ä.> | **Impact:** <was wir erwarten + Bezug auf Datenpunkt> | **Aufwand:** S
- **Handlung:** … | **Clerk.io Feature:** … | **Impact:** … | **Aufwand:** S/M/L

## Mittelfristige Optimierungen
- **Handlung:** … | **Clerk.io Feature:** … | **Impact:** … | **Aufwand:** S/M/L

## Strategische Maßnahmen
- **Handlung:** … | **Clerk.io Feature:** … | **Impact:** … | **Aufwand:** S/M/L

WICHTIG:
- Jede Maßnahme MUSS einen konkreten Datenpunkt aus den oben genannten Daten referenzieren (z. B. "Begriff X mit ${fmtInt(1240)} Suchen und 0 % CR").
- Keine generischen Empfehlungen.
- Sprich BogenSport-spezifisch (Recurve, Compound, Pfeile, Zubehör), wenn die Daten es hergeben.
`;
}
