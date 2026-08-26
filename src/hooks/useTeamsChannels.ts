import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getJson, postJson, del, apiErrorDetail } from '@/lib/api'

export interface TeamsChannel {
  id: number
  channel_id: string
  channel_name: string
  enabled: boolean
  last_polled_at: string | null
  last_message_id: string
}

/**
 * Channels monitored under one Teams `ProjectIntegration` row — see
 * `ProjectIntegrationViewSet.teams_channels` (backend). One connection
 * (Azure AD app/team) can have many channels, so these are a nested list,
 * not part of the integration payload itself.
 */
export function useTeamsChannels(integrationId: number) {
  const query = useQuery({
    queryKey: ['teams-channels', integrationId],
    queryFn: () => getJson<TeamsChannel[]>(`/api/integrations/${integrationId}/teams-channels/`),
  })
  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * `input` is either a pasted "Get link to channel" URL (sent as
 * `teams_channel_link`, parsed server-side) or a raw channel id — the form
 * decides which by checking for a URL scheme (case-insensitive — a pasted
 * `HTTPS://...` link is still a link), same "paste or type" UX as the
 * Django admin's TeamsChannelInlineForm.
 *
 * `projectId` is only needed to invalidate `['integrations', projectId]`
 * alongside the channels list — the first channel added to a not-yet-
 * connected integration also sets its `teams_team_id`/`teams_team_name`
 * server-side (ProjectIntegrationViewSet._maybe_derive_team_from_channel_
 * link), and that lives on the integrations query, not the channels one.
 * Without this, TeamsConfigForm's "Connected to team X" status stays
 * stale ("Not connected...") until something unrelated refetches
 * integrations.
 */
export function useAddTeamsChannel(integrationId: number, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: string) => {
      const trimmed = input.trim()
      const body = trimmed.toLowerCase().startsWith('http')
        ? { teams_channel_link: trimmed }
        : { channel_id: trimmed }
      return postJson<TeamsChannel>(`/api/integrations/${integrationId}/teams-channels/`, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-channels', integrationId] })
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
      toast.success('Channel added')
    },
    onError: (error: unknown) => {
      toast.error(apiErrorDetail(error) ?? 'Could not add channel')
    },
  })
}

export function useRemoveTeamsChannel(integrationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => del(`/api/teams-channels/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-channels', integrationId] })
      toast.success('Channel removed')
    },
    onError: (error: unknown) => {
      toast.error(apiErrorDetail(error) ?? 'Could not remove channel')
    },
  })
}
