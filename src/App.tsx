import { useCallback, useState } from 'react';
import { AIAnalysisPanel } from './components/AIAnalysis/AIAnalysisPanel';
import { TermSearch } from './components/DeepDive/TermSearch';
import { DriveFileList } from './components/DriveLoader/DriveFileList';
import { DriveSourceForm } from './components/DriveLoader/DriveSourceForm';
import { Header } from './components/Layout/Header';
import { SettingsPanel } from './components/Layout/SettingsPanel';
import { KPIGrid } from './components/KPITiles/KPIGrid';
import { OpportunityTable } from './components/OpportunityMatrix/OpportunityTable';
import { TermTable } from './components/TermTable/TermTable';
import { TimeSeriesChart } from './components/TimeSeriesChart/TimeSeriesChart';
import { WinnersLosersChart } from './components/WinnersLosers/WinnersLosersChart';
import { ZeroResultsTracker } from './components/ZeroResults/ZeroResultsTracker';
import { useCSVParser } from './hooks/useCSVParser';
import { useComparison } from './hooks/useComparison';
import { useDriveLoader } from './hooks/useDriveLoader';
import { DashboardProvider, useDashboard } from './store/dashboardStore';
import type { Period } from './types';

function DashboardShell() {
  const {
    periods,
    addPeriods,
    selectedPeriodIds,
    basePeriodId,
    googleApiKey,
  } = useDashboard();

  const [view, setView] = useState<'source' | 'list' | 'dashboard'>(
    periods.length > 0 ? 'dashboard' : 'source',
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const drive = useDriveLoader();
  const { parseCSV } = useCSVParser();

  const onLoadFolder = useCallback(
    async (folderUrl: string) => {
      const ok = await drive.listFolder(folderUrl, googleApiKey);
      if (ok) setView('list');
    },
    [drive, googleApiKey],
  );

  const onLoadFiles = useCallback(async () => {
    drive.setStatus('loading');
    const selected = drive.state.files.filter((f) => f.selected);
    const newPeriods: Period[] = [];
    let idx = periods.length;
    const concurrency = 4;
    let i = 0;

    async function worker() {
      while (i < selected.length) {
        const my = i++;
        const f = selected[my];
        drive.updateFileStatus(f.id, 'loading');
        try {
          const text = await drive.downloadFileText(f.id, googleApiKey);
          drive.updateFileStatus(f.id, 'parsing');
          const outcome = await parseCSV(text, f.name, idx + my);
          if (outcome.period) {
            newPeriods.push(outcome.period);
            drive.updateFileStatus(f.id, 'done');
          } else {
            drive.updateFileStatus(f.id, 'error', outcome.error);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unbekannt';
          drive.updateFileStatus(f.id, 'error', msg);
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, selected.length) }, () => worker());
    await Promise.all(workers);

    if (newPeriods.length > 0) {
      addPeriods(newPeriods);
      setView('dashboard');
      drive.reset();
    } else {
      drive.setStatus('listed');
    }
  }, [drive, parseCSV, addPeriods, googleApiKey, periods.length]);

  const comparison = useComparison(periods, selectedPeriodIds, basePeriodId);

  if (view === 'source' || (view === 'dashboard' && periods.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full">
          <DriveSourceForm onLoadFolder={onLoadFolder} loading={drive.state.status === 'listing'} />
          {drive.state.error && (
            <div className="max-w-3xl mx-auto mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {drive.state.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <DriveFileList
          files={drive.state.files}
          onToggle={drive.toggleFile}
          onSelectAll={drive.setAllSelected}
          onLoad={onLoadFiles}
          onBack={() => {
            drive.reset();
            setView('source');
          }}
          loading={drive.state.status === 'loading'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onLoadMore={() => {
          drive.reset();
          setView('source');
        }}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="px-6 py-6 space-y-6 max-w-[1600px] mx-auto">
        {comparison.selectedPeriods.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            Bitte mindestens eine Periode oben in der Kopfzeile auswählen.
          </div>
        ) : (
          <>
            <KPIGrid comparison={comparison} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TimeSeriesChart
                title="Gesamtsuchen"
                metric="totalSearches"
                periods={comparison.selectedPeriods}
                kpis={comparison.kpisPerPeriod}
                format="int"
                color="#2563eb"
              />
              <TimeSeriesChart
                title="Ø CTR"
                metric="avgCTR"
                periods={comparison.selectedPeriods}
                kpis={comparison.kpisPerPeriod}
                format="pct"
                color="#f59e0b"
              />
              <TimeSeriesChart
                title="Ø Conversion Rate"
                metric="avgCR"
                periods={comparison.selectedPeriods}
                kpis={comparison.kpisPerPeriod}
                format="pct"
                color="#16a34a"
              />
              <TimeSeriesChart
                title="Revenue"
                metric="revenue"
                periods={comparison.selectedPeriods}
                kpis={comparison.kpisPerPeriod}
                format="eur"
                color="#7c3aed"
              />
              <TimeSeriesChart
                title="Zero-Result-Quote"
                metric="zeroResultRate"
                periods={comparison.selectedPeriods}
                kpis={comparison.kpisPerPeriod}
                format="pct"
                color="#dc2626"
              />
              <TimeSeriesChart
                title="Einzigartige Begriffe"
                metric="uniqueTerms"
                periods={comparison.selectedPeriods}
                kpis={comparison.kpisPerPeriod}
                format="int"
                color="#0891b2"
              />
            </div>

            <TermTable comparison={comparison} />
            <WinnersLosersChart winners={comparison.winners} losers={comparison.losers} />
            <ZeroResultsTracker comparison={comparison} />
            <TermSearch comparison={comparison} />
            <OpportunityTable comparison={comparison} />
            <AIAnalysisPanel comparison={comparison} />
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}
