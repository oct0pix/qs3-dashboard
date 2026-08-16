/** Shape of the published snapshot. Mirrors qs3/snapshot.py. */

export interface Health {
  running: boolean
  state: "running" | "stale" | "stopped"
  uptime_seconds: number
  universe_size: number
  streams: string[]
  quotes_per_sec: number
  trades_per_sec: number
  total_messages: number
  median_lag_ms: number | null
  stale_streams: string[]
  recent_gaps: { start: string; seconds: number; reason: string }[]
}

export interface Inventory {
  db_bytes: number
  tables: { name: string; bytes: number }[]
  row_counts: Record<string, number>
  live_coverage: { from: string | null; to: string | null }
  history: {
    interval: string
    symbols: number
    bars: number
    from: string | null
    to: string | null
  }[]
  compression_ratio: number | null
  archive: { files: number; bytes: number; last_verified: string | null }
}

export interface Experiment {
  at: string
  kind: string
  params: Record<string, string | number>
  n_events: number | null
  net_bps: number | null
  cpcv_positive: number | null
  dsr: number | null
}

export interface Research {
  total_attempts: number
  experiments: Experiment[]
  passing: number
  note: string
}

export interface MarketSymbol {
  symbol: string
  spread_bps: number
  round_trip_bps: number
  ticks_30m: number
  funding_annual_pct: number | null
}

export interface Market {
  cost_model: {
    taker_bps: number
    slippage_bps: number
    fixed_round_trip_bps: number
  }
  symbols: MarketSymbol[]
}

export interface Snapshot {
  schema_version: number
  generated_at: string
  health: Health
  inventory: Inventory
  research: Research
  market: Market
}


export interface LiveSymbol {
  symbol: string
  mid: number
  spread_bps: number
  ticks: number
}

export interface Live {
  at: string
  quotes_per_sec: number
  trades_per_sec: number
  seconds_behind: number | null
  median_lag_ms: number | null
  total_messages: number
  symbols: LiveSymbol[]
}
