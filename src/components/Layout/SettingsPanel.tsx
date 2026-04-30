import { useDashboard } from '../../store/dashboardStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: Props) {
  const {
    googleApiKey,
    setGoogleApiKey,
    anthropicApiKey,
    setAnthropicApiKey,
    rememberKeys,
    setRememberKeys,
    resetPeriods,
  } = useDashboard();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Einstellungen</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Google API-Key (Drive)
            </label>
            <input
              type="password"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Anthropic API-Key (KI-Analyse)
            </label>
            <input
              type="password"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={rememberKeys}
              onChange={(e) => setRememberKeys(e.target.checked)}
              className="rounded border-slate-300"
            />
            Im Browser speichern (localStorage)
          </label>

          <p className="text-xs text-slate-500">
            Die Keys verlassen deinen Browser nie — sie werden nur direkt an Google bzw. Anthropic gesendet.
          </p>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                if (confirm('Alle geladenen Perioden zurücksetzen?')) {
                  resetPeriods();
                  onClose();
                }
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Alle Perioden zurücksetzen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
