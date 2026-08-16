/**
 * The page's one piece of theatre, and the intellectual centre of the project.
 *
 * Every experiment run makes the next result harder to believe. That is not a
 * metaphor — the Deflated Sharpe Ratio takes the number of attempts as an
 * input, and the significance threshold rises with it. Search a hundred ideas
 * and the best of them has to clear a bar that a single idea would not.
 *
 * Most dashboards hide the denominator. This one puts it in the hero, because
 * a result reported without the number of attempts behind it is not a result.
 */

import { useEffect, useState } from "react"
import type { Research } from "@/lib/types"

/** Expected best Sharpe from `n` strategies that all have no edge. */
function expectedMaxSharpe(n: number): number {
  if (n < 2) return 0
  const gamma = 0.5772156649015329
  const ppf = (p: number) => {
    // Rational approximation of the inverse normal CDF, ~1e-9 accurate.
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687,
               138.357751867269, -30.66479806614716, 2.506628277459239]
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866,
               66.80131188771972, -13.28068155288572]
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838,
               -2.549732539343734, 4.374664141464968, 2.938163982698783]
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996,
               3.754408661907416]
    const pl = 0.02425
    if (p < pl) {
      const q = Math.sqrt(-2 * Math.log(p))
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    }
    if (p > 1 - pl) {
      const q = Math.sqrt(-2 * Math.log(1 - p))
      return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
              ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    }
    const q = p - 0.5
    const r = q * q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5]) * q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
  }
  return (1 - gamma) * ppf(1 - 1 / n) + gamma * ppf(1 - 1 / (n * Math.E))
}

export function ThresholdLadder({ research }: { research: Research }) {
  const total = research.total_attempts
  const [shown, setShown] = useState(0)

  // Counts up on load. The rise is the point: you watch the bar get harder.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || total === 0) {
      setShown(total)
      return
    }
    let frame = 0
    const steps = 32
    const id = setInterval(() => {
      frame += 1
      setShown(Math.round((total * frame) / steps))
      if (frame >= steps) clearInterval(id)
    }, 22)
    return () => clearInterval(id)
  }, [total])

  const threshold = expectedMaxSharpe(Math.max(1, shown))
  const marks = [1, 5, 20, 50, 100, 250]

  return (
    <section className="border border-rule bg-card px-5 py-7 sm:px-8 sm:py-9">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
        Deneme sayacı
      </p>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display tabular text-6xl leading-none sm:text-7xl">
          {shown}
        </span>
        <span className="font-sans text-base text-muted-foreground">
          fikir denendi
        </span>
      </div>

      <p className="mt-5 max-w-prose font-sans text-[0.95rem] leading-relaxed">
        Her deneme, bir sonraki sonucun inandırıcılığını düşürür. Yüz fikir
        tararsan en iyisi tesadüfen parlak çıkar. Söndürülmüş Sharpe oranı bunu
        hesaba katar: <strong>anlamlılık eşiği deneme sayısıyla yükselir.</strong>
      </p>

      <div className="mt-7">
        <div className="flex items-baseline justify-between font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
          <span>Şu anki eşik</span>
          <span className="tabular text-foreground">
            Sharpe {threshold.toFixed(2)}
          </span>
        </div>

        {/* The ladder: each rung is a milestone count, drawn at the height of
            the bar it implies. Reading it left to right is the argument. */}
        <div className="mt-3 flex h-24 items-end gap-1.5 border-b border-rule">
          {marks.map((m) => {
            const h = expectedMaxSharpe(m)
            const reached = shown >= m
            return (
              <div key={m} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full transition-[height] duration-500 ease-out"
                  style={{
                    height: `${(h / 3.6) * 100}%`,
                    background: reached
                      ? "var(--reject)"
                      : "color-mix(in oklch, var(--rule) 70%, transparent)",
                  }}
                  aria-hidden
                />
                <span className="font-mono tabular text-[0.6rem] text-muted-foreground">
                  {m}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
          deneme sayısı → gerekli Sharpe
        </p>
      </div>

      <p className="mt-6 border-l-2 border-reject pl-4 font-sans text-[0.88rem] leading-relaxed text-muted-foreground">
        {research.note}
      </p>
    </section>
  )
}
