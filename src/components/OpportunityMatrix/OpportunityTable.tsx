import { useMemo, useState } from 'react';
import type { ComparisonResult, OpportunityEntry } from '../../types';
import { fmtInt, fmtPct } from '../../utils/formatting';

interface Props {
  comparison: ComparisonResult;
}

type SortKey = 'score' | 'searches' | 'cr' | 'term';

const TREND_PILL: Record<string, string> = {
  rising: 'text-emerald-600 bg-emerald-50',
  falling: 'text-red-600 bg-red-50',
  volatile: 'text-amber-600 bg-amber-50',
  stable: 'text-slate-600 bg-slate-100',
};

function priorityColor(score: number, max: number): string {
  if (max === 0) return 'bg-slate-100';
  const ratio = score / max;
  if (ratio > 0.66) return 'bg-red-50';
  if (ratio > 0.33) return 'bg-amber-50';
  return 'bg-emerald-50';
}

export function OpportunityTable({ comparison }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [desc, setDesc] = useState(true);

  const rows = useMemo(() => {
    const arr = [...comparison.opportunityRows].slice(0, 100);
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'term') cmp = a.term.localeCompare(b.term);
      else if (sortKey === 'searches') cmp = a.searches - b.searches;
      else if (sortKey === 'cr') cmp = a.conversionRate - b.conversionRate;
      else cmp = a.score - b.score;
      return desc ? -cmp : cmp;
    });
    return arr;
  }, [comparison.opportunityRows, sortKey, desc]);

  const maxScore = useMemo(
    () => rows.reduce((m: number, r: OpportunityEntry) => Math.max(m, r.score), 0),
    [rows],
  );

  const onHeader = (key: SortKey) => {
    if (sortKey === key) setDesc(!desc);
    else {
      setSortKey(key);
      setDesc(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">
          Opportunity Matrix · Score = Suchvolumen × (1 − Conversion Rate)
        </h3>
      </div>
      <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <Th label="Begriff" active={sortKey === 'term'} desc={desc} onClick={() => onHeader('term')} align="left" />
              <Th label="Volumen" active={sortKey === 'searches'} desc={desc} onClick={() => onHeader('searches')} align="right" />
              <Th label="CR" active={sortKey === 'cr'} desc={desc} onClick={() => onHeader('cr')} align="right" />
              <Th label="Score" active={sortKey === 'score'} desc={desc} onClick={() => onHeader('score')} align="right" />
              <th className="px-3 py-2 text-left font-medium text-slate-500">Trend</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">Empfehlung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.term} className={priorityColor(r.score, maxScore)}>
                <td className="px-3 py-2 font-medium text-slate-900">{r.term}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtInt(r.searches)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(r.conversionRate)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtInt(r.score)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-1 rounded ${TREND_PILL[r.trend]}`}>{r.trend}</span>
                </td>
                <td className="px-3 py-2 text-slate-700">{r.recommendation}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  Keine Begriffe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  label,
  active,
  desc,
  onClick,
  align,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
  align: 'left' | 'right';
}) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 font-medium text-slate-500 cursor-pointer select-none hover:text-slate-900 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {label}
      {active && <span className="ml-1">{desc ? '↓' : '↑'}</span>}
    </th>
  );
}
