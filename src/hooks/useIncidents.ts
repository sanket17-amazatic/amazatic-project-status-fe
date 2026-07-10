import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { AiPriority } from '@/lib/severity'

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
export function useIncidents({ project, priority, search, page }: UseIncidentsParams) {
  const query = useQuery({
    queryKey: ['incidents', { project, priority, search, page }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (project) params.set('project', String(project))
      if (priority) params.set('priority', priority)
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

export interface IncidentStats {
  analyzed_projects: number
  open_incidents: number
  critical_incidents: number
  evidence_records: number
  priority_breakdown: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

/**
 * Dashboard org-summary banner + Incidents-by-Priority donut — real API,
 * `/api/insights/stats/` (org-wide aggregate over the requester's visible
 * projects' qualifying insights, same scoping as useIncidents).
 */
export function useIncidentStats() {
  const query = useQuery({
    queryKey: ['incidents', 'stats'],
    queryFn: () => getJson<IncidentStats>('/api/insights/stats/'),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
