import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'
import type { UserRole } from '@/stores/authStore'

export interface AssignableUser {
  id: number
  email: string
  name: string
  role: UserRole
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * Assignable-user list from GET /api/users/ (management or PM, T-02-10 —
 * relaxed 2026-07-30 so a project's own PM can pick new team members from
 * the Add Team Members modal, not just management). A 403 for a plain
 * member surfaces as a query error the caller can ignore/hide the picker on.
 */
export function useUsers() {
  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => getJson<PaginatedResponse<AssignableUser>>('/api/users/'),
    retry: false,
  })

  return {
    data: query.data?.results ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
