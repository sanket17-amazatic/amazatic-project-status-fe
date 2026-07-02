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
 * Assignable-user list from GET /api/users/ (management-only, T-02-10).
 * Owned by this plan, reused by the 02-07 Team tab (PM-reassign + add-member
 * selects). A 403 for non-management surfaces as a query error the caller
 * can ignore/hide the picker on.
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
