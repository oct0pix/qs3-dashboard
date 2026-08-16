import { useEffect, useRef, useState } from "react"
import { Spark } from "@/components/Spark"
import { fetchLive, fetchSnapshot, resetEndpoint } from "@/lib/api"
import type { Live, Snapshot } from "@/lib/types"

const LIVE_MS = 1000
const SNAP_MS = 60_000
const HISTORY = 90

function num(n: number, d = 0) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

function bytes(n: number) {
  const u = ["B", "KB", "MB", "GB", "TB"]
  let v = n
  let i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${num(v, 1)} ${u[i]}`
}

/** One reading. Label, value, unit. Nothing else. */
function Cell({
  label, value, unit, tone,
}: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div>
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="font-display tabular text-[1.6rem] leading-none sm:text-3xl"
          style={tone ? { color: tone } : undefined}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[0.65rem] text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [live, setLive] = useState<Live | null>(null)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [down, setDown] = useState<string | null>(null)
  const history = useRef<number[]>([])

  useEffect(() => {
    let alive = true

    const tickLive = async () => {
      try {
        const l = await fetchLive()
        if (!alive) return
        history.current = [...history.current, l.quotes_per_sec].slice(-HISTORY)
        setLive(l)
        setDown(null)
      } catch (e) {
        if (!alive) return
        // The tunnel hands out a new hostname when it restarts, so a failure
        // is more often a moved address than a dead server. Rediscover before
        // declaring anything down.
        resetEndpoint()
        setDown((e as Error).message)
      }
    }

    const tickSnap = async () => {
      try {
        const s = await fetchSnapshot()
        if (alive) setSnap(s)
      } catch { /* the live strip already reports connection state */ }
    }

    tickLive(); tickSnap()
    const a = setInterval(tickLive, LIVE_MS)
    const b = setInterval(tickSnap, SNAP_MS)
    return () => { alive = false; clearInterval(a); clearInterval(b) }
  }, [])

  const behind = live?.seconds_behind ?? null
  const ok = behind !== null && behind < 5 && !down
  const tone = ok ? "var(--live)" : "var(--reject)"

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* live strip */}
        <div className="flex items-center gap-3 border-b border-rule pb-4">
          <span
            className="inline-block size-2 shrink-0 rounded-full"
            style={{
              background: tone,
              animation: ok ? "pulse 2s ease-in-out infinite" : undefined,
            }}
          />
          <span className="font-display text-lg">System 3.0</span>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
            {down ? "bağlanılamıyor" : ok ? "canlı" : "gecikmeli"}
          </span>
          <span className="ml-auto font-mono tabular text-[0.65rem] text-muted-foreground">
            {behind !== null ? `${num(behind, 1)} sn geride` : "—"}
          </span>
        </div>

        {/* the numbers that move */}
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
          <div>
            <Cell
              label="Kotasyon"
              value={live ? num(live.quotes_per_sec) : "—"}
              unit="/sn"
              tone={tone}
            />
            <div className="mt-2">
              <Spark values={history.current} stroke={tone} />
            </div>
          </div>
          <Cell label="İşlem" value={live ? num(live.trades_per_sec) : "—"} unit="/sn" />
          <Cell
            label="Gecikme"
            value={live?.median_lag_ms ? num(live.median_lag_ms) : "—"}
            unit="ms"
          />
          <Cell
            label="Mesaj"
            value={live ? num(live.total_messages) : "—"}
          />
        </div>

        {/* live book */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Sembol", "Mid", "Spread", "Tik/dk"].map((h, i) => (
                  <th key={h} className={`pb-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] font-normal text-muted-foreground ${i ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(live?.symbols ?? []).map((s) => (
                <tr key={s.symbol} className="border-b border-rule/50 last:border-0">
                  <td className="py-1.5 font-mono text-[0.78rem]">{s.symbol}</td>
                  <td className="py-1.5 text-right font-mono tabular text-[0.78rem]">
                    {s.mid.toLocaleString("tr-TR", { maximumSignificantDigits: 7 })}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular text-[0.78rem] text-muted-foreground">
                    {num(s.spread_bps, 3)}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular text-[0.78rem] text-muted-foreground">
                    {num(s.ticks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* slow half */}
        {snap && (
          <>
            <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-rule pt-6 sm:grid-cols-4">
              <Cell label="Deneme" value={num(snap.research.total_attempts)} />
              <Cell
                label="Elenen"
                value={num(snap.research.total_attempts - snap.research.passing)}
                tone="var(--reject)"
              />
              <Cell label="Veri" value={bytes(snap.inventory.db_bytes)} />
              <Cell
                label="Bar"
                value={num(snap.inventory.history.reduce((a, h) => a + h.bars, 0))}
              />
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule">
                    {["Denenen", "Net", "Poz.", ""].map((h, i) => (
                      <th key={i} className={`pb-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] font-normal text-muted-foreground ${i ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...snap.research.experiments].reverse().slice(0, 12).map((e, i) => {
                    const bad = (e.net_bps ?? -1) <= 0 || (e.cpcv_positive ?? 0) < 0.7
                    const p = e.params ?? {}
                    const desc = [p["yön"], p["boyut"] && `${p["boyut"]}·${p["dilim"] ?? ""}`,
                                  p["lookback"] && `b${p["lookback"]}`,
                                  (p["horizon"] ?? p["ufuk"]) && `t${p["horizon"] ?? p["ufuk"]}`]
                      .filter(Boolean).join(" ") || e.kind
                    return (
                      <tr key={i} className="border-b border-rule/50 last:border-0">
                        <td className="py-1.5 font-mono text-[0.74rem]">{desc}</td>
                        <td className="py-1.5 text-right font-mono tabular text-[0.74rem]"
                            style={bad ? { color: "var(--reject)" } : undefined}>
                          {e.net_bps === null ? "—" : num(e.net_bps, 1)}
                        </td>
                        <td className="py-1.5 text-right font-mono tabular text-[0.74rem] text-muted-foreground">
                          {e.cpcv_positive === null ? "—" : `%${num(e.cpcv_positive * 100)}`}
                        </td>
                        <td className="py-1.5 pl-2 text-right">
                          {bad && (
                            <span className="stamp inline-block px-1 py-px font-mono text-[0.52rem] uppercase">
                              elendi
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!live && !down && (
          <p className="mt-8 font-mono text-xs text-muted-foreground">bağlanıyor…</p>
        )}
      </div>
    </div>
  )
}
