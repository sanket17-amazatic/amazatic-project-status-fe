import { useState } from 'react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useProjects, type ProjectStatus } from '@/hooks/useProjects'
import { useIncidentStats } from '@/hooks/useIncidents'
import { useAuthStore } from '@/stores/authStore'
import { mockProjectHealth } from '@/lib/mockIncidents'
import { DashboardToolbar } from './DashboardToolbar'
import { ProjectsTable } from './ProjectsTable'
import { OrgSummaryCard } from './OrgSummaryCard'
import { IncidentsByPriorityCard } from './IncidentsByPriorityCard'
import { DashboardStatsSkeleton, ProjectsTableSkeleton } from './DashboardSkeletons'

export default function DashboardPage() {
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [ordering, setOrdering] = useState('name')
  const role = useAuthStore((state) => state.user?.role)

  const { data, isLoading, isError, refetch } = useProjects({ status, ordering })
  const { data: stats, isLoading: statsLoading } = useIncidentStats()
  // Resolved Incidents has no real backing yet (no acknowledge/resolve
  // workflow, Phase 6) — sum the same per-project mock the Project Detail
  // page uses, over whatever projects are currently loaded.
  const resolvedIncidents = (data?.results ?? []).reduce(
    (sum, project) => sum + mockProjectHealth(project.id).resolvedIncidents,
    0
  )

  function handleSort(field: string) {
    setOrdering((current) => (current === field ? `-${field}` : field))
  }

  return (
    <div>
      {statsLoading && <DashboardStatsSkeleton />}

      {!statsLoading && data && stats && (
        <div className="mb-6 flex items-stretch gap-6">
          <OrgSummaryCard
            analyzedProjectCount={stats.analyzed_projects}
            openIncidents={stats.open_incidents}
            criticalIncidents={stats.critical_incidents}
            resolvedIncidents={resolvedIncidents}
            evidenceRecords={stats.evidence_records}
          />
          <IncidentsByPriorityCard breakdown={stats.priority_breakdown} />
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-foreground">Projects</h2>
      <DashboardToolbar status={status} onStatusChange={setStatus} />

      {isLoading && <ProjectsTableSkeleton />}

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
        <ProjectsTable projects={data.results} ordering={ordering} onSort={handleSort} />
      )}
    </div>
  )
}
