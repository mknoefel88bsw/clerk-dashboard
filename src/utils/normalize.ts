import type { Period, RawTermRow } from '../types';

const COLUMN_SYNONYMS: Record<keyof Omit<RawTermRow, 'unknownColumns'>, string[]> = {
  search_term: ['search_term', 'query', 'searchterm', 'term', 'keyword', 'searchquery', 'search query', 'suchbegriff'],
  searches: ['searches', 'count', 'search_count', 'search count', 'queries', 'volume', 'searchvolume', 'searches_count', 'suchen', 'anzahl_suchen'],
  clicks: ['clicks', 'click_through', 'clickcount', 'click count', 'totalclicks', 'klicks'],
  ctr: ['ctr', 'click_through_rate', 'click through rate', 'clickrate', 'klickrate'],
  conversions: ['conversions', 'orders', 'sales_count', 'order_count', 'transaktionen', 'bestellungen'],
  conversion_rate: ['conversion_rate', 'cr', 'conversionrate', 'cvr', 'konversionsrate'],
  revenue: ['revenue', 'sales', 'turnover', 'umsatz', 'gmv'],
  avg_order_value: ['avg_order_value', 'aov', 'average_order_value', 'avgordervalue', 'durchschn_bestellwert'],
  no_results: ['no_results', 'zero_results', 'noresults', 'no_result', 'zeroresults', 'nullsuchen'],
  results_count: ['results_count', 'result_count', 'results', 'hits', 'treffer'],
};

const DATE_COLUMN_SYNONYMS = ['date', 'datum', 'period', 'timestamp', 'time', 'day'];

const MONTH_DE: Record<string, number> = {
  januar: 1, februar: 2, maerz: 3, märz: 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
};
const MONTH_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH_LABEL_DE = [
  '', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface ColumnMapping {
  field: keyof Omit<RawTermRow, 'unknownColumns'>;
  csvColumn: string;
}

export interface MappingResult {
  mapping: Partial<Record<keyof Omit<RawTermRow, 'unknownColumns'>, string>>;
  unknown: string[];
  missing: string[];
  dateColumn?: string;
}

export function buildColumnMapping(headers: string[]): MappingResult {
  const mapping: MappingResult['mapping'] = {};
  const used = new Set<string>();
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeKey(h) }));

  for (const field of Object.keys(COLUMN_SYNONYMS) as (keyof typeof COLUMN_SYNONYMS)[]) {
    const synonyms = COLUMN_SYNONYMS[field].map(normalizeKey);
    const match = normalizedHeaders.find((h) => synonyms.includes(h.norm));
    if (match) {
      mapping[field] = match.raw;
      used.add(match.raw);
    }
  }

  let dateColumn: string | undefined;
  for (const h of normalizedHeaders) {
    if (DATE_COLUMN_SYNONYMS.includes(h.norm)) {
      dateColumn = h.raw;
      used.add(h.raw);
      break;
    }
  }

  const unknown = normalizedHeaders.filter((h) => !used.has(h.raw)).map((h) => h.raw);

  const requiredFields: (keyof typeof COLUMN_SYNONYMS)[] = ['search_term', 'searches'];
  const missing = requiredFields.filter((f) => !mapping[f]);

  return { mapping, unknown, missing, dateColumn };
}

function parseNumber(input: unknown): number {
  if (input == null) return 0;
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  let s = String(input).trim();
  if (!s) return 0;
  s = s.replace(/[€$%\s]/g, '');
  // detect "1.234,56" (de) vs "1,234.56" (en)
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > 1.5) return value / 100;
  return value;
}

export function rowFromCSV(
  raw: Record<string, unknown>,
  mapping: MappingResult['mapping'],
  unknownColumns: string[],
): RawTermRow | null {
  const termRaw = mapping.search_term ? raw[mapping.search_term] : undefined;
  if (termRaw == null || String(termRaw).trim() === '') return null;
  const search_term = String(termRaw).trim();

  const searches = mapping.searches ? parseNumber(raw[mapping.searches]) : 0;
  const clicks = mapping.clicks ? parseNumber(raw[mapping.clicks]) : 0;
  const conversions = mapping.conversions ? parseNumber(raw[mapping.conversions]) : 0;
  const revenue = mapping.revenue ? parseNumber(raw[mapping.revenue]) : 0;
  const avg_order_value = mapping.avg_order_value ? parseNumber(raw[mapping.avg_order_value]) : 0;
  const no_results = mapping.no_results ? parseNumber(raw[mapping.no_results]) : 0;
  const results_count = mapping.results_count ? parseNumber(raw[mapping.results_count]) : 0;

  let ctr = mapping.ctr ? normalizeRate(parseNumber(raw[mapping.ctr])) : 0;
  if (!ctr && searches > 0) ctr = clicks / searches;

  let conversion_rate = mapping.conversion_rate ? normalizeRate(parseNumber(raw[mapping.conversion_rate])) : 0;
  if (!conversion_rate && searches > 0) conversion_rate = conversions / searches;

  const unknownObj: Record<string, unknown> = {};
  for (const col of unknownColumns) unknownObj[col] = raw[col];

  return {
    search_term,
    searches,
    clicks,
    ctr,
    conversions,
    conversion_rate,
    revenue,
    avg_order_value,
    no_results,
    results_count,
    unknownColumns: unknownObj,
  };
}

export interface PeriodInferenceResult {
  label: string;
  source: Period['source'];
  sortKey: number;
  id: string;
}

export function inferPeriodFromFilename(fileName: string): PeriodInferenceResult | null {
  const base = fileName.replace(/\.[^.]+$/, '').toLowerCase();

  // YYYY-MM, YYYY_MM, YYYYMM
  let m = base.match(/(\d{4})[-_]?(\d{1,2})/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) {
      const monthLabel = MONTH_LABEL_DE[month] ?? `Monat ${month}`;
      return {
        label: `${monthLabel} ${year}`,
        source: 'filename',
        sortKey: year * 100 + month,
        id: `${year}-${String(month).padStart(2, '0')}`,
      };
    }
  }

  // YYYY-Q1
  m = base.match(/(\d{4})[-_]?q([1-4])/i);
  if (m) {
    const year = parseInt(m[1], 10);
    const q = parseInt(m[2], 10);
    return {
      label: `Q${q} ${year}`,
      source: 'filename',
      sortKey: year * 100 + q * 3,
      id: `${year}-Q${q}`,
    };
  }

  // Month names
  for (const [name, monthNum] of [
    ...Object.entries(MONTH_DE),
    ...Object.entries(MONTH_EN),
  ]) {
    if (base.includes(name)) {
      const yearMatch = base.match(/(20\d{2})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
      return {
        label: `${MONTH_LABEL_DE[monthNum]} ${year}`,
        source: 'filename',
        sortKey: year * 100 + monthNum,
        id: `${year}-${String(monthNum).padStart(2, '0')}`,
      };
    }
  }

  return null;
}

export function inferPeriodFromDates(dates: (string | undefined)[]): PeriodInferenceResult | null {
  const parsed = dates
    .map((d) => (d ? new Date(d) : null))
    .filter((d): d is Date => !!d && !isNaN(d.getTime()));
  if (parsed.length === 0) return null;
  const min = new Date(Math.min(...parsed.map((d) => d.getTime())));
  const max = new Date(Math.max(...parsed.map((d) => d.getTime())));
  const fmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const minLabel = fmt.format(min);
  const maxLabel = fmt.format(max);
  const label = minLabel === maxLabel ? minLabel : `${minLabel} – ${maxLabel}`;
  return {
    label,
    source: 'date-column',
    sortKey: min.getTime(),
    id: `${min.toISOString().slice(0, 10)}_${max.toISOString().slice(0, 10)}`,
  };
}

export function fallbackPeriod(index: number): PeriodInferenceResult {
  return {
    label: `Periode ${index + 1}`,
    source: 'order',
    sortKey: index,
    id: `file:${index}`,
  };
}
