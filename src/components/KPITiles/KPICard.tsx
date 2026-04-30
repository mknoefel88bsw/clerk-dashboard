import { arrowFor, deltaTone, fmtDelta } from '../../utils/formatting';

interface Props {
  label: string;
  value: string;
  deltaPct: number | null;
  invertedDelta?: boolean;
  hint?: string;
}

const TONE_CLS = {
  good: 'text-emerald-600 bg-emerald-50',
  bad: 'text-red-600 bg-red-50',
  neutral: 'text-slate-500 bg-slate-100',
};

export function KPICard({ label, value, deltaPct, invertedDelta, hint }: Props) {
  const tone = deltaTone(deltaPct, invertedDelta);
  const arrow = arrowFor(deltaPct);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">{value}</div>
      <div className={`mt-2 inline-flex items-center self-start text-xs font-medium px-2 py-1 rounded ${TONE_CLS[tone]}`}>
        <span className="mr-1">{arrow}</span>
        {fmtDelta(deltaPct)}
        <span className="ml-1 text-slate-500 font-normal">vs. Basis</span>
      </div>
      {hint && <div className="mt-2 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
