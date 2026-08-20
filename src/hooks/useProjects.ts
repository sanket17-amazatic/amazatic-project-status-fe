import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { AiPriority } from '@/lib/severity'
import type { CategoryCount } from '@/hooks/useProjectSummary'
import type { DashboardSummaryRange } from '@/hooks/useDashboardSummary'

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'

export interface TerminologyEntry {
  abbreviation: string
  meaning: string
}

/** critical/medium/low breakdown for one source alone (Slack or Teams) —
 * "critical" folds urgent+high, same grouping as severity.severity_bucket.
 * No `total` field (unlike ProjectSummary's SourceSeverityCounts). */
export interface PriorityCounts {
  critical: number
  medium: number
  low: number
}

export interface Project {
  id: number
  name: string
  abbreviation: string
  description: string
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  progress: number | null
  project_manager: number
  project_manager_name: string
  /** Real incident stats, derived server-side from SlackMessageInsight (ProjectSerializer). */
  open_incidents: number
  critical_incidents: number
  evidence_count: number
  severity: AiPriority | null
  last_synced: string | null
  /** Recipient list for this project's client-facing status emails
   * (management-editable). Optional, not just possibly-empty: this key
   * doesn't exist on API responses until the backend's Project.client_emails
   * field ships (backend PR #33) — the two repos deploy independently on
   * push to main, so a FE deploy landing first must not assume it's there.
   * Consumers must default with `?? []`, not access it directly. */
  client_emails?: string[]
  /** Project-specific shorthand glossary fed into the AI summarizer's
   * project_context (see backend projects.services.ai_context) — e.g. "BBE"
   * = "Buy Box Election project". Same independent-deploy optionality as
   * client_emails above; default with `?? []`. */
  terminology?: TerminologyEntry[]
  /** Deterministic one-line narrative (ProjectSerializer.get_summary) — no live AI call. */
  summary: string
  slack_incidents: PriorityCounts
  teams_incidents: PriorityCounts
  incident_categories: CategoryCount[]
  /** Canonical phrases from a fixed vocabulary, sized to the real flagged-and-in-window count (ProjectSerializer.get_action_points). */
  action_points: string[]
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UseProjectsParams {
  status?: ProjectStatus | ''
  ordering?: string
  search?: string
  page?: number
  /** Scopes severity/incident-derived fields (severity, open_incidents,
   * summary, slack_incidents, teams_incidents, incident_categories,
   * action_points) to this window — same values as useDashboardSummary, so
   * the dashboard's project list stays in sync with the banner's date
   * filter (ProjectViewSet.get_serializer_context). Every visible project
   * still returns, even with zero activity in the window — this never
   * drops a project the way DashboardSummary's total_projects wouldn't
   * either. */
  date?: DashboardSummaryRange
}

/**
 * DASH-04/D-12: server-side filter + sort only. Never filters client-side —
 * the server's get_queryset (02-02) is the sole scoping authority (T-02-16).
 * `search` hits ProjectViewSet's SearchFilter (name/description); `page`
 * hits DRF's PageNumberPagination (PAGE_SIZE=25).
 */
export function useProjects({ status, ordering, search, page, date }: UseProjectsParams) {
  const query = useQuery({
    queryKey: ['projects', { status, ordering, search, page, date }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (ordering) params.set('ordering', ordering)
      if (search) params.set('search', search)
      if (page && page > 1) params.set('page', String(page))
      if (date) params.set('date', date)
      const qs = params.toString()
      return getJson<PaginatedResponse<Project>>(`/api/projects/${qs ? `?${qs}` : ''}`)
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
