/**
 * The one place the dashboard learns anything.
 *
 * Today the snapshot is a static file published alongside the page: a job on
 * the server writes it and pushes it, GitHub Pages serves it, and nothing on
 * the server is exposed to the internet. That last part is the reason for the
 * choice — the database was briefly reachable from the open internet and
 * closing it was worth more than fifteen minutes of data freshness.
 *
 * Swapping to a live API later means changing the URL in `SNAPSHOT_URL` and
 * nothing else. Every component reads through `loadSnapshot`.
 */

import type { Snapshot } from "./types"

const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/snapshot.json`

export async function loadSnapshot(): Promise<Snapshot> {
  // Cache-busted: Pages caches aggressively and a stale dashboard reporting a
  // healthy system is the one failure mode this page must not have.
  const res = await fetch(`${SNAPSHOT_URL}?t=${Date.now()}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Anlık görüntü alınamadı (HTTP ${res.status})`)
  }
  const data = (await res.json()) as Snapshot
  if (typeof data?.schema_version !== "number") {
    throw new Error("Anlık görüntü beklenen biçimde değil")
  }
  return data
}

/** How stale the snapshot is, in minutes. */
export function ageMinutes(generatedAt: string): number {
  return (Date.now() - new Date(generatedAt).getTime()) / 60000
}
