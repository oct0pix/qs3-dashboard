import type { Live, Snapshot } from "./types"

/**
 * Where the live endpoint is.
 *
 * The tunnel hands out a new hostname each time it restarts, so the address
 * cannot be baked into the build. A tiny pointer file published next to the
 * page carries the current one; the server rewrites it whenever the tunnel
 * changes.
 */
async function endpoint(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/endpoint.json?t=${Date.now()}`,
      { cache: "no-store" })
    if (!res.ok) return null
    const { url } = await res.json()
    return typeof url === "string" && url.startsWith("https://") ? url : null
  } catch {
    return null
  }
}

let cached: string | null = null

async function base(): Promise<string | null> {
  if (!cached) cached = await endpoint()
  return cached
}

async function get<T>(path: string): Promise<T> {
  const b = await base()
  if (!b) throw new Error("uç nokta yok")
  const res = await fetch(`${b}${path}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export const fetchLive = () => get<Live>("/live")
export const fetchSnapshot = () => get<Snapshot>("/snapshot")

/** Forget the cached address so the next call rediscovers it. */
export function resetEndpoint() {
  cached = null
}
