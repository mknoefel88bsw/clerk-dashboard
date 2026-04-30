import { useMemo } from 'react';
import type {
  AggregatedKPIs,
  ComparisonResult,
  OpportunityEntry,
  Period,
  RawTermRow,
  TermDevelopment,
  WinnerLoserEntry,
  ZeroEntry,
} from '../types';
import { aggregateKPIs, classifyTrend, opportunityScore, recommendationFor } from '../utils/scoring';

export function useComparison(
  allPeriods: Period[],
  selectedIds: Set<string>,
  basePeriodId: string | null,
): ComparisonResult {
  return useMemo(() => {
    const selectedPeriods = allPeriods
      .filter((p) => selectedIds.has(p.id))
      .sort((a, b) => a.sortKey - b.sortKey);

    const kpisPerPeriod = new Map<string, AggregatedKPIs>();
    for (const p of selectedPeriods) kpisPerPeriod.set(p.id, aggregateKPIs(p));

    const basePeriod =
      selectedPeriods.find((p) => p.id === basePeriodId) ?? selectedPeriods[0] ?? null;
    const latestPeriod =
      selectedPeriods[selectedPeriods.length - 1] ?? null;

    const empty: ComparisonResult = {
      basePeriod: null,
      latestPeriod: null,
      selectedPeriods: [],
      kpisPerPeriod: new Map(),
      winners: [],
      losers: [],
      zeroNew: [],
      zeroResolved: [],
      zeroPersistent: [],
      opportunityRows: [],
      topTerms: [],
    };
    if (!basePeriod || !latestPeriod || selectedPeriods.length === 0) return empty;

    const baseIndex = mapByTerm(basePeriod.rows);
    const latestIndex = mapByTerm(latestPeriod.rows);

    const winners: WinnerLoserEntry[] = [];
    const losers: WinnerLoserEntry[] = [];

    for (const [term, latestRow] of latestIndex) {
      const baseRow = baseIndex.get(term);
      if (!baseRow) continue;
      const deltaAbs = latestRow.searches - baseRow.searches;
      const deltaPct = baseRow.searches === 0 ? null : (deltaAbs / baseRow.searches) * 100;
      const entry: WinnerLoserEntry = {
        term,
        baseValue: baseRow.searches,
        currentValue: latestRow.searches,
        deltaAbs,
        deltaPct,
        metric: 'searches',
      };
      if (deltaAbs > 0) winners.push(entry);
      else if (deltaAbs < 0) losers.push(entry);
    }
    winners.sort((a, b) => b.deltaAbs - a.deltaAbs);
    losers.sort((a, b) => a.deltaAbs - b.deltaAbs);

    const zeroNew: ZeroEntry[] = [];
    const zeroResolved: ZeroEntry[] = [];
    const zeroPersistent: ZeroEntry[] = [];

    for (const [term, latestRow] of latestIndex) {
      if (latestRow.no_results > 0) {
        const baseRow = baseIndex.get(term);
        const wasZero = baseRow ? baseRow.no_results > 0 : false;
        const periodsAffected = countPeriodsAffected(selectedPeriods, term, (r) => r.no_results > 0);
        if (!wasZero) {
          zeroNew.push({ term, searches: latestRow.searches, periodsAffected });
        } else {
          zeroPersistent.push({ term, searches: latestRow.searches, periodsAffected });
        }
      }
    }
    for (const [term, baseRow] of baseIndex) {
      if (baseRow.no_results > 0) {
        const latestRow = latestIndex.get(term);
        if (!latestRow || latestRow.no_results === 0) {
          const periodsAffected = countPeriodsAffected(selectedPeriods, term, (r) => r.no_results > 0);
          zeroResolved.push({ term, searches: baseRow.searches, periodsAffected });
        }
      }
    }

    zeroNew.sort((a, b) => b.searches - a.searches);
    zeroResolved.sort((a, b) => b.searches - a.searches);
    zeroPersistent.sort(
      (a, b) => b.periodsAffected - a.periodsAffected || b.searches - a.searches,
    );

    const opportunityRows: OpportunityEntry[] = [];
    for (const row of latestPeriod.rows) {
      const score = opportunityScore(row);
      const trend = trendForTerm(selectedPeriods, row.search_term, 'searches');
      opportunityRows.push({
        term: row.search_term,
        searches: row.searches,
        conversionRate: row.conversion_rate,
        score,
        trend,
        recommendation: recommendationFor(row, score),
      });
    }
    opportunityRows.sort((a, b) => b.score - a.score);

    const totalsByTerm = new Map<string, number>();
    for (const p of selectedPeriods) {
      for (const r of p.rows) {
        totalsByTerm.set(r.search_term, (totalsByTerm.get(r.search_term) ?? 0) + r.searches);
      }
    }
    const topTermNames = Array.from(totalsByTerm.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term]) => term);

    const topTerms: TermDevelopment[] = topTermNames.map((term) => {
      const searchesPerPeriod = selectedPeriods.map((p) => ({
        periodId: p.id,
        value: getRow(p, term)?.searches ?? 0,
      }));
      const ctrPerPeriod = selectedPeriods.map((p) => ({
        periodId: p.id,
        value: getRow(p, term)?.ctr ?? 0,
      }));
      const crPerPeriod = selectedPeriods.map((p) => ({
        periodId: p.id,
        value: getRow(p, term)?.conversion_rate ?? 0,
      }));
      const trend = classifyTrend(searchesPerPeriod.map((x) => x.value));
      return {
        term,
        totalSearches: totalsByTerm.get(term) ?? 0,
        searchesPerPeriod,
        ctrPerPeriod,
        crPerPeriod,
        trend,
      };
    });

    return {
      basePeriod,
      latestPeriod,
      selectedPeriods,
      kpisPerPeriod,
      winners,
      losers,
      zeroNew,
      zeroResolved,
      zeroPersistent,
      opportunityRows,
      topTerms,
    };
  }, [allPeriods, selectedIds, basePeriodId]);
}

function mapByTerm(rows: RawTermRow[]): Map<string, RawTermRow> {
  const m = new Map<string, RawTermRow>();
  for (const r of rows) m.set(r.search_term, r);
  return m;
}

function getRow(period: Period, term: string): RawTermRow | undefined {
  return period.rows.find((r) => r.search_term === term);
}

function countPeriodsAffected(
  periods: Period[],
  term: string,
  predicate: (r: RawTermRow) => boolean,
): number {
  let count = 0;
  for (const p of periods) {
    const row = getRow(p, term);
    if (row && predicate(row)) count++;
  }
  return count;
}

function trendForTerm(periods: Period[], term: string, field: keyof RawTermRow) {
  const values = periods.map((p) => {
    const r = getRow(p, term);
    const v = r ? Number(r[field]) : 0;
    return Number.isFinite(v) ? v : 0;
  });
  return classifyTrend(values);
}
