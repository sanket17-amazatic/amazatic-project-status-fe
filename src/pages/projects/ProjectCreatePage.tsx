import { Alert, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { ProjectCreateWizard } from './create/ProjectCreateWizard'

/** PROJ-01: management or PM (relaxed 2026-08-18 — a PM-created project is
 * always forced to be its own, see ProjectCreateWizard). The server mirrors
 * this: IsManagementOrPMCanCreateProject allows POST for management/pm,
 * everything else stays management-only. */
export default function ProjectCreatePage() {
  const role = useAuthStore((state) => state.user?.role)

  if (role !== 'management' && role !== 'pm') {
    return (
      <Alert variant="destructive">
        <AlertTitle>You don't have access to this project.</AlertTitle>
      </Alert>
    )
  }

  return <ProjectCreateWizard />
}
