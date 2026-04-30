import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ComparisonResult } from '../../types';
import { fmtEur, fmtInt, fmtPct } from '../../utils/formatting';

interface Props {
  comparison: ComparisonResult;
}

export function TermSearch({ comparison }: Props) {
  const [query, setQuery] = useState('');
  const { selectedPeriods } = comparison;

  const allTerms = useMemo(() => {
    const set = new Set<string>();
    for (const p of selectedPeriods) {
      for (const r of p.rows) set.add(r.search_term);
    }
    return Array.from(set).sort();
  }, [selectedPeriods]);

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allTerms.filter((t) => t.toLowerCase().includes(q)).slice(0, 8);
  }, [query, allTerms]);

  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!activeTerm) return [];
    return selectedPeriods.map((p) => {
      const row = p.rows.find((r) => r.search_term === activeTerm);
      return {
        period: p.label,
        searches: row?.searches ?? 0,
        ctr: row?.ctr ?? 0,
        cr: row?.conversion_rate ?? 0,
        revenue: row?.revenue ?? 0,
      };
    });
  }, [activeTerm, selectedPeriods]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Begriff-Suche & Deep Dive</h3>
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchbegriff eingeben …"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setActiveTerm(s);
                  setQuery(s);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTerm && data.length > 0 && (
        <>
          <div className="h-72 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtInt(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtPct(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(value: number, name) => {
                    if (name === 'CTR' || name === 'CR') return fmtPct(value);
                    return fmtInt(value);
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="searches" name="Suchen" stroke="#2563eb" strokeWidth={2} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR" stroke="#f59e0b" strokeWidth={2} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="cr" name="CR" stroke="#16a34a" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-500">Periode</th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">Suchen</th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">CTR</th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">CR</th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-900">{d.period}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtInt(d.searches)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(d.ctr)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(d.cr)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {d.revenue > 0 ? fmtEur(d.revenue) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {!activeTerm && (
        <p className="text-sm text-slate-400">
          Begriff aus den Vorschlägen wählen, um den vollständigen Verlauf zu sehen.
        </p>
      )}
    </div>
  );
}
