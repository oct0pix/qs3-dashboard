const TR = "tr-TR"

export function bytes(n: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toLocaleString(TR, { maximumFractionDigits: 1 })} ${units[i]}`
}

export function count(n: number): string {
  return n.toLocaleString(TR)
}

export function duration(seconds: number): string {
  const s = Math.floor(seconds)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d) return `${d}g ${h}s`
  if (h) return `${h}s ${m}dk`
  return `${m}dk`
}

export function bps(n: number | null, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toLocaleString(TR, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function pct(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return `%${(n * 100).toLocaleString(TR, { maximumFractionDigits: 0 })}`
}

export function shortDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(TR, {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
}

export function clock(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(TR, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
