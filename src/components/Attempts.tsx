/**
 * Every idea that was tested, plotted where its evidence put it.
 *
 * Across: the share of CPCV paths that came out positive — how consistent the
 * result was across folds. Up: net edge in basis points, after cost.
 *
 * The box in the top right is the only region where a strategy would be worth
 * running, and drawing it is the entire point of the chart. A list of numbers
 * lets a reader hunt for the one row that looks good; a chart with a marked
 * acceptance region shows at a glance that it is empty. That emptiness is the
 * honest result of the work so far, so it is what gets the ink.
 */
import type { Experiment } from "@/lib/types"

const W = 640
const H = 260
const L = 34
const R = 10
const T = 12
const B = 26

const MIN_PATHS = 0.7 // CPCV eşiği

export function Attempts({ experiments }: { experiments: Experiment[] }) {
  const pts = experiments.filter(
    (e) => e.net_bps !== null && e.cpcv_positive !== null
  )

  if (pts.length < 2) {
    return (
      <div
        className="flex items-center justify-center font-mono text-[0.62rem] text-muted-foreground"
        style={{ height: H }}
      >
        henüz çizilecek deneme yok
      </div>
    )
  }

  // Uçlara pay bırakılıyor. Payı olmayan bir eksende en iyi sonuç kabul
  // kutusunun tam kenarına oturuyor ve yarısı kırpılıyordu — grafiğin
  // anlatmak istediği tek nokta o.
  const vals = pts.map((p) => p.net_bps as number)
  const hi = Math.max(5, ...vals) * 1.15
  const lo = Math.min(-5, ...vals) * 1.08

  const x = (p: number) => L + p * (W - L - R)
  const y = (b: number) => T + (1 - (b - lo) / (hi - lo)) * (H - T - B)

  // Üç durum, ikisi değil. Eşikleri geçen bir deneme henüz kabul edilmiş
  // değildir: Deflated Sharpe Ratio kaç deneme yapıldığını hesaba katarak
  // ayrıca onaylamalı. O onay olmadan noktayı dolu göstermek, panonun tam da
  // DSR'ın önlemek için var olduğu hatayı yapması olurdu — bu yüzden onaysız
  // nokta içi boş çiziliyor.
  const state = (p: Experiment) =>
    (p.net_bps as number) > 0 && (p.cpcv_positive as number) >= MIN_PATHS
      ? p.dsr !== null && p.dsr > 0.95
        ? "onaylı"
        : "onaysız"
      : "elenen"

  const inBox = pts.filter((p) => state(p) !== "elenen").length
  const confirmed = pts.filter((p) => state(p) === "onaylı").length

  // Yatay eksende okunacak birkaç işaret. Fazlası ızgaraya döner.
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  // CPCV oranları kaba adımlarla geliyor, çoğu deneme %0'da. Üst üste binen
  // noktalar tek bir lekeye dönüşüp kaç deneme olduğunu gizliyordu. Sabit bir
  // karıştırma — indise bağlı, rastgele değil — noktaları birbirinden ayırıyor
  // ve her yeniden çizimde aynı yere düşüyor.
  const jitter = (i: number) => (((i * 2654435761) % 1000) / 1000 - 0.5) * 0.035

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block h-auto w-full"
        role="img"
        aria-label={`${pts.length} denemenin net getiri ve CPCV tutarlılığına göre dağılımı`}
      >
        {/* kabul bölgesi */}
        <rect
          x={x(MIN_PATHS)} y={y(hi)}
          width={x(1) - x(MIN_PATHS)} height={y(0) - y(hi)}
          fill="var(--foreground)" fillOpacity="0.04"
          stroke="var(--rule)" strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        {/* Etiket kutunun alt kenarında: üstte, en iyi denemenin tam üzerine
            düşüyordu ve grafiğin göstermek istediği tek noktayı kapatıyordu. */}
        <text
          x={x(MIN_PATHS) + 6} y={y(0) - 6}
          className="font-mono" fontSize="9" fill="var(--muted-foreground)"
        >
          kabul bölgesi
        </text>

        {/* sıfır çizgisi: maliyet düşüldükten sonra başa baş */}
        <line
          x1={L} y1={y(0)} x2={W - R} y2={y(0)}
          stroke="var(--foreground)" strokeOpacity="0.45" strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {[hi, 0, lo].map((v) => (
          <text
            key={v} x={L - 5} y={y(v) + 3} textAnchor="end"
            className="font-mono tabular" fontSize="9" fill="var(--muted-foreground)"
          >
            {v > 0 ? "+" : ""}{Math.round(v)}
          </text>
        ))}

        {ticks.map((t) => (
          <text
            key={t} x={x(t)} y={H - 8} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"}
            className="font-mono tabular" fontSize="9" fill="var(--muted-foreground)"
          >
            %{t * 100}
          </text>
        ))}

        {pts.map((p, i) => {
          const s = state(p)
          return (
            <circle
              key={i}
              cx={x(Math.min(1, Math.max(0, (p.cpcv_positive as number) + jitter(i))))}
              cy={y(p.net_bps as number)}
              r={s === "elenen" ? 3 : 4.5}
              fill={
                s === "onaylı" ? "var(--live)"
                : s === "onaysız" ? "none"
                : "var(--reject)"
              }
              fillOpacity={s === "elenen" ? 0.45 : 1}
              stroke={s === "onaysız" ? "var(--foreground)" : "none"}
              strokeWidth={s === "onaysız" ? 1.4 : 0}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>

      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[0.58rem] text-muted-foreground">
        <span>← CPCV pozitif yol oranı →</span>
        <span className="flex items-center gap-3">
          <span>{pts.length} deneme</span>
          <span className="flex items-center gap-1">
            <svg width="9" height="9"><circle cx="4.5" cy="4.5" r="3.5"
              fill="none" stroke="var(--foreground)" strokeWidth="1.4" /></svg>
            eşiği geçti, DSR onayı yok: {inBox - confirmed}
          </span>
          <span className="flex items-center gap-1">
            <svg width="9" height="9"><circle cx="4.5" cy="4.5" r="4"
              fill="var(--live)" /></svg>
            onaylı: {confirmed}
          </span>
        </span>
      </div>
    </div>
  )
}
