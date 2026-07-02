import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError, getJson } from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/stores/authStore'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

async function fetchSession(): Promise<AuthUser> {
  // Lands the csrftoken cookie the login form's POST needs, and confirms
  // the allauth session is live.
  await apiFetch('/_allauth/browser/v1/auth/session')
  return getJson<AuthUser>('/api/me/')
}

/**
 * Resolves auth state from the allauth session probe + /api/me (D-16), and
 * hydrates the Zustand auth store so role-aware UI (Sidebar, etc.) doesn't
 * need to re-fetch. A 401/403 from the session probe means unauthenticated,
 * not an error.
 */
export function useSession(): { status: SessionStatus; user: AuthUser | null } {
  const setUser = useAuthStore((state) => state.setUser)
  const clear = useAuthStore((state) => state.clear)

  const query = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const user = await fetchSession()
        setUser(user)
        return user
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clear()
          return null
        }
        throw error
      }
    },
    retry: false,
    staleTime: 60_000,
  })

  if (query.isPending) {
    return { status: 'loading', user: null }
  }
  if (query.data == null) {
    return { status: 'unauthenticated', user: null }
  }
  return { status: 'authenticated', user: query.data }
}
