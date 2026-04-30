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
  term: string;
  comparison: ComparisonResult;
  onClose: () => void;
}

export function TermDetailModal({ term, comparison, onClose }: Props) {
  const { selectedPeriods } = comparison;

  const data = selectedPeriods.map((p) => {
    const row = p.rows.find((r) => r.search_term === term);
    return {
      period: p.label,
      searches: row?.searches ?? 0,
      ctr: row?.ctr ?? 0,
      cr: row?.conversion_rate ?? 0,
      revenue: row?.revenue ?? 0,
    };
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{term}</h2>
            <p className="text-sm text-slate-500">Verlauf über alle gewählten Perioden</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtInt(v)} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => fmtPct(v)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(value: number, name) => {
                    if (name === 'Suchen') return fmtInt(value);
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

          <div className="overflow-x-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
}
