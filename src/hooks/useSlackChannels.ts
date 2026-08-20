import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'

export interface SlackChannel {
  channel_id: string
  channel_name: string
}

/**
 * Read-only — see `ProjectIntegrationViewSet.slack_channels` (backend).
 * Unlike Teams, Slack has no channel-registry model to add/remove from
 * (D-07: the app is installed workspace-wide via the Events API, not
 * toggled channel-by-channel); this is just "the channels this project has
 * actually seen messages from," derived from message history.
 */
export function useSlackChannels(integrationId: number) {
  const query = useQuery({
    queryKey: ['slack-channels', integrationId],
    queryFn: () => getJson<SlackChannel[]>(`/api/integrations/${integrationId}/slack-channels/`),
  })
  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
