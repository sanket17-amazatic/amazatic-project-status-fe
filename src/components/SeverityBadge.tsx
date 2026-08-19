import type { Severity } from '@/lib/severity'
import { cn } from '@/lib/utils'

/** Same soft-tint pattern as StatusBadge — tinted bg + colored text. */
const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-600' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-600' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', className: 'bg-green-100 text-green-700' },
}

/** `null` = no qualifying incident recorded for this project yet (not an error). */
export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) {
    return <span className="text-xs text-slate-400">No incidents</span>
  }
  const config = SEVERITY_CONFIG[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-normal',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
