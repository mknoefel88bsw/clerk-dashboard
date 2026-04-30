import Papa from 'papaparse';
import { useCallback } from 'react';
import type { Period, RawTermRow } from '../types';
import {
  buildColumnMapping,
  fallbackPeriod,
  inferPeriodFromDates,
  inferPeriodFromFilename,
  rowFromCSV,
} from '../utils/normalize';

export interface ParseOutcome {
  period: Period | null;
  error?: string;
}

const DATE_SAMPLE_LIMIT = 500;

export function useCSVParser() {
  const parseCSV = useCallback(async (text: string, fileName: string, fallbackIndex: number): Promise<ParseOutcome> => {
    return new Promise((resolve) => {
      let mapping: ReturnType<typeof buildColumnMapping> | null = null;
      const rows: RawTermRow[] = [];
      const seen = new Set<string>();
      const dateSample: string[] = [];
      const warnings: string[] = [];
      let aborted = false;
      let abortError: string | null = null;

      Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        worker: true,
        chunkSize: 1024 * 512,
        chunk: (results: Papa.ParseResult<Record<string, unknown>>, parser: Papa.Parser) => {
          if (aborted) return;

          if (!mapping) {
            const headers = results.meta.fields ?? [];
            mapping = buildColumnMapping(headers);
            if (mapping.missing.length > 0) {
              aborted = true;
              abortError = `Pflichtspalten fehlen: ${mapping.missing.join(', ')}`;
              parser.abort();
              return;
            }
            if (mapping.unknown.length > 0) {
              warnings.push(`Unbekannte Spalten ignoriert: ${mapping.unknown.join(', ')}`);
            }
          }

          const dateCol = mapping.dateColumn;
          for (const raw of results.data) {
            const row = rowFromCSV(raw, mapping.mapping, mapping.unknown);
            if (!row) continue;
            const key = row.search_term.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            rows.push(row);

            if (dateCol && dateSample.length < DATE_SAMPLE_LIMIT) {
              const v = raw[dateCol];
              if (v != null) dateSample.push(String(v));
            }
          }
        },
        complete: () => {
          if (aborted) {
            resolve({ period: null, error: abortError ?? 'Abgebrochen.' });
            return;
          }
          if (!mapping) {
            resolve({ period: null, error: 'CSV ist leer.' });
            return;
          }
          if (rows.length === 0) {
            resolve({ period: null, error: 'Keine gültigen Zeilen im CSV.' });
            return;
          }

          let inference = inferPeriodFromFilename(fileName);
          if (!inference && dateSample.length > 0) {
            inference = inferPeriodFromDates(dateSample);
          }
          if (!inference) {
            inference = fallbackPeriod(fallbackIndex);
            warnings.push('Zeitraum aus Dateiname nicht erkannt, Fallback-Bezeichnung verwendet.');
          }

          resolve({
            period: {
              id: inference.id,
              label: inference.label,
              source: inference.source,
              fileName,
              rows,
              warnings,
              parsedAt: Date.now(),
              sortKey: inference.sortKey,
            },
          });
        },
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unbekannt';
          resolve({ period: null, error: `Parser-Fehler: ${message}` });
        },
      });
    });
  }, []);

  return { parseCSV };
}
