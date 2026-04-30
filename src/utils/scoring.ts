import type { AggregatedKPIs, Period, RawTermRow, TrendKind } from '../types';

export function aggregateKPIs(period: Period): AggregatedKPIs {
  let totalSearches = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let revenue = 0;
  let zeroResultSearches = 0;
  let hasRevenue = false;

  for (const row of period.rows) {
    totalSearches += row.searches;
    totalClicks += row.clicks;
    totalConversions += row.conversions;
    if (row.revenue > 0) hasRevenue = true;
    revenue += row.revenue;
    if (row.no_results > 0) zeroResultSearches += row.searches;
  }

  return {
    totalSearches,
    avgCTR: totalSearches > 0 ? totalClicks / totalSearches : 0,
    avgCR: totalSearches > 0 ? totalConversions / totalSearches : 0,
    revenue,
    zeroResultRate: totalSearches > 0 ? zeroResultSearches / totalSearches : 0,
    uniqueTerms: period.rows.length,
    hasRevenue,
  };
}

export function deltaPct(current: number, base: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(base)) return null;
  if (base === 0) return current === 0 ? 0 : null;
  return ((current - base) / base) * 100;
}

export function opportunityScore(row: RawTermRow): number {
  return row.searches * (1 - Math.min(1, Math.max(0, row.conversion_rate)));
}

export function recommendationFor(row: RawTermRow, score: number): string {
  if (row.no_results > 0) return 'Synonym anlegen oder Sortiment prüfen (Zero-Result)';
  if (row.conversion_rate < 0.005 && row.searches > 50) return 'Landing-Optimierung & Boosting prüfen';
  if (row.ctr < 0.05 && row.searches > 100) return 'Suchergebnis-Reihenfolge / Thumbnails prüfen';
  if (score > 1000) return 'Großer Hebel — Merchandising-Push erwägen';
  return 'Beobachten';
}

export function classifyTrend(values: number[]): TrendKind {
  if (values.length < 2) return 'stable';
  const n = values.length;
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;

  const sd = Math.sqrt(values.reduce((a, b) => a + (b - meanY) ** 2, 0) / n);
  const cv = meanY === 0 ? 0 : sd / Math.abs(meanY);

  if (cv > 0.3 && Math.abs(slope) < 0.05 * Math.abs(meanY || 1)) return 'volatile';
  const normSlope = meanY === 0 ? slope : slope / Math.abs(meanY);
  if (normSlope > 0.05) return 'rising';
  if (normSlope < -0.05) return 'falling';
  return 'stable';
}
