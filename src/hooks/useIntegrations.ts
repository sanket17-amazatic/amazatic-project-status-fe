import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getJson, postJson, patchJson, del, apiFetch, ApiError } from '@/lib/api'
import type { HealthStatus } from '@/components/HealthBadge'

export interface JiraConfig {
  jira_base_url?: string
  jira_email?: string
  jira_project_key?: string
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * `ProjectIntegration.config` comes back as `Record<string, unknown>` — an
 * API response could put anything in there. Read it through here rather
 * than casting straight to `JiraConfig` (that cast type-checks today only
 * because JiraConfig's all-optional shape makes it structurally weak, not
 * because the value is actually validated).
 */
export function readJiraConfig(config: Record<string, unknown>): JiraConfig {
  return {
    jira_base_url: asOptionalString(config.jira_base_url),
    jira_email: asOptionalString(config.jira_email),
    jira_project_key: asOptionalString(config.jira_project_key),
  }
}

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

export function apiErrorDetail(error: unknown): string | null {
  if (error instanceof ApiError && error.body && typeof error.body === 'object') {
    const detail = (error.body as Record<string, unknown>).detail
    if (typeof detail === 'string') return detail
  }
  return null
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

/**
 * Creates the integration row if absent, else PATCHes. Used both for the
 * enabled on/off toggle and for saving Jira's config (base_url/email/
 * project_key — see JiraConfig) — callers pass only the field(s) they're
 * changing so, e.g., saving config doesn't also flip `enabled`.
 */
export function useUpsertIntegration(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      type,
      enabled,
      config,
    }: {
      id?: number
      type: IntegrationType
      enabled?: boolean
      config?: JiraConfig
    }) => {
      if (id) {
        const payload: { enabled?: boolean; config?: JiraConfig } = {}
        if (enabled !== undefined) payload.enabled = enabled
        if (config !== undefined) payload.config = config
        return patchJson<ProjectIntegration>(`/api/integrations/${id}/`, payload)
      }
      return postJson<ProjectIntegration>('/api/integrations/', {
        project: Number(projectId),
        type,
        enabled: enabled ?? false,
        config,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorDetail(error) ?? 'Could not update integration')
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
    onError: (error: unknown) => {
      toast.error(apiErrorDetail(error) ?? 'Health check failed')
    },
  })
}
