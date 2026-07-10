import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useProjects, type ProjectStatus } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import { DashboardToolbar } from './DashboardToolbar'
import { ProjectsTable } from './ProjectsTable'
import { OrgSummaryCard } from './OrgSummaryCard'
import { IncidentsByPriorityCard } from './IncidentsByPriorityCard'

export default function DashboardPage() {
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [ordering, setOrdering] = useState('name')
  const role = useAuthStore((state) => state.user?.role)

  const { data, isLoading, isError, refetch } = useProjects({ status, ordering })

  function handleSort(field: string) {
    setOrdering((current) => (current === field ? `-${field}` : field))
  }

  return (
    <div>
      {!isLoading && !isError && data && (
        <div className="mb-6 flex items-stretch gap-6">
          <OrgSummaryCard projectCount={data.count} />
          <IncidentsByPriorityCard />
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-foreground">Projects</h2>
      <DashboardToolbar status={status} onStatusChange={setStatus} />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

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
