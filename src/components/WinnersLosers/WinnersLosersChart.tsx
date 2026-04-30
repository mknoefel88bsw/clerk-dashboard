import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { WinnerLoserEntry } from '../../types';
import { fmtInt } from '../../utils/formatting';

interface Props {
  winners: WinnerLoserEntry[];
  losers: WinnerLoserEntry[];
}

function HorizontalChart({ entries, color, title }: { entries: WinnerLoserEntry[]; color: string; title: string }) {
  const data = entries.slice(0, 10).map((e) => ({
    term: e.term,
    delta: e.deltaAbs,
    pct: e.deltaPct,
    base: e.baseValue,
    cur: e.currentValue,
  }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">Keine Daten.</p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => fmtInt(v)} />
              <YAxis
                type="category"
                dataKey="term"
                width={140}
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                interval={0}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value: number) => fmtInt(value)}
                labelFormatter={(label) => `Begriff: ${label}`}
              />
              <Bar dataKey="delta" isAnimationActive={false}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function WinnersLosersChart({ winners, losers }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HorizontalChart entries={winners} color="#16a34a" title="Top 10 Gewinner (Δ Suchvolumen)" />
      <HorizontalChart entries={losers} color="#dc2626" title="Top 10 Verlierer (Δ Suchvolumen)" />
    </div>
  );
}
