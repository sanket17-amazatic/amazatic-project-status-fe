import type { ReactNode } from 'react'

interface ConnectedSourceCardProps {
  icon: string
  label: string
  description: string
  /** Right-side status area — real Switch/HealthBadge/actions for a wired
   * source, or a static placeholder for one that isn't backed yet. */
  status: ReactNode
  children?: ReactNode
}

/** Card shell matching the reference design's connected-source-card — icon/label/description left, status right, optional config content below. */
export function ConnectedSourceCard({ icon, label, description, status, children }: ConnectedSourceCardProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={icon} alt="" className="size-6 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-[#101828]">{label}</p>
            <p className="text-xs font-medium text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">{status}</div>
      </div>
      {children}
    </div>
  )
}
