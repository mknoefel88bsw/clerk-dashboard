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

export function useCSVParser() {
  const parseCSV = useCallback(async (text: string, fileName: string, fallbackIndex: number): Promise<ParseOutcome> => {
    return new Promise((resolve) => {
      Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (result) => {
          if (!result.data || result.data.length === 0) {
            resolve({ period: null, error: 'CSV ist leer.' });
            return;
          }
          const headers = result.meta.fields ?? [];
          const mapping = buildColumnMapping(headers);
          const warnings: string[] = [];

          if (mapping.missing.length > 0) {
            resolve({
              period: null,
              error: `Pflichtspalten fehlen: ${mapping.missing.join(', ')}`,
            });
            return;
          }
          if (mapping.unknown.length > 0) {
            warnings.push(`Unbekannte Spalten ignoriert: ${mapping.unknown.join(', ')}`);
          }

          const rows: RawTermRow[] = [];
          const seen = new Set<string>();
          for (const raw of result.data) {
            const row = rowFromCSV(raw, mapping.mapping, mapping.unknown);
            if (!row) continue;
            const key = row.search_term.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            rows.push(row);
          }

          if (rows.length === 0) {
            resolve({ period: null, error: 'Keine gültigen Zeilen im CSV.' });
            return;
          }

          let inference = inferPeriodFromFilename(fileName);
          if (!inference && mapping.dateColumn) {
            const dates = result.data.map((r) => {
              const v = r[mapping.dateColumn!];
              return v != null ? String(v) : undefined;
            });
            inference = inferPeriodFromDates(dates);
          }
          if (!inference) {
            inference = fallbackPeriod(fallbackIndex);
            warnings.push('Zeitraum aus Dateiname nicht erkannt, Fallback-Bezeichnung verwendet.');
          }

          const period: Period = {
            id: inference.id,
            label: inference.label,
            source: inference.source,
            fileName,
            rows,
            warnings,
            parsedAt: Date.now(),
            sortKey: inference.sortKey,
          };
          resolve({ period });
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
