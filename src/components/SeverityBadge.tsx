import type { Severity } from '@/lib/mockIncidents'
import { cn } from '@/lib/utils'

/** Same soft-tint pattern as StatusBadge — tinted bg + colored text. */
const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-50 text-red-600' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-600' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low', className: 'bg-green-50 text-green-700' },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
