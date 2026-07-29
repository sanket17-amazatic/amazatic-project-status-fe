import { Link, useParams } from 'react-router-dom'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { ShimmerTitle, ShimmerText } from 'shimmer-effects-react'
import { Button } from '@/components/ui/button'
import { useProject } from '@/hooks/useProject'
import { useIntegrations } from '@/hooks/useIntegrations'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { TodaysSummary } from './TodaysSummary'
import { ProjectIncidentsPanel } from './ProjectIncidentsPanel'

/**
 * PROJ-05/D-11: a 403 here comes from the server object-level guard (02-02)
 * — the SPA renders access-denied on that status, never by hiding the route
 * client-side (T-02-18).
 *
 * Editing/team/integrations management moved to the dedicated Settings page
 * (/projects/:id/settings, quick-260729-pzn) — reachable via the summary
 * card's settings icon, replacing the old "Manage project" disclosure.
 */
export default function ProjectDetailPage() {
  const { id } = useParams()
  const { data: project, isLoading, isError, error, refetch } = useProject(id)
  const { data: integrations } = useIntegrations(id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ShimmerTitle mode="light" line={1} gap={8} width={200} loading />
        <ShimmerText mode="light" line={2} gap={8} loading />
      </div>
    )
  }

  if (isError && error?.status === 403) {
    return (
      <Alert variant="destructive">
        <AlertTitle>You don't have access to this project.</AlertTitle>
        <AlertAction>
          <Button asChild variant="outline">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (isError || !project) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load this project. Check your connection and try again.</AlertTitle>
      </Alert>
    )
  }

  return (
    <div>
      <ProjectSummaryCard project={project} integrations={integrations} onRefresh={() => refetch()} />

      <div className="mt-6">
        <TodaysSummary project={project} />
      </div>

      <ProjectIncidentsPanel projectId={project.id} />
    </div>
  )
}
