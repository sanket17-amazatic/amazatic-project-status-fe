import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { AiPriority } from '@/lib/severity'
import { mapAiPriorityToSeverity } from '@/lib/severity'

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'

export interface Project {
  id: number
  name: string
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
}

/**
 * DASH-04/D-12: server-side filter + sort only. Never filters client-side —
 * the server's get_queryset (02-02) is the sole scoping authority (T-02-16).
 * `search` hits ProjectViewSet's SearchFilter (name/description); `page`
 * hits DRF's PageNumberPagination (PAGE_SIZE=25).
 */
export function useProjects({ status, ordering, search, page }: UseProjectsParams) {
  const query = useQuery({
    queryKey: ['projects', { status, ordering, search, page }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (ordering) params.set('ordering', ordering)
      if (search) params.set('search', search)
      if (page && page > 1) params.set('page', String(page))
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

/**
 * Dashboard HeroBanner needs org-wide critical/medium-risk project counts.
 * `useProjects` is page-scoped (server `PAGE_SIZE=25`), and no backend
 * aggregate exists for project-severity counts (unlike `/api/insights/stats/`'s
 * `priority_breakdown`, which counts incidents, not projects) — so this
 * fetches every page and aggregates client-side. Page size is read from the
 * first response rather than hardcoded, so it self-corrects if the server's
 * PAGE_SIZE ever changes. Bounded/acceptable at this app's 20-100-user org
 * scale; revisit with a backend aggregate if project counts grow much further.
 */
export function useProjectSeverityCounts() {
  const query = useQuery({
    queryKey: ['projects', 'severity-counts'],
    queryFn: async () => {
      const first = await getJson<PaginatedResponse<Project>>('/api/projects/')
      const pageSize = first.results.length
      const totalPages = pageSize > 0 ? Math.ceil(first.count / pageSize) : 1

      const restPages =
        totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                getJson<PaginatedResponse<Project>>(`/api/projects/?page=${index + 2}`)
              )
            )
          : []

      const allProjects = [first, ...restPages].flatMap((page) => page.results)

      let criticalProjectCount = 0
      let mediumRiskCount = 0
      for (const project of allProjects) {
        const severity = mapAiPriorityToSeverity(project.severity)
        if (severity === 'critical') criticalProjectCount++
        else if (severity === 'medium') mediumRiskCount++
      }

      return { totalProjects: first.count, criticalProjectCount, mediumRiskCount }
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
