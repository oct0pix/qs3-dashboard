/** A single reading. Label above, value below, unit as a quiet suffix. */

export function Metric({
  label,
  value,
  unit,
  tone = "ink",
  hint,
}: {
  label: string
  value: string
  unit?: string
  tone?: "ink" | "reject" | "caution" | "live"
  hint?: string
}) {
  const color =
    tone === "ink" ? undefined : `var(--${tone})`

  return (
    <div className="min-w-0">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className="font-display tabular text-2xl leading-none sm:text-[1.7rem]"
          style={color ? { color } : undefined}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      {hint && (
        <p className="mt-1 font-sans text-[0.72rem] leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
