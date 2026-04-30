import { useState } from 'react';
import { useDashboard } from '../../store/dashboardStore';

interface Props {
  onLoadFolder: (folderUrl: string) => void;
  loading: boolean;
}

export function DriveSourceForm({ onLoadFolder, loading }: Props) {
  const { googleApiKey, setGoogleApiKey, rememberKeys, setRememberKeys } = useDashboard();
  const [folderUrl, setFolderUrl] = useState('');

  const canSubmit = folderUrl.trim().length > 0 && googleApiKey.trim().length > 0 && !loading;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        Clerk.io Search Analytics — Zeitreihen-Dashboard
      </h1>
      <p className="text-slate-600 mb-6">
        Lade Onsite-Search-CSV-Exporte aus deinem Google-Drive-Ordner und vergleiche die Performance über mehrere Zeiträume.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Google Drive Ordner-Link
          </label>
          <input
            type="text"
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Google API-Key
          </label>
          <input
            type="password"
            value={googleApiKey}
            onChange={(e) => setGoogleApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">
            Erstelle einen API-Key in der{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google Cloud Console
            </a>{' '}
            und aktiviere die Google Drive API. Der Ordner muss als „Jeder mit dem Link kann ansehen" freigegeben sein.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={rememberKeys}
            onChange={(e) => setRememberKeys(e.target.checked)}
            className="rounded border-slate-300"
          />
          API-Keys im Browser speichern (localStorage)
        </label>

        <button
          type="button"
          onClick={() => onLoadFolder(folderUrl)}
          disabled={!canSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading ? 'Lade Ordner …' : 'Ordner laden'}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">Erwartetes CSV-Format:</p>
        <p>Spalten u. a.: <code className="bg-slate-100 px-1 rounded">search_term</code>, <code className="bg-slate-100 px-1 rounded">searches</code>, <code className="bg-slate-100 px-1 rounded">clicks</code>, <code className="bg-slate-100 px-1 rounded">conversions</code>, <code className="bg-slate-100 px-1 rounded">revenue</code>, <code className="bg-slate-100 px-1 rounded">no_results</code></p>
        <p>Empfohlene Dateinamen: <code className="bg-slate-100 px-1 rounded">clerk_2025-01.csv</code>, <code className="bg-slate-100 px-1 rounded">2025-Q1.csv</code></p>
      </div>
    </div>
  );
}
