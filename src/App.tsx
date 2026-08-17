import { useEffect, useRef, useState } from "react"
import { Spark } from "@/components/Spark"
import { Tape, type Series } from "@/components/Tape"
import { Attempts } from "@/components/Attempts"
import { fetchLive, fetchSnapshot, resetEndpoint } from "@/lib/api"
import { NAME, STAGE, VERSION } from "@/lib/version"
import type { Live, Snapshot } from "@/lib/types"

const LIVE_MS = 1000
const SNAP_MS = 60_000
const HISTORY = 240 // dört dakikalık iz

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

function Rule({ children }: { children: string }) {
  return (
    <div className="mt-9 border-t border-rule pt-3 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </div>
  )
}

export default function App() {
  const [live, setLive] = useState<Live | null>(null)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [down, setDown] = useState<string | null>(null)
  const rate = useRef<number[]>([])
  // Symbol → mid history. A ref, not state: it is appended to every second and
  // making it state would cost a second render per tick for nothing — the
  // `live` update already drives the frame.
  const tape = useRef<Map<string, number[]>>(new Map())

  useEffect(() => {
    let alive = true

    const tickLive = async () => {
      try {
        const l = await fetchLive()
        if (!alive) return
        rate.current = [...rate.current, l.quotes_per_sec].slice(-90)
        const seen = new Set<string>()
        for (const s of l.symbols) {
          seen.add(s.symbol)
          const prev = tape.current.get(s.symbol) ?? []
          tape.current.set(s.symbol, [...prev, s.mid].slice(-HISTORY))
        }
        // A symbol that drops out of the active list stops being drawn rather
        // than freezing at its last price, which would read as a flat market
        // instead of an absent one.
        for (const k of tape.current.keys()) if (!seen.has(k)) tape.current.delete(k)
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
  // Ölçüldü: tape kesikli akıyor, on saniyelik bir pencere boş okurken
  // çevresindeki dakikada 2.346 satır vardı. Beş saniyelik bir eşik bu yüzden
  // sürekli "gecikmeli" yazardı — olmayan bir arızayı bildiren bir gösterge,
  // hiç gösterge olmamasından kötüdür.
  const ok = behind !== null && behind < 120 && !down
  const tone = ok ? "var(--live)" : "var(--reject)"

  const series: Series[] = live
    ? live.symbols
        .map((s) => ({ symbol: s.symbol, values: tape.current.get(s.symbol) ?? [] }))
        .filter((s) => s.values.length >= 2)
        .slice(0, 8)
    : []
  const watched = Math.max(0, ...series.map((s) => s.values.length))

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
          <span className="font-display text-lg">{NAME}</span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
            {STAGE} {VERSION}
          </span>
          <span className="ml-auto flex items-baseline gap-3 font-mono tabular text-[0.65rem] text-muted-foreground">
            <span style={{ color: tone }}>
              {down ? "bağlanılamıyor" : ok ? "canlı" : "gecikmeli"}
            </span>
            <span>{behind !== null ? `${num(behind, 1)} sn` : "—"}</span>
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
              <Spark values={rate.current} stroke={tone} />
            </div>
          </div>
          <Cell label="İşlem" value={live ? num(live.trades_per_sec) : "—"} unit="/sn" />
          <Cell
            label="Gecikme"
            value={live?.median_lag_ms ? num(live.median_lag_ms) : "—"}
            unit="ms"
          />
          <Cell label="Mesaj" value={live ? num(live.total_messages) : "—"} />
        </div>

        {/* the tape itself */}
        <div className="mt-7">
          <Tape series={series} seconds={watched} />
        </div>

        {/* live book */}
        <div className="mt-5 overflow-x-auto">
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
            <Rule>Denenen</Rule>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
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

            <div className="mt-6">
              <Attempts experiments={snap.research.experiments} />
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
