import { Link, useParams } from 'react-router-dom'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { useProject } from '@/hooks/useProject'
import { useAuthStore } from '@/stores/authStore'
import { DetailsTab } from './tabs/DetailsTab'
import { TeamTab } from './tabs/TeamTab'
import { IntegrationsTab } from './tabs/IntegrationsTab'

/**
 * PROJ-05/D-11: a 403 here comes from the server object-level guard (02-02)
 * — the SPA renders access-denied on that status, never by hiding the route
 * client-side (T-02-18). Non-management viewers see the same tabs read-only.
 */
export default function ProjectDetailPage() {
  const { id } = useParams()
  const role = useAuthStore((state) => state.user?.role)
  const { data: project, isLoading, isError, error } = useProject(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
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
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
        <StatusBadge status={project.status} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <DetailsTab project={project} />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab project={project} />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab project={project} />
        </TabsContent>
      </Tabs>

      {role !== 'management' && (
        <p className="mt-4 text-xs text-slate-500">Viewing in read-only mode.</p>
      )}
    </div>
  )
}
