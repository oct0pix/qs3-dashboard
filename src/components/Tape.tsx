/**
 * The tape, drawn as it arrives.
 *
 * Each line is one symbol's mid price, expressed as basis points away from
 * where it stood when the page opened. That normalisation is what makes the
 * lines comparable at all: BTC near 100,000 and a small-cap near 0.4 share no
 * usable axis in absolute terms, but they share one perfectly in relative
 * terms — and relative movement is the only thing a trading system cares
 * about.
 *
 * There is no historical feed behind this. The page accumulates what it has
 * watched since it opened, which is the honest scope of a live instrument.
 */

export type Series = { symbol: string; values: number[] }

const H = 170
const W = 640
const PAD_R = 58 // room for the labels riding the right edge

export function Tape({ series, seconds }: { series: Series[]; seconds: number }) {
  const drawable = series.filter((s) => s.values.length >= 2)

  if (drawable.length === 0) {
    return (
      <div
        className="flex items-center justify-center font-mono text-[0.62rem] text-muted-foreground"
        style={{ height: H }}
      >
        tape birikiyor…
      </div>
    )
  }

  // Basis points from each series' own starting point.
  const rel = drawable.map((s) => {
    const base = s.values[0]
    return {
      symbol: s.symbol,
      bps: s.values.map((v) => ((v - base) / base) * 10000),
    }
  })

  // One shared, symmetric scale. Symmetric because a chart whose zero line
  // drifts with the data hides which way the market actually went.
  const reach = Math.max(4, ...rel.flatMap((r) => r.bps.map(Math.abs)))
  const y = (b: number) => H / 2 - (b / reach) * (H / 2 - 12)

  // Longest series defines the time axis; shorter ones (symbols that entered
  // the top list late) are drawn right-aligned so "now" is always the right
  // edge for every line.
  const span = Math.max(...rel.map((r) => r.bps.length))
  const x = (i: number, n: number) =>
    ((i + (span - n)) / Math.max(1, span - 1)) * (W - PAD_R)

  // The biggest mover is the one worth being able to follow across the chart.
  const lead = rel.reduce((a, b) =>
    Math.abs(b.bps[b.bps.length - 1]) > Math.abs(a.bps[a.bps.length - 1]) ? b : a
  )

  // Oran korunuyor. `preserveAspectRatio="none"` çizgileri ekranın enine yayar
  // ama aynı dönüşüm yazıları yayvanlaştırır ve daireleri elipse çevirir.
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="block h-auto w-full overflow-visible"
      role="img"
      aria-label="Canlı fiyat izi"
    >
      {/* zero */}
      <line
        x1="0" y1={H / 2} x2={W - PAD_R} y2={H / 2}
        stroke="var(--rule)" strokeWidth="1" vectorEffect="non-scaling-stroke"
      />
      {[reach, -reach].map((b) => (
        <g key={b}>
          <line
            x1="0" y1={y(b)} x2={W - PAD_R} y2={y(b)}
            stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={W - PAD_R + 6} y={y(b) + 3}
            className="font-mono" fontSize="9" fill="var(--muted-foreground)"
          >
            {b > 0 ? "+" : ""}{Math.round(b)}
          </text>
        </g>
      ))}

      {rel.map((r) => {
        const isLead = r.symbol === lead.symbol
        const n = r.bps.length
        const d = r.bps
          .map((b, i) => `${i ? "L" : "M"}${x(i, n).toFixed(1)},${y(b).toFixed(1)}`)
          .join(" ")
        const last = r.bps[n - 1]
        return (
          <g key={r.symbol}>
            <path
              d={d}
              fill="none"
              stroke={isLead ? "var(--reject)" : "var(--foreground)"}
              strokeOpacity={isLead ? 1 : 0.28}
              strokeWidth={isLead ? 1.5 : 1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {isLead && (
              <>
                <circle cx={W - PAD_R} cy={y(last)} r="2.5" fill="var(--reject)" />
                <text
                  x={W - PAD_R + 6} y={y(last) + 3}
                  className="font-mono" fontSize="9.5" fill="var(--reject)"
                >
                  {r.symbol.replace("USDT", "")}
                </text>
              </>
            )}
          </g>
        )
      })}

      <text
        x="0" y={H - 2}
        className="font-mono" fontSize="9" fill="var(--muted-foreground)"
      >
        son {seconds < 60 ? `${seconds} sn` : `${Math.round(seconds / 60)} dk`} · bps
      </text>
    </svg>
  )
}
