import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface Props {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ values, color = '#2563eb', height = 24, width = 80 }: Props) {
  if (values.length === 0) return <span className="text-slate-300">—</span>;
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div style={{ width, height }} className="inline-block">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
