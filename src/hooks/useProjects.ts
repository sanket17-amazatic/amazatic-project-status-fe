import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'

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
}

/**
 * DASH-04/D-12: server-side filter + sort only. Never filters client-side —
 * the server's get_queryset (02-02) is the sole scoping authority (T-02-16).
 */
export function useProjects({ status, ordering }: UseProjectsParams) {
  const query = useQuery({
    queryKey: ['projects', { status, ordering }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (ordering) params.set('ordering', ordering)
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
