import { useCallback } from 'react';
import { getDuckDB } from '../utils/duckdb';
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
let virtualFileCounter = 0;

export function useCSVParser() {
  const parseCSV = useCallback(
    async (text: string, fileName: string, fallbackIndex: number): Promise<ParseOutcome> => {
      const t0 = performance.now();
      let conn: Awaited<ReturnType<Awaited<ReturnType<typeof getDuckDB>>['connect']>> | null = null;
      const virtualName = `clerk_${++virtualFileCounter}.csv`;
      let registered = false;
      try {
        const db = await getDuckDB();
        await db.registerFileText(virtualName, text);
        registered = true;
        conn = await db.connect();

        const result = await conn.query(
          `SELECT * FROM read_csv_auto('${virtualName}', ALL_VARCHAR=TRUE, HEADER=TRUE)`,
        );
        const headers = result.schema.fields.map((f) => f.name);

        const mapping = buildColumnMapping(headers);
        if (mapping.missing.length > 0) {
          return {
            period: null,
            error: `Pflichtspalten fehlen: ${mapping.missing.join(', ')}`,
          };
        }

        const warnings: string[] = [];
        if (mapping.unknown.length > 0) {
          warnings.push(`Unbekannte Spalten ignoriert: ${mapping.unknown.join(', ')}`);
        }

        const dateCol = mapping.dateColumn;
        const rows: RawTermRow[] = [];
        const seen = new Set<string>();
        const dateSample: string[] = [];

        const arr = result.toArray();
        for (let i = 0; i < arr.length; i++) {
          const record = arr[i];
          const obj: Record<string, unknown> = {};
          for (const h of headers) obj[h] = record[h];
          const row = rowFromCSV(obj, mapping.mapping, mapping.unknown);
          if (!row) continue;
          const key = row.search_term.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push(row);
          if (dateCol && dateSample.length < DATE_SAMPLE_LIMIT) {
            const v = obj[dateCol];
            if (v != null) dateSample.push(String(v));
          }
        }

        if (rows.length === 0) {
          return { period: null, error: 'Keine gültigen Zeilen im CSV.' };
        }

        let inference = inferPeriodFromFilename(fileName);
        if (!inference && dateSample.length > 0) {
          inference = inferPeriodFromDates(dateSample);
        }
        if (!inference) {
          inference = fallbackPeriod(fallbackIndex);
          warnings.push('Zeitraum aus Dateiname nicht erkannt, Fallback-Bezeichnung verwendet.');
        }

        const t1 = performance.now();
        // eslint-disable-next-line no-console
        console.log(
          `[DuckDB] ${fileName}: ${Math.round(t1 - t0)} ms, ${arr.length} Zeilen geparst, ${rows.length} unique`,
        );

        return {
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
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unbekannt';
        return { period: null, error: `DuckDB-Parser-Fehler: ${message}` };
      } finally {
        if (conn) {
          try {
            await conn.close();
          } catch {
            /* ignore */
          }
        }
        if (registered) {
          try {
            const db = await getDuckDB();
            await db.dropFile(virtualName);
          } catch {
            /* ignore */
          }
        }
      }
    },
    [],
  );

  return { parseCSV };
}
