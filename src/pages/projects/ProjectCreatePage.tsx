import { Alert, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { ProjectCreateWizard } from './create/ProjectCreateWizard'

/** PROJ-01: management-only. The server also rejects a non-management POST with 403 (T-02-19). */
export default function ProjectCreatePage() {
  const role = useAuthStore((state) => state.user?.role)

  if (role !== 'management') {
    return (
      <Alert variant="destructive">
        <AlertTitle>You don't have access to this project.</AlertTitle>
      </Alert>
    )
  }

  return <ProjectCreateWizard />
}
