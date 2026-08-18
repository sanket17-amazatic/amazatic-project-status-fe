import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { postJson, patchJson, del, apiErrorDetail } from '@/lib/api'
import type { Project, ProjectStatus, TerminologyEntry } from './useProjects'

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
  /** Optional client-workspace email (accounts.AssociatedEmail) per selected
   * PM/member, set in the same request as member_ids/project_manager —
   * keyed by user id, additive alongside member_ids rather than changing
   * its plain-int-list shape. */
  project_manager_email?: string
  member_emails?: Record<number, string>
  /** Client-facing status-email recipients (Project.client_emails, PROJ-04). */
  client_emails?: string[]
  /** Project-specific shorthand glossary (Project.terminology) — PM-writable
   * on the project they manage, unlike the rest of ProjectFormValues (backend
   * enforces this narrowly: a PM PATCH must contain *only* this key). */
  terminology?: TerminologyEntry[]
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
    onError: (error) => {
      toast.error(apiErrorDetail(error) ?? 'Could not create project')
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
    onError: (error) => {
      toast.error(apiErrorDetail(error) ?? 'Could not save changes')
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
