import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { AiPriority } from '@/lib/severity'

export interface ActionPoint {
  source: 'slack' | 'teams'
  channel_name: string
  user_name: string
  message_text: string
  ai_summary: string
  ai_action_deadline: string
  ai_priority: AiPriority | ''
  created_at: string
}

/**
 * Project Details "Action Points" list — real API,
 * `GET /api/projects/{id}/action-points/` (projects.views.ProjectViewSet.action_points).
 * Deadline-windowed (ai_action_deadline >= today), not paginated, sorted
 * soonest-deadline-first by the server — independent of the summary
 * endpoint's `range` filter (forward-looking deadline vs. backward-looking
 * creation date, don't compose). Same D-11 403 guard as every other
 * project detail action.
 */
export function useActionPoints(projectId: number) {
  const query = useQuery({
    queryKey: ['action-points', projectId],
    queryFn: () => getJson<ActionPoint[]>(`/api/projects/${projectId}/action-points/`),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
