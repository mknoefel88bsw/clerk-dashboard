import { useState } from 'react';
import type { ComparisonResult } from '../../types';
import { fmtInt } from '../../utils/formatting';
import { Sparkline } from './Sparkline';
import { TermDetailModal } from './TermDetailModal';

interface Props {
  comparison: ComparisonResult;
}

const TREND_LABEL: Record<string, { label: string; cls: string }> = {
  rising: { label: '↑ steigend', cls: 'text-emerald-600 bg-emerald-50' },
  falling: { label: '↓ fallend', cls: 'text-red-600 bg-red-50' },
  volatile: { label: '↕ volatil', cls: 'text-amber-600 bg-amber-50' },
  stable: { label: '→ stabil', cls: 'text-slate-600 bg-slate-100' },
};

export function TermTable({ comparison }: Props) {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const { topTerms } = comparison;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Top 20 Suchbegriffe — Entwicklung</h3>
        <span className="text-xs text-slate-400">
          Klick auf Begriff für Detail-Verlauf
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Begriff</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Volumen ges.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">CTR-Verlauf</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">CR-Verlauf</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topTerms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  Keine Begriffe.
                </td>
              </tr>
            )}
            {topTerms.map((t) => {
              const tInfo = TREND_LABEL[t.trend];
              return (
                <tr
                  key={t.term}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedTerm(t.term)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{t.term}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-700">
                    {fmtInt(t.totalSearches)}
                  </td>
                  <td className="px-4 py-3">
                    <Sparkline values={t.ctrPerPeriod.map((p) => p.value)} color="#2563eb" />
                  </td>
                  <td className="px-4 py-3">
                    <Sparkline values={t.crPerPeriod.map((p) => p.value)} color="#16a34a" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${tInfo.cls}`}>{tInfo.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTerm && (
        <TermDetailModal
          term={selectedTerm}
          comparison={comparison}
          onClose={() => setSelectedTerm(null)}
        />
      )}
    </div>
  );
}
