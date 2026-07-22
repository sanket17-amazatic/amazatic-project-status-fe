import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** Mirrors OrgSummaryCard + IncidentsByPriorityCard's flex row exactly, so layout doesn't shift on load. */
export function DashboardStatsSkeleton() {
  return (
    <div className="mb-6 flex items-stretch gap-6">
      <div
        className="relative flex-1 overflow-hidden rounded-lg p-6"
        style={{ background: 'linear-gradient(135deg, #0b1e3a 0%, #142437 100%)' }}
      >
        <div className="mb-3 h-3.5 w-44 animate-pulse rounded bg-white/15" />
        <div className="h-7 w-64 animate-pulse rounded bg-white/15" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/10" />
        <div className="mt-6 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-7 w-12 animate-pulse rounded bg-white/15" />
              <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="w-[280px] shrink-0 rounded-lg border border-border bg-card p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 flex items-center gap-4">
          <div className="size-24 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="size-2 shrink-0 animate-pulse rounded-full bg-muted-foreground/30" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Real header (static, no data dependency) + skeleton rows shaped to each column's real content. */
export function ProjectsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Open Incidents</TableHead>
          <TableHead>Critical Incidents</TableHead>
          <TableHead>Evidence</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Last Synced</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-1.5 h-3 w-44 animate-pulse rounded bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-8 animate-pulse rounded bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-8 animate-pulse rounded bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-8 animate-pulse rounded bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
