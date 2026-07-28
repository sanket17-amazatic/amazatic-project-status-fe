import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/hooks/useProjects'
import { useIncidentStats } from '@/hooks/useIncidents'
import { useAuthStore } from '@/stores/authStore'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import { HeroBanner } from './HeroBanner'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { HeroBannerSkeleton, ProjectCardsSkeleton } from './DashboardSkeletons'

export default function DashboardPage() {
  const role = useAuthStore((state) => state.user?.role)

  const { data, isLoading, isError, refetch } = useProjects({})
  const { data: stats, isLoading: statsLoading } = useIncidentStats()

  const criticalProjectCount = (data?.results ?? []).filter(
    (project) => mapAiPriorityToSeverity(project.severity) === 'critical'
  ).length
  const mediumRiskCount = (data?.results ?? []).filter(
    (project) => mapAiPriorityToSeverity(project.severity) === 'medium'
  ).length

  return (
    <div>
      {statsLoading && <HeroBannerSkeleton />}

      {!statsLoading && data && stats && (
        <HeroBanner
          totalProjects={data.count}
          criticalProjectCount={criticalProjectCount}
          mediumRiskCount={mediumRiskCount}
          totalIncidents={stats.open_incidents}
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
        <div className="flex flex-col gap-4">
          {data.results.map((project) => (
            <ProjectSummaryCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
