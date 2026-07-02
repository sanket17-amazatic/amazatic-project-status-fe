import { cn } from '@/lib/utils'

export type HealthStatus = 'not_configured' | 'pending' | 'healthy' | 'error'

/** D-05: dot + label badge, exact UI-SPEC health colors. */
const HEALTH_CONFIG: Record<HealthStatus, { label: string; dotClassName: string }> = {
  not_configured: { label: 'Not configured', dotClassName: 'bg-slate-400' },
  pending: { label: 'Pending', dotClassName: 'bg-amber-600' },
  healthy: { label: 'Healthy', dotClassName: 'bg-green-600' },
  error: { label: 'Error', dotClassName: 'bg-red-600' },
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  const config = HEALTH_CONFIG[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span className={cn('size-2 rounded-full', config.dotClassName)} aria-hidden="true" />
      {config.label}
    </span>
  )
}
