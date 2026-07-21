import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { postJson, patchJson, del } from '@/lib/api'
import type { Project, ProjectStatus } from './useProjects'

export interface ProjectFormValues {
  name: string
  description: string
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  project_manager?: number
  /** Create-wizard-only fields (backend: ProjectSerializer.create). Optional
   * Jira token becomes a ProjectIntegration row; member_ids become Membership
   * rows — both in the same request/transaction as the project itself. */
  jira_api_token?: string
  member_ids?: number[]
}

/**
 * PROJ-01: create requires project_manager (the backend FK is non-nullable).
 * Management-only server-side (T-02-19) — this hook does not gate access,
 * it just carries the request; the API is the real authorization boundary.
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ProjectFormValues) => postJson<Project>('/api/projects/', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created')
    },
  })
}

/** PROJ-04: edit mode never sends project_manager — the Team tab (02-07) owns reassignment. */
export function useUpdateProject(id: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: Partial<ProjectFormValues>) =>
      patchJson<Project>(`/api/projects/${id}/`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Changes saved')
    },
  })
}

/**
 * Management-only server-side (IsManagementOrReadOnly). Cascades on the
 * backend — deleting a project also deletes its Memberships,
 * ProjectIntegrations, AssociatedEmails, and SlackMessageInsight rows
 * (all `on_delete=CASCADE`), i.e. every incident/evidence recorded against
 * it goes too. Irreversible; callers must confirm before calling this.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => del(`/api/projects/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: () => {
      toast.error('Could not delete project')
    },
  })
}
