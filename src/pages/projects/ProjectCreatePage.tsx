import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { ProjectForm } from './ProjectForm'
import { useCreateProject } from '@/hooks/useProjectMutations'
import { useAuthStore } from '@/stores/authStore'
import type { ProjectFormValues } from '@/hooks/useProjectMutations'

/** PROJ-01: management-only. The server also rejects a non-management POST with 403 (T-02-19). */
export default function ProjectCreatePage() {
  const role = useAuthStore((state) => state.user?.role)
  const navigate = useNavigate()
  const createProject = useCreateProject()

  if (role !== 'management') {
    return (
      <Alert variant="destructive">
        <AlertTitle>You don't have access to this project.</AlertTitle>
      </Alert>
    )
  }

  function handleSubmit(values: ProjectFormValues) {
    createProject.mutate(values, {
      onSuccess: (project) => navigate(`/projects/${project.id}`),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectForm mode="create" onSubmit={handleSubmit} pending={createProject.isPending} />
      </CardContent>
    </Card>
  )
}
