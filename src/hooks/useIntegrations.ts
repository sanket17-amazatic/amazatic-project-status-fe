import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getJson, postJson, patchJson, del, apiFetch, apiErrorDetail } from '@/lib/api'
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

export type IntegrationType = 'jira' | 'slack_own' | 'slack_client' | 'teams'

export interface ProjectIntegration {
  id: number
  project: number
  type: IntegrationType
  enabled: boolean
  health_status: HealthStatus
  last_checked_at: string | null
  config: Record<string, unknown>
  slack_team_name: string
  slack_installed_at: string | null
  teams_tenant_id: string
  teams_client_id: string
  teams_team_id: string
  teams_team_name: string
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

interface UpsertIntegrationInput {
  id?: number
  type: IntegrationType
  enabled?: boolean
  config?: JiraConfig
  /** Azure AD app registration values (D-04) — Teams-only, never sent for
   * other types. `teams_client_secret` is write-only server-side; omit it
   * entirely (don't send an empty string) to leave an already-set secret
   * unchanged — same "blank means unchanged" contract as the field itself. */
  teams_client_id?: string
  teams_client_secret?: string
  teams_tenant_id?: string
  /** Paste-a-channel-link convenience — fills teams_team_id/teams_tenant_id
   * server-side (see teams_integration.services.parse_teams_channel_link).
   * Explicit teams_tenant_id above still wins if both are sent. */
  teams_channel_link?: string
}

/**
 * Creates the integration row if absent, else PATCHes. Used for the
 * enabled on/off toggle, Jira's config (base_url/email/project_key — see
 * JiraConfig), and Teams' connection credentials — callers pass only the
 * field(s) they're changing so, e.g., saving config doesn't also flip
 * `enabled`.
 */
export function useUpsertIntegration(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      type,
      enabled,
      config,
      teams_client_id,
      teams_client_secret,
      teams_tenant_id,
      teams_channel_link,
    }: UpsertIntegrationInput) => {
      const payload: Omit<UpsertIntegrationInput, 'id' | 'type'> = {}
      if (enabled !== undefined) payload.enabled = enabled
      if (config !== undefined) payload.config = config
      if (teams_client_id !== undefined) payload.teams_client_id = teams_client_id
      if (teams_client_secret !== undefined) payload.teams_client_secret = teams_client_secret
      if (teams_tenant_id !== undefined) payload.teams_tenant_id = teams_tenant_id
      if (teams_channel_link !== undefined) payload.teams_channel_link = teams_channel_link

      if (id) {
        return patchJson<ProjectIntegration>(`/api/integrations/${id}/`, payload)
      }
      return postJson<ProjectIntegration>('/api/integrations/', {
        project: Number(projectId),
        type,
        enabled: enabled ?? false,
        ...payload,
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

/** D-06: runs a real probe per integration type (Jira sync, Slack auth_test,
 * Teams token acquisition) and returns the resulting status. */
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
