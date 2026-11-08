const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

export function fmt(n: number): string {
  if (!isFinite(n)) return '∞'
  const neg = n < 0
  n = Math.abs(n)
  if (n < 1000) return (neg ? '-' : '') + Math.floor(n).toLocaleString()
  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3))
  const scaled = n / Math.pow(1000, tier)
  const s = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)
  return (neg ? '-' : '') + s.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1') + SUFFIXES[tier]
}

export const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${sec}s`
  return `${sec}s`
}

export const vibrate = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}
