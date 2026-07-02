import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from './useSession'

/**
 * Gates every non-/login route on the server session (D-16). This is a UX
 * convenience only — the API independently enforces authorization (02-02),
 * so a bypassed guard still gets 401/403 from the backend (T-02-13).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
