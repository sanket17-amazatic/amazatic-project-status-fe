import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getJson, postJson, del, apiErrorDetail } from '@/lib/api'

export interface AssociatedEmail {
  id: number
  user: number
  project: number
  email: string
  user_name: string
  project_name: string
  created_at: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * Client-domain identities (accounts.AssociatedEmail) — what address a
 * project member posts under in a client Slack workspace, scoped to one
 * project. Unlike memberships/integrations, the backend list endpoint
 * genuinely supports `?project=` server-side (accounts/views.py
 * `_int_filter`), so this filters there rather than client-side.
 */
export function useAssociatedEmails(projectId: string) {
  const query = useQuery({
    queryKey: ['associated-emails', projectId],
    queryFn: () =>
      getJson<PaginatedResponse<AssociatedEmail>>(`/api/associated-emails/?project=${projectId}`),
  })
  return { data: query.data?.results ?? [], isLoading: query.isLoading }
}

export function useAddAssociatedEmail(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, email }: { userId: number; email: string }) =>
      postJson<AssociatedEmail>('/api/associated-emails/', {
        user: userId,
        project: Number(projectId),
        email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associated-emails', projectId] })
      toast.success('Associated email added')
    },
    onError: (error: unknown) => {
      toast.error(apiErrorDetail(error) ?? 'Could not add associated email')
    },
  })
}

export function useRemoveAssociatedEmail(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => del(`/api/associated-emails/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associated-emails', projectId] })
      toast.success('Associated email removed')
    },
    onError: (error: unknown) => {
      toast.error(apiErrorDetail(error) ?? 'Could not remove associated email')
    },
  })
}
