import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getJson, postJson, patchJson, del } from '@/lib/api'

export interface Membership {
  id: number
  user: number
  project: number
  joined_at: string
  user_email: string
  user_name: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * PROJ-02: team members scoped to a single project.
 *
 * The backend list endpoint has no `?project=` filter (it returns every
 * membership across the requester's visible projects, already role-scoped
 * server-side) — this narrows the display to the one project the Team tab
 * is showing. That's UI display logic on already-authorized data, not a
 * role-scoping decision, so filtering here is safe.
 */
export function useProjectMembers(projectId: string) {
  const query = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => getJson<PaginatedResponse<Membership>>('/api/memberships/'),
  })
  const members = (query.data?.results ?? []).filter(
    (member) => member.project === Number(projectId)
  )
  return { data: members, isLoading: query.isLoading }
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      postJson<Membership>('/api/memberships/', { user: userId, project: Number(projectId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('Member added')
    },
  })
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ membershipId }: { membershipId: number; name: string }) =>
      del(`/api/memberships/${membershipId}/`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success(`${variables.name} removed`)
    },
  })
}

/** PROJ-02: PM reassignment via PATCH /api/projects/:id/ {project_manager}. */
export function useAssignPM(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      patchJson(`/api/projects/${projectId}/`, { project_manager: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Changes saved')
    },
  })
}
