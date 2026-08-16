/**
 * A line of recent history, built from the poll itself.
 *
 * No historical endpoint feeds this — the page accumulates what it has seen
 * since it opened. That is the honest scope of a live instrument: it shows you
 * the present and the last minute of it, and does not pretend to remember
 * what happened before you looked.
 */
export function Spark({
  values,
  width = 120,
  height = 28,
  stroke = "var(--live)",
}: {
  values: number[]
  width?: number
  height?: number
  stroke?: string
}) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden />
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)

  const d = values
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / span) * (height - 2) - 1
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.25" />
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / span) * (height - 2) - 1}
        r="2"
        fill={stroke}
      />
    </svg>
  )
}
