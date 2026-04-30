import { useDashboard } from '../../store/dashboardStore';

interface Props {
  onOpenSettings: () => void;
  onLoadMore: () => void;
}

export function Header({ onOpenSettings, onLoadMore }: Props) {
  const {
    periods,
    selectedPeriodIds,
    toggleSelected,
    selectAll,
    deselectAll,
    basePeriodId,
    setBasePeriodId,
  } = useDashboard();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 no-print">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Clerk.io Search Analytics
          </h1>
          <p className="text-xs text-slate-500">Zeitreihen-Vergleich · {periods.length} Perioden geladen</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Perioden:</span>
          {periods.map((p) => {
            const active = selectedPeriodIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSelected(p.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                }`}
              >
                {p.label}
              </button>
            );
          })}
          <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
            Alle
          </button>
          <button onClick={deselectAll} className="text-xs text-slate-500 hover:underline">
            Keine
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-slate-600">
            Basis:
            <select
              value={basePeriodId ?? ''}
              onChange={(e) => setBasePeriodId(e.target.value || null)}
              className="text-xs border border-slate-300 rounded px-2 py-1"
            >
              <option value="">—</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={onLoadMore}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded"
          >
            + Daten laden
          </button>
          <button
            onClick={onOpenSettings}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded"
            aria-label="Einstellungen"
          >
            ⚙ Einstellungen
          </button>
        </div>
      </div>
    </header>
  );
}
