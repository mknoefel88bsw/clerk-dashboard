import type { ComparisonResult, ZeroEntry } from '../../types';
import { fmtInt } from '../../utils/formatting';

interface Props {
  comparison: ComparisonResult;
}

function ZeroList({
  title,
  entries,
  emptyText,
  toneClass,
  showPeriods,
}: {
  title: string;
  entries: ZeroEntry[];
  emptyText: string;
  toneClass: string;
  showPeriods?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
      <h3 className={`text-sm font-semibold mb-3 ${toneClass}`}>{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {entries.slice(0, 30).map((e) => (
            <li key={e.term} className="py-2 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-900 truncate">{e.term}</span>
              <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                {fmtInt(e.searches)} Suchen
                {showPeriods && e.periodsAffected > 1 ? ` · ${e.periodsAffected} Perioden` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ZeroResultsTracker({ comparison }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ZeroList
        title="Neu als Zero-Result"
        entries={comparison.zeroNew}
        emptyText="Keine neuen Zero-Results."
        toneClass="text-red-600"
      />
      <ZeroList
        title="Behoben (kein Zero-Result mehr)"
        entries={comparison.zeroResolved}
        emptyText="Nichts behoben in diesem Vergleich."
        toneClass="text-emerald-600"
      />
      <ZeroList
        title="Persistent über mehrere Perioden"
        entries={comparison.zeroPersistent}
        emptyText="Keine persistierenden Zero-Results."
        toneClass="text-amber-600"
        showPeriods
      />
    </div>
  );
}
