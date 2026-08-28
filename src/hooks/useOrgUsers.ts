import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getJson, postJson, patchJson, ApiError } from '@/lib/api'
import type { UserRole } from '@/stores/authStore'

export type UserStatus = 'active' | 'inactive'

export interface OrgUserProject {
  project_name: string
  email: string
}

export interface OrgUser {
  id: number
  email: string
  first_name: string
  last_name: string
  name: string
  role: UserRole
  status: UserStatus
  last_login: string | null
  projects: OrgUserProject[]
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UseOrgUsersParams {
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  page?: number
}

/**
 * Users admin page (list). Real API — `/api/org-users/`
 * (projects.views.UserManagementViewSet, management-only). Server-side
 * search/role/status filter + pagination, same convention as useProjects.
 */
export function useOrgUsers({ search, role, status, page }: UseOrgUsersParams) {
  const query = useQuery<PaginatedResponse<OrgUser>, ApiError>({
    queryKey: ['org-users', { search, role, status, page }],
    // Without this, a 403 (non-management account) retries 3x with
    // exponential backoff before isError flips true — same issue useUsers()
    // already guards against. In the retry gaps, isLoading is false,
    // isError is still false, and data is still undefined, so the page
    // misrenders the empty-results branch ("No users match your filters")
    // instead of the 403 alert below.
    retry: false,
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      if (page && page > 1) params.set('page', String(page))
      const qs = params.toString()
      return getJson<PaginatedResponse<OrgUser>>(`/api/org-users/${qs ? `?${qs}` : ''}`).then(
        (response) => ({
          ...response,
          // Defensive against deploy-order skew with the backend PR adding
          // `projects` to UserManagementSerializer — until that's live too,
          // the API returns users with no `projects` key at all.
          results: response.results.map((user) => ({ ...user, projects: user.projects ?? [] })),
        })
      )
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export interface InviteUserInput {
  first_name: string
  last_name: string
  email: string
  role: UserRole
}

/**
 * Creates (or, if the email already has a User row from a prior Google
 * login, updates) the account — see UserManagementSerializer.create. No
 * email is actually sent yet (Gmail send integration is Phase 6, unbuilt);
 * the invited person simply gets the chosen role bound once they sign in
 * with their @amazatic.com Google account.
 */
export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: InviteUserInput) => postJson<OrgUser>('/api/org-users/', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] })
      toast.success('User added — they can sign in with their Google account now')
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.body && typeof error.body === 'object') {
        const body = error.body as Record<string, unknown>
        const emailError = Array.isArray(body.email) ? body.email[0] : undefined
        if (typeof emailError === 'string') {
          toast.error(emailError)
          return
        }
      }
      toast.error('Could not add user')
    },
  })
}

export interface UpdateUserInput {
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
}

/**
 * Edits an existing user's name/role/active-status — PATCH /api/org-users/:id/
 * (UserManagementViewSet.partial_update). Email stays fixed: it's the
 * Google SSO identity key, and changing it here would fight the
 * upsert-by-email semantics of the invite POST.
 */
export function useUpdateUser(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateUserInput) => patchJson<OrgUser>(`/api/org-users/${id}/`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] })
      toast.success('User updated')
    },
    onError: (error: unknown) => {
      // is_active carries a specific 400 (management disabling itself,
      // UserManagementSerializer.validate_is_active) — surface that instead
      // of the generic message so it doesn't look like a random failure.
      if (error instanceof ApiError && error.body && typeof error.body === 'object') {
        const body = error.body as Record<string, unknown>
        const isActiveError = Array.isArray(body.is_active) ? body.is_active[0] : undefined
        if (typeof isActiveError === 'string') {
          toast.error(isActiveError)
          return
        }
      }
      toast.error('Could not update user')
    },
  })
}
