const numberFmt = new Intl.NumberFormat('de-DE');
const decimalFmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const percentFmt = new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percentFmtSigned = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export function fmtInt(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return numberFmt.format(Math.round(value));
}

export function fmtDecimal(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return decimalFmt.format(value);
}

export function fmtPct(value: number | null | undefined, fromFraction = true): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return percentFmt.format(fromFraction ? value : value / 100);
}

export function fmtPctSigned(value: number | null | undefined, fromFraction = true): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return percentFmtSigned.format(fromFraction ? value : value / 100);
}

export function fmtEur(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return currencyFmt.format(value);
}

export function fmtDelta(deltaPct: number | null): string {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return '—';
  return fmtPctSigned(deltaPct, false);
}

export function deltaTone(deltaPct: number | null, inverted = false): 'good' | 'bad' | 'neutral' {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return 'neutral';
  if (Math.abs(deltaPct) < 0.5) return 'neutral';
  const positive = deltaPct > 0;
  if (inverted) return positive ? 'bad' : 'good';
  return positive ? 'good' : 'bad';
}

export function arrowFor(deltaPct: number | null): '↑' | '↓' | '→' {
  if (deltaPct == null || !Number.isFinite(deltaPct) || Math.abs(deltaPct) < 0.5) return '→';
  return deltaPct > 0 ? '↑' : '↓';
}
