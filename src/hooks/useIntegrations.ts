import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJson, postJson, patchJson, del, apiFetch } from '@/lib/api'
import type { HealthStatus } from '@/components/HealthBadge'

export type IntegrationType = 'jira' | 'slack_own' | 'slack_client'

export interface ProjectIntegration {
  id: number
  project: number
  type: IntegrationType
  enabled: boolean
  health_status: HealthStatus
  last_checked_at: string | null
  config: Record<string, unknown>
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * ADMIN-02/D-04..D-06: integrations scoped to a single project. Like
 * useMemberships, the backend list endpoint has no `?project=` filter (it's
 * already role-scoped server-side) — narrowed here for display only.
 */
export function useIntegrations(projectId: string) {
  const query = useQuery({
    queryKey: ['integrations', projectId],
    queryFn: () => getJson<PaginatedResponse<ProjectIntegration>>('/api/integrations/'),
  })
  const integrations = (query.data?.results ?? []).filter(
    (integration) => integration.project === Number(projectId)
  )
  return { data: integrations, isLoading: query.isLoading }
}

/** Creates the integration row if absent, else PATCHes (e.g. toggling Jira enabled). */
export function useUpsertIntegration(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      type,
      enabled,
    }: {
      id?: number
      type: IntegrationType
      enabled: boolean
    }) =>
      id
        ? patchJson<ProjectIntegration>(`/api/integrations/${id}/`, { enabled })
        : postJson<ProjectIntegration>('/api/integrations/', {
            project: Number(projectId),
            type,
            enabled,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}

export function useRemoveIntegration(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => del(`/api/integrations/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}

/** D-06: stub health-check — no real probe, re-reads current status. */
export function useCheckHealth(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/api/integrations/${id}/check_health/`, {
        method: 'POST',
      })
      return response.json() as Promise<Pick<ProjectIntegration, 'health_status' | 'last_checked_at'>>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}
