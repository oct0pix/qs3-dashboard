/** Health, inventory and market readings. Quiet by design — the ledger is the
 *  loud part of the page and two loud parts is none. */

import { Metric } from "@/components/Metric"
import { bps, bytes, clock, count, shortDate } from "@/lib/format"
import type { Health, Inventory, Market } from "@/lib/types"

export function HealthSection({ health }: { health: Health }) {
  return (
    <section>
      <h2 className="font-display text-2xl">Sistem sağlığı</h2>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
        <Metric
          label="Kotasyon"
          value={health.quotes_per_sec.toFixed(0)}
          unit="/sn"
        />
        <Metric
          label="İşlem"
          value={health.trades_per_sec.toFixed(0)}
          unit="/sn"
        />
        <Metric
          label="Gecikme"
          value={health.median_lag_ms ? health.median_lag_ms.toFixed(0) : "—"}
          unit="ms"
          hint="borsa → bize"
        />
        <Metric
          label="Toplam mesaj"
          value={count(health.total_messages)}
        />
      </div>

      {health.stale_streams.length > 0 && (
        <p
          className="mt-6 border-l-2 pl-4 font-sans text-sm"
          style={{ borderColor: "var(--caution)", color: "var(--caution)" }}
        >
          Bayat akış: {health.stale_streams.join(", ")}
        </p>
      )}

      <div className="mt-7">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
          Son veri boşlukları
        </p>
        {health.recent_gaps.length === 0 ? (
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            Son 7 günde kayıt yok.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {health.recent_gaps.slice(0, 6).map((g, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-1.5 last:border-0"
              >
                <span className="font-mono text-[0.72rem] text-muted-foreground">
                  {clock(g.start)}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-[0.8rem] text-muted-foreground">
                  {g.reason}
                </span>
                <span className="font-mono tabular text-[0.72rem]">
                  {g.seconds.toFixed(0)}sn
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function InventorySection({ inventory }: { inventory: Inventory }) {
  const totalBars = inventory.history.reduce((a, h) => a + h.bars, 0)
  const oldest = inventory.history
    .map((h) => h.from)
    .filter(Boolean)
    .sort()[0]

  return (
    <section>
      <h2 className="font-display text-2xl">Veri envanteri</h2>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
        <Metric label="Veritabanı" value={bytes(inventory.db_bytes)} />
        <Metric
          label="Geçmiş bar"
          value={count(totalBars)}
          hint={oldest ? `${shortDate(oldest)} itibarıyla` : undefined}
        />
        <Metric
          label="Sıkıştırma"
          value={
            inventory.compression_ratio
              ? `${inventory.compression_ratio.toFixed(1)}×`
              : "—"
          }
        />
        <Metric
          label="Drive yedeği"
          value={count(inventory.archive.files)}
          unit="dosya"
          hint={
            inventory.archive.last_verified
              ? `son ${shortDate(inventory.archive.last_verified)}`
              : "doğrulanmadı"
          }
        />
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {["Aralık", "Sembol", "Bar", "Başlangıç", "Bitiş"].map((h, i) => (
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
            {inventory.history.map((h) => (
              <tr key={h.interval} className="border-b border-rule/60 last:border-0">
                <td className="py-2 font-mono text-[0.8rem]">{h.interval}</td>
                <td className="py-2 text-right font-mono tabular text-[0.8rem]">
                  {h.symbols}
                </td>
                <td className="py-2 text-right font-mono tabular text-[0.8rem]">
                  {count(h.bars)}
                </td>
                <td className="py-2 text-right font-mono text-[0.75rem] text-muted-foreground">
                  {shortDate(h.from)}
                </td>
                <td className="py-2 text-right font-mono text-[0.75rem] text-muted-foreground">
                  {shortDate(h.to)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function MarketSection({ market }: { market: Market }) {
  const rows = market.symbols.slice(0, 14)
  const cost = market.cost_model

  return (
    <section>
      <h2 className="font-display text-2xl">Piyasa görünümü</h2>

      <p className="mt-3 max-w-prose font-sans text-[0.92rem] leading-relaxed text-muted-foreground">
        Gidiş-dönüş maliyet, bir stratejinin işlem başına brüt beklentisinin
        aşması gereken eşiktir. Altında kalırsa kârlı olması matematiksel olarak
        imkânsızdır.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-x-6 gap-y-6">
        <Metric label="Taker" value={cost.taker_bps.toFixed(1)} unit="bps" />
        <Metric label="Kayma" value={cost.slippage_bps.toFixed(1)} unit="bps" />
        <Metric
          label="Sabit kısım"
          value={cost.fixed_round_trip_bps.toFixed(1)}
          unit="bps"
          hint="+ spread"
        />
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {["Sembol", "Spread", "Gidiş-dönüş", "Funding/yıl"].map((h, i) => (
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
            {rows.map((s) => (
              <tr key={s.symbol} className="border-b border-rule/60 last:border-0">
                <td className="py-2 font-mono text-[0.8rem]">{s.symbol}</td>
                <td className="py-2 text-right font-mono tabular text-[0.8rem] text-muted-foreground">
                  {s.spread_bps.toFixed(3)}
                </td>
                <td className="py-2 text-right font-mono tabular text-[0.8rem]">
                  {s.round_trip_bps.toFixed(2)}
                </td>
                <td
                  className="py-2 text-right font-mono tabular text-[0.8rem]"
                  style={
                    s.funding_annual_pct !== null && s.funding_annual_pct < -20
                      ? { color: "var(--reject)" }
                      : undefined
                  }
                >
                  {s.funding_annual_pct !== null
                    ? `${bps(s.funding_annual_pct, 1)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
