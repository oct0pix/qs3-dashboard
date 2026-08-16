import { useEffect, useState } from "react"
import { Ledger } from "@/components/Ledger"
import { HealthSection, InventorySection, MarketSection } from "@/components/Sections"
import { StatusBar } from "@/components/StatusBar"
import { ThresholdLadder } from "@/components/ThresholdLadder"
import { loadSnapshot } from "@/lib/data"
import type { Snapshot } from "@/lib/types"

export default function App() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      loadSnapshot()
        .then((s) => alive && (setSnap(s), setError(null)))
        .catch((e) => alive && setError(e.message))
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
            Araştırma kaydı
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] sm:text-5xl">
            System 3.0
          </h1>
          <p className="mt-4 max-w-prose font-sans text-[0.98rem] leading-relaxed text-muted-foreground">
            Kripto vadeli işlemler için bir araştırma sistemi. Bu sayfa ne
            kazandığını değil, <strong className="text-foreground">neyi eledeğini</strong>{" "}
            gösterir — çünkü şimdiye kadar ürettiği şey bu.
          </p>
        </header>

        {error && (
          <div
            className="border px-4 py-3 font-sans text-sm"
            style={{ borderColor: "var(--reject)", color: "var(--reject)" }}
          >
            {error}
          </div>
        )}

        {!snap && !error && (
          <p className="font-mono text-sm text-muted-foreground">Yükleniyor…</p>
        )}

        {snap && (
          <div className="space-y-14">
            <StatusBar health={snap.health} generatedAt={snap.generated_at} />
            <ThresholdLadder research={snap.research} />
            <Ledger research={snap.research} />
            <HealthSection health={snap.health} />
            <InventorySection inventory={snap.inventory} />
            <MarketSection market={snap.market} />

            <footer className="border-t border-rule pt-6 font-sans text-[0.8rem] leading-relaxed text-muted-foreground">
              <p>
                Salt okunur. Veriler sunucuda üretilip statik olarak yayımlanır;
                bu sayfanın veritabanına erişimi yoktur.
              </p>
              <p className="mt-1 font-mono text-[0.7rem]">
                şema v{snap.schema_version}
              </p>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
