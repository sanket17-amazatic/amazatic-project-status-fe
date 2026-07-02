import type { ProjectStatus } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

/**
 * UI-SPEC semantic status tokens — NOT the accent blue used for buttons.
 * Soft badge: tinted background + colored text, exact pairs per status.
 */
const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700' },
  on_hold: { label: 'On Hold', className: 'bg-amber-50 text-amber-700' },
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status]
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
