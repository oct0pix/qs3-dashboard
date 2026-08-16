/**
 * The rejection ledger.
 *
 * This is the page's hero content, and the reason it exists. A research log
 * that listed only what worked would be advertising; the useful record is what
 * was tried and thrown out, because that is what stops the same ground being
 * covered twice and what makes the attempt counter meaningful.
 *
 * Rejections carry the stamp. Passing rows are plain ink — deliberately
 * undramatic, because "passed discovery" is not "works", and colouring it
 * green would say otherwise.
 */

import { Badge } from "@/components/ui/badge"
import { bps, clock, count, pct } from "@/lib/format"
import type { Experiment, Research } from "@/lib/types"

function verdict(e: Experiment): "rejected" | "held" | "unknown" {
  if (e.net_bps === null || e.net_bps === undefined) return "unknown"
  if (e.net_bps <= 0) return "rejected"
  if ((e.cpcv_positive ?? 0) < 0.7) return "rejected"
  return "held"
}

function describe(e: Experiment): string {
  const p = e.params ?? {}
  const bits: string[] = []
  if (p["yön"]) bits.push(String(p["yön"]))
  if (p["boyut"]) bits.push(`${p["boyut"]}=${p["dilim"] ?? ""}`)
  if (p["lookback"]) bits.push(`bakış ${p["lookback"]}`)
  if (p["horizon"] ?? p["ufuk"]) bits.push(`tutuş ${p["horizon"] ?? p["ufuk"]}`)
  if (p["tp"]) bits.push(`tp ${p["tp"]}`)
  if (p["interval"]) bits.push(String(p["interval"]))
  return bits.join(" · ") || e.kind
}

export function Ledger({ research }: { research: Research }) {
  const rows = [...research.experiments].reverse().slice(0, 40)
  const rejected = research.experiments.filter(
    (e) => verdict(e) === "rejected"
  ).length

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Eleme defteri</h2>
        <p className="font-mono text-xs text-muted-foreground">
          <span className="tabular" style={{ color: "var(--reject)" }}>
            {rejected}
          </span>{" "}
          elendi ·{" "}
          <span className="tabular">{research.passing}</span> keşifte tuttu
        </p>
      </header>

      <p className="mt-3 max-w-prose font-sans text-[0.92rem] leading-relaxed text-muted-foreground">
        Test edilen her fikir, sonucu iyi mi kötü mü bilinmeden önce kaydedilir.
        Sıralama önemli — sonradan hatırlanan bir sayı hep küçük çıkar.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {["Fikir", "Olay", "Net", "Poz. yol", "Karar"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] font-normal text-muted-foreground ${
                    i > 0 ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const v = verdict(e)
              return (
                <tr
                  key={`${e.at}-${i}`}
                  className="border-b border-rule/60 last:border-0"
                >
                  <td className="py-2.5 pr-4 align-top">
                    <p className="font-sans text-[0.86rem] leading-tight">
                      {describe(e)}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.62rem] text-muted-foreground">
                      {e.kind} · {clock(e.at)}
                    </p>
                  </td>
                  <td className="py-2.5 text-right align-top font-mono tabular text-[0.8rem] text-muted-foreground">
                    {e.n_events ? count(e.n_events) : "—"}
                  </td>
                  <td
                    className="py-2.5 text-right align-top font-mono tabular text-[0.8rem]"
                    style={
                      v === "rejected" ? { color: "var(--reject)" } : undefined
                    }
                  >
                    {bps(e.net_bps)}
                  </td>
                  <td className="py-2.5 text-right align-top font-mono tabular text-[0.8rem] text-muted-foreground">
                    {pct(e.cpcv_positive)}
                  </td>
                  <td className="py-2.5 pl-3 text-right align-top">
                    {v === "rejected" ? (
                      <span className="stamp inline-block px-1.5 py-0.5 font-mono text-[0.58rem] uppercase">
                        elendi
                      </span>
                    ) : v === "held" ? (
                      <Badge
                        variant="outline"
                        className="font-mono text-[0.58rem] uppercase tracking-wider"
                      >
                        tuttu
                      </Badge>
                    ) : (
                      <span className="font-mono text-[0.62rem] text-muted-foreground">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-8 border border-dashed border-rule px-4 py-6 text-center font-sans text-sm text-muted-foreground">
          Henüz kayıtlı deneme yok. İlk fikir test edildiğinde burada görünecek.
        </p>
      )}
    </section>
  )
}
