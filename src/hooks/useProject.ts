import { useQuery } from '@tanstack/react-query'
import { getJson, ApiError } from '@/lib/api'
import type { Project } from './useProjects'

/**
 * PROJ-05/D-11: the 403 comes from the server object-level guard (02-02) —
 * this hook surfaces `error.status === 403` so the page can render the
 * access-denied state without hiding the route client-side (T-02-18).
 */
export function useProject(id: string | undefined) {
  const query = useQuery<Project, ApiError>({
    queryKey: ['project', id],
    queryFn: () => getJson<Project>(`/api/projects/${id}/`),
    enabled: Boolean(id),
    retry: false,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
