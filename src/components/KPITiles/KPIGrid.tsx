import type { ComparisonResult } from '../../types';
import { fmtEur, fmtInt, fmtPct } from '../../utils/formatting';
import { deltaPct } from '../../utils/scoring';
import { KPICard } from './KPICard';

interface Props {
  comparison: ComparisonResult;
}

export function KPIGrid({ comparison }: Props) {
  const { basePeriod, latestPeriod, kpisPerPeriod } = comparison;
  if (!basePeriod || !latestPeriod) return null;

  const base = kpisPerPeriod.get(basePeriod.id);
  const cur = kpisPerPeriod.get(latestPeriod.id);
  if (!base || !cur) return null;

  const showRevenue = base.hasRevenue || cur.hasRevenue;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KPICard
        label="Gesamtsuchen"
        value={fmtInt(cur.totalSearches)}
        deltaPct={deltaPct(cur.totalSearches, base.totalSearches)}
      />
      <KPICard
        label="Ø CTR"
        value={fmtPct(cur.avgCTR)}
        deltaPct={deltaPct(cur.avgCTR, base.avgCTR)}
      />
      <KPICard
        label="Ø Conversion Rate"
        value={fmtPct(cur.avgCR)}
        deltaPct={deltaPct(cur.avgCR, base.avgCR)}
      />
      <KPICard
        label="Revenue"
        value={showRevenue ? fmtEur(cur.revenue) : '—'}
        deltaPct={showRevenue ? deltaPct(cur.revenue, base.revenue) : null}
        hint={!showRevenue ? 'Keine Revenue-Spalte' : undefined}
      />
      <KPICard
        label="Zero-Result-Quote"
        value={fmtPct(cur.zeroResultRate)}
        deltaPct={deltaPct(cur.zeroResultRate, base.zeroResultRate)}
        invertedDelta
      />
      <KPICard
        label="Einzigartige Begriffe"
        value={fmtInt(cur.uniqueTerms)}
        deltaPct={deltaPct(cur.uniqueTerms, base.uniqueTerms)}
      />
    </div>
  );
}
