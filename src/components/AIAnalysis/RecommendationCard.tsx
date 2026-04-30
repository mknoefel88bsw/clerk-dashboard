import type { AIRecommendation } from '../../types';

interface Props {
  rec: AIRecommendation;
}

const EFFORT_CLS: Record<'S' | 'M' | 'L', string> = {
  S: 'bg-emerald-100 text-emerald-700',
  M: 'bg-amber-100 text-amber-700',
  L: 'bg-red-100 text-red-700',
};

const EFFORT_LABEL: Record<'S' | 'M' | 'L', string> = {
  S: 'Aufwand: klein',
  M: 'Aufwand: mittel',
  L: 'Aufwand: groß',
};

export function RecommendationCard({ rec }: Props) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-900 mb-2">{rec.action || '—'}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {rec.clerkFeature && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
            Clerk.io: {rec.clerkFeature}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded font-medium ${EFFORT_CLS[rec.effort]}`}>
          {EFFORT_LABEL[rec.effort]}
        </span>
      </div>
      {rec.expectedImpact && (
        <p className="text-xs text-slate-600 leading-relaxed">{rec.expectedImpact}</p>
      )}
    </div>
  );
}
