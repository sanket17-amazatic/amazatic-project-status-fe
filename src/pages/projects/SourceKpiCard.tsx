import type { SourceSeverityCounts } from '@/hooks/useProjectSummary'

interface SourceKpiCardProps {
  label: string
  icon: string
  stat: SourceSeverityCounts
}

/** Per-source Total/Critical/Medium/Low card — total comes straight from the summary API. */
export function SourceKpiCard({ label, icon, stat }: SourceKpiCardProps) {
  const total = stat.total

  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-3 rounded-md bg-muted p-4 lg:flex-none lg:w-auto">
      <div className="flex items-center gap-2">
        <img src={icon} alt="" className="size-4 shrink-0" aria-hidden="true" />
        <p className="whitespace-nowrap text-sm font-semibold text-foreground">{label}</p>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex flex-col items-start gap-1">
          <p className="text-base font-semibold text-foreground">{total}</p>
          <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">Total Incidents</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-semibold text-red-600">{stat.critical}</p>
            <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">Critical</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-semibold text-amber-600">{stat.medium}</p>
            <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">Medium</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-semibold text-emerald-600">{stat.low}</p>
            <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">Low</p>
          </div>
        </div>
      </div>
    </div>
  )
}
