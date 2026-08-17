import { Link, useParams } from 'react-router-dom'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { ShimmerTitle, ShimmerText } from 'shimmer-effects-react'
import { Button } from '@/components/ui/button'
import { useProject } from '@/hooks/useProject'
import { useAuthStore } from '@/stores/authStore'
import { DetailsTab } from './tabs/DetailsTab'
import { TeamTab } from './tabs/TeamTab'
import { IntegrationsTab } from './tabs/IntegrationsTab'
import { ClientEmailsField } from './tabs/ClientEmailsField'
import { TerminologySection } from './TerminologySection'

/**
 * Dedicated settings page (replacing the old "Manage project" disclosure on
 * the detail page) — renders DetailsTab/TeamTab/IntegrationsTab as
 * standalone sections instead of tab-switcher content, styled to match the
 * reference design (ai-project-intelligence-frontend's project settings
 * page). Each section already saves for real via its own mutations; there's
 * no page-level "Update Changes" button because there's nothing to batch —
 * unlike the reference design, whose own Cancel/Update buttons don't call
 * any API at all.
 */
export default function ProjectSettingsPage() {
  const { id } = useParams()
  const { data: project, isLoading, isError, error } = useProject(id)
  const isManagement = useAuthStore((state) => state.user?.role) === 'management'

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
    <div className="mx-auto flex max-w-[1147px] flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="border-b border-[#e5e5e5] pb-3 text-base font-semibold text-black">
          Project Details
        </p>
        <TeamTab project={project} />
        <div className="border-t border-border pt-6">
          <DetailsTab project={project} />
        </div>
      </div>

      <TerminologySection />

      <ClientEmailsField
        projectId={project.id}
        clientEmails={project.client_emails}
        editable={isManagement}
      />

      <div className="flex flex-col gap-4">
        <p className="border-b border-[#e5e5e5] pb-3 text-base font-semibold text-black">
          Connected Data Sources
        </p>
        <IntegrationsTab project={project} />
      </div>
    </div>
  )
}
