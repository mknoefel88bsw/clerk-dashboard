export interface RawTermRow {
  search_term: string;
  searches: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
  avg_order_value: number;
  no_results: number;
  results_count: number;
  unknownColumns: Record<string, unknown>;
}

export interface Period {
  id: string;
  label: string;
  source: 'filename' | 'date-column' | 'order';
  fileName: string;
  rows: RawTermRow[];
  warnings: string[];
  parsedAt: number;
  sortKey: number;
}

export interface AggregatedKPIs {
  totalSearches: number;
  avgCTR: number;
  avgCR: number;
  revenue: number;
  zeroResultRate: number;
  uniqueTerms: number;
  hasRevenue: boolean;
}

export type TrendKind = 'rising' | 'falling' | 'volatile' | 'stable';

export interface AIRecommendation {
  bucket: 'sofort' | 'mittelfristig' | 'strategisch';
  action: string;
  clerkFeature: string;
  expectedImpact: string;
  effort: 'S' | 'M' | 'L';
  dataReference: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  selected: boolean;
  status: 'idle' | 'loading' | 'parsing' | 'done' | 'error';
  error?: string;
}

export type MetricKey =
  | 'totalSearches'
  | 'avgCTR'
  | 'avgCR'
  | 'revenue'
  | 'zeroResultRate'
  | 'uniqueTerms';

export interface KPIDelta {
  current: number;
  base: number;
  deltaPct: number | null;
}

export interface ComparisonResult {
  basePeriod: Period | null;
  latestPeriod: Period | null;
  selectedPeriods: Period[];
  kpisPerPeriod: Map<string, AggregatedKPIs>;
  winners: WinnerLoserEntry[];
  losers: WinnerLoserEntry[];
  zeroNew: ZeroEntry[];
  zeroResolved: ZeroEntry[];
  zeroPersistent: ZeroEntry[];
  opportunityRows: OpportunityEntry[];
  topTerms: TermDevelopment[];
}

export interface WinnerLoserEntry {
  term: string;
  baseValue: number;
  currentValue: number;
  deltaAbs: number;
  deltaPct: number | null;
  metric: 'searches' | 'revenue';
}

export interface ZeroEntry {
  term: string;
  searches: number;
  periodsAffected: number;
}

export interface OpportunityEntry {
  term: string;
  searches: number;
  conversionRate: number;
  score: number;
  trend: TrendKind;
  recommendation: string;
}

export interface TermDevelopment {
  term: string;
  totalSearches: number;
  searchesPerPeriod: { periodId: string; value: number }[];
  ctrPerPeriod: { periodId: string; value: number }[];
  crPerPeriod: { periodId: string; value: number }[];
  trend: TrendKind;
}
