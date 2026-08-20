import { useState } from 'react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pagination } from '@/components/Pagination'
import { useProjects } from '@/hooks/useProjects'
import { useDashboardSummary, type DashboardSummaryRange } from '@/hooks/useDashboardSummary'
import { useAuthStore } from '@/stores/authStore'
import { HeroBanner } from './HeroBanner'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { HeroBannerSkeleton, ProjectCardsSkeleton } from './DashboardSkeletons'

const DASHBOARD_RANGE_OPTIONS: { value: DashboardSummaryRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
]

// Matches ProjectViewSet's DRF default (project/settings.py PAGE_SIZE) —
// same convention as ProjectsListPage.
const PAGE_SIZE = 25

export default function DashboardPage() {
  const role = useAuthStore((state) => state.user?.role)
  const [dashboardRange, setDashboardRange] = useState<DashboardSummaryRange>('today')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useProjects({ date: dashboardRange, page })
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useDashboardSummary(dashboardRange)

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  const heroBannerLoading = summaryLoading

  return (
    <div className="mx-auto max-w-[1147px]">
      <div className="mb-4 flex justify-end">
        <Select
          value={dashboardRange}
          onValueChange={(value) => {
            // Synchronous with the range change itself, not a useEffect —
            // otherwise the render right after the state change already
            // fires a request for {date: newRange, page} at the old page,
            // and the effect's setPage(1) fires a second, wasted one.
            setDashboardRange(value as DashboardSummaryRange)
            setPage(1)
          }}
        >
          <SelectTrigger className="h-9 w-40" aria-label="Executive briefing date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {heroBannerLoading && <HeroBannerSkeleton />}

      {!heroBannerLoading && summary && !summaryError && (
        <HeroBanner
          totalProjects={summary.total_projects}
          criticalProjectCount={summary.critical_projects}
          mediumRiskCount={summary.medium_risk}
          description={summary.description}
          date={summary.date}
        />
      )}

      <h2 className="mb-4 mt-8 text-lg font-semibold text-foreground">Projects</h2>

      {isLoading && <ProjectCardsSkeleton />}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load projects. Check your connection and try again.</AlertTitle>
          <AlertAction>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && !isError && data && data.results.length === 0 && (
        <div className="py-12 text-center">
          {role === 'management' ? (
            <>
              <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create your first project to start tracking status across the team.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground">Nothing assigned yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                You haven't been added to any projects. Ask management to assign you.
              </p>
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && data && data.results.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            {data.results.map((project) => (
              <ProjectSummaryCard key={project.id} project={project} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
