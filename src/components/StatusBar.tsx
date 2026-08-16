/**
 * Is the machine still collecting, and how stale is this page?
 *
 * The staleness reading is not decoration. The snapshot is pushed on a timer,
 * so a page that looks healthy might be showing a healthy system from two
 * hours ago. Saying when the reading was taken is the difference between a
 * status page and a screenshot.
 */

import { Badge } from "@/components/ui/badge"
import { ageMinutes } from "@/lib/data"
import { clock, duration } from "@/lib/format"
import type { Health } from "@/lib/types"

const LABEL: Record<Health["state"], string> = {
  running: "Toplanıyor",
  stale: "Akış bayat",
  stopped: "Durdu",
}

export function StatusBar({
  health,
  generatedAt,
}: {
  health: Health
  generatedAt: string
}) {
  const age = ageMinutes(generatedAt)
  const stale = age > 45

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-rule pb-4">
      <span className="flex items-center gap-2">
        <span
          className="inline-block size-2 rounded-full"
          style={{
            background: health.running ? "var(--live)" : "var(--reject)",
          }}
          aria-hidden
        />
        <span className="font-sans text-sm font-medium">
          {LABEL[health.state]}
        </span>
      </span>

      {health.running && (
        <span className="font-mono tabular text-xs text-muted-foreground">
          {health.uptime_seconds > 0 && duration(health.uptime_seconds)} ·{" "}
          {health.universe_size} sembol
        </span>
      )}

      <span className="ml-auto flex items-center gap-2">
        {stale && (
          <Badge
            variant="outline"
            className="border-caution font-mono text-[0.65rem] uppercase tracking-wider"
            style={{ color: "var(--caution)" }}
          >
            {Math.round(age)} dk önce
          </Badge>
        )}
        <span className="font-mono tabular text-xs text-muted-foreground">
          {clock(generatedAt)}
        </span>
      </span>
    </div>
  )
}
