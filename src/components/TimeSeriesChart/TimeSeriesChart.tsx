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
import type { AggregatedKPIs, MetricKey, Period } from '../../types';
import { fmtEur, fmtInt, fmtPct } from '../../utils/formatting';

interface Props {
  title: string;
  metric: MetricKey;
  periods: Period[];
  kpis: Map<string, AggregatedKPIs>;
  format: 'int' | 'pct' | 'eur';
  color?: string;
}

export function TimeSeriesChart({ title, metric, periods, kpis, format, color = '#2563eb' }: Props) {
  const data = periods.map((p) => {
    const k = kpis.get(p.id);
    return {
      period: p.label,
      value: k ? (k[metric] as number) : 0,
    };
  });

  const formatter = format === 'pct' ? (n: number) => fmtPct(n) : format === 'eur' ? fmtEur : fmtInt;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              tickFormatter={(v) => formatter(v)}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => [formatter(value), title]}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
            <Legend wrapperStyle={{ display: 'none' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
