import type { DriveFile } from '../../types';

interface Props {
  files: DriveFile[];
  onToggle: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onLoad: () => void;
  onBack: () => void;
  loading: boolean;
}

const STATUS_LABEL: Record<DriveFile['status'], { label: string; cls: string }> = {
  idle: { label: 'Wartet', cls: 'bg-slate-100 text-slate-600' },
  loading: { label: 'Lade …', cls: 'bg-blue-100 text-blue-700' },
  parsing: { label: 'Parsing …', cls: 'bg-blue-100 text-blue-700' },
  done: { label: 'Fertig', cls: 'bg-emerald-100 text-emerald-700' },
  error: { label: 'Fehler', cls: 'bg-red-100 text-red-700' },
};

export function DriveFileList({ files, onToggle, onSelectAll, onLoad, onBack, loading }: Props) {
  const allSelected = files.every((f) => f.selected);
  const noneSelected = files.every((f) => !f.selected);
  const selectedCount = files.filter((f) => f.selected).length;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Gefundene CSV-Dateien ({files.length})
        </h2>
        <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">
          ← Zurück
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 text-sm">
        <button
          onClick={() => onSelectAll(true)}
          disabled={allSelected}
          className="text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
        >
          Alle auswählen
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => onSelectAll(false)}
          disabled={noneSelected}
          className="text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
        >
          Alle abwählen
        </button>
        <span className="ml-auto text-slate-500">{selectedCount} ausgewählt</span>
      </div>

      <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
        <ul className="divide-y divide-slate-100">
          {files.map((f) => {
            const s = STATUS_LABEL[f.status];
            return (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={f.selected}
                  onChange={() => onToggle(f.id)}
                  disabled={loading}
                  className="rounded border-slate-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{f.name}</div>
                  {f.error && (
                    <div className="text-xs text-red-600 truncate">{f.error}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${s.cls}`}>{s.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={onLoad}
        disabled={loading || selectedCount === 0}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-lg transition-colors"
      >
        {loading ? 'Lade Dateien …' : `${selectedCount} ausgewählte Dateien laden`}
      </button>
    </div>
  );
}
