import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { IncidentSource } from '@/lib/sources'

export type SummaryRange = 'today' | 'yesterday' | '7d' | '30d'

export interface SourceSeverityCounts {
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export interface CategoryCount {
  category: string
  count: number
}

export interface ProjectSummary {
  range: SummaryRange
  narrative: string
  totals: SourceSeverityCounts
  // Partial, not a fixed 3-key shape: the API only includes a key when that
  // integration is actually connected (enabled=True) for this project — a
  // project with only Slack connected returns `{ slack: {...} }`, no
  // teams/jira keys at all. Never assume all three are present.
  sources: Partial<Record<IncidentSource, SourceSeverityCounts>>
  categories: CategoryCount[]
}

/**
 * Project Details "Today's Summary" panel — real API,
 * `GET /api/projects/{id}/summary/?range=` (projects.views.ProjectViewSet.summary).
 * `sources.jira` is an overlay, not a fourth real platform: a row with a
 * Jira ticket counts there in addition to its own slack/teams bucket, so
 * `totals` (not a sum of the three source buckets) is the number to trust
 * for the narrative/org-wide counts. Object-level 403 via
 * IsProjectMemberOrManagement, same D-11 guard as every other project
 * detail action — surfaced as a query error the caller can show/ignore.
 */
export function useProjectSummary(projectId: number, range: SummaryRange) {
  const query = useQuery({
    queryKey: ['project-summary', projectId, range],
    queryFn: () => getJson<ProjectSummary>(`/api/projects/${projectId}/summary/?range=${range}`),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
