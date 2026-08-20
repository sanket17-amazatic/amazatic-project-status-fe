import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { AiPriority } from '@/lib/severity'

export type IncidentSource = 'slack' | 'teams' | 'jira'

export interface Incident {
  id: number
  project: number
  project_name: string
  channel_name: string
  user_name: string
  message_text: string
  jira_ticket_keys: string[]
  ai_priority: AiPriority | ''
  ai_summary: string
  ai_reasoning: string
  evidence: number
  created_at: string
  /** Real origin platform ("slack" | "teams") — never "jira" (see `sources`). */
  source: 'slack' | 'teams'
  /** Display-ready badge list, e.g. ["teams", "jira"] — origin plus "jira"
   * whenever jira_ticket_keys is non-empty. Use this for the Source column
   * icons instead of hardcoding one platform. */
  sources: IncidentSource[]
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UseIncidentsParams {
  project?: number | ''
  priority?: AiPriority | ''
  source?: IncidentSource | ''
  search?: string
  page?: number
}

/**
 * Incidents pages (org-wide + per-project) — real API, `/api/insights/`
 * (slack_integration.api_views.SlackMessageInsightViewSet). Server-scoped
 * to the requester's visible projects (management sees all); server-side
 * search/priority/project filter + pagination, same convention as
 * useProjects/useOrgUsers.
 */
export function useIncidents({ project, priority, source, search, page }: UseIncidentsParams) {
  const query = useQuery({
    queryKey: ['incidents', { project, priority, source, search, page }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (project) params.set('project', String(project))
      if (priority) params.set('priority', priority)
      if (source) params.set('source', source)
      if (search) params.set('search', search)
      if (page && page > 1) params.set('page', String(page))
      const qs = params.toString()
      return getJson<PaginatedResponse<Incident>>(`/api/insights/${qs ? `?${qs}` : ''}`)
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
