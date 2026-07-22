import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { ShimmerTitle, ShimmerText } from 'shimmer-effects-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useProject } from '@/hooks/useProject'
import { useIntegrations } from '@/hooks/useIntegrations'
import { useProjectMembers } from '@/hooks/useMemberships'
import { cn } from '@/lib/utils'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { ProjectIncidentsPanel } from './ProjectIncidentsPanel'
import { JiraTicketsPanel } from './JiraTicketsPanel'
import { DetailsTab } from './tabs/DetailsTab'
import { TeamTab } from './tabs/TeamTab'
import { IntegrationsTab } from './tabs/IntegrationsTab'

/**
 * PROJ-05/D-11: a 403 here comes from the server object-level guard (02-02)
 * — the SPA renders access-denied on that status, never by hiding the route
 * client-side (T-02-18).
 *
 * Figma node redesign (quick-260710): the summary card + incidents table
 * are the primary view now. The original Details/Team/Integrations tabs
 * (project edit form, PM/member management, Jira toggle) aren't part of
 * that design but are real shipped features (Phase 2) — kept intact behind
 * a "Manage project" disclosure rather than deleted.
 */
export default function ProjectDetailPage() {
  const { id } = useParams()
  const [manageOpen, setManageOpen] = useState(false)
  const { data: project, isLoading, isError, error, refetch } = useProject(id)
  const { data: integrations } = useIntegrations(id ?? '')
  const { data: members } = useProjectMembers(id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ShimmerTitle mode="light" line={1} gap={8} width={200} />
        <ShimmerText mode="light" line={2} gap={8} />
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
      <ProjectSummaryCard
        project={project}
        integrations={integrations}
        members={members}
        onRefresh={() => refetch()}
      />

      <ProjectIncidentsPanel projectId={project.id} />

      <JiraTicketsPanel projectId={project.id} />

      <div className="mt-8 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setManageOpen((value) => !value)}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-foreground"
        >
          Manage project (edit, team, integrations)
          <ChevronDown
            className={cn('size-4 transition-transform', manageOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {manageOpen && (
          <Tabs defaultValue="details" className="mt-2">
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
        )}
      </div>
    </div>
  )
}
