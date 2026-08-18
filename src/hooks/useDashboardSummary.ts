import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'

export type DashboardSummaryRange = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days'

export interface DashboardSummary {
  description: string
  date: string
  total_projects: number
  critical_projects: number
  medium_risk: number
}

/**
 * Dashboard HeroBanner — real API, `GET /api/dashboard-summary/?date=`
 * (projects.views.DashboardSummaryView). Role-scoped "worst insight wins"
 * rollup over the requester's visible projects for the given date window.
 */
export function useDashboardSummary(range: DashboardSummaryRange) {
  const query = useQuery({
    queryKey: ['dashboard-summary', range],
    queryFn: () => getJson<DashboardSummary>(`/api/dashboard-summary/?date=${range}`),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
