import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { apiFetch } from '@/lib/api'
import { ChevronDown } from 'lucide-react'

/**
 * D-14: fixed 56px top bar, slate-200 bottom border. Icon-only trigger has
 * an aria-label + tooltip (UI-SPEC icon-only accessibility rule). Sign out
 * calls the backend session-logout before clearing client state — a real
 * server invalidation, not a client-only discard (T-02-15, no JWT).
 */
export function TopBar({ title }: { title: string }) {
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const navigate = useNavigate()

  async function handleSignOut() {
    await apiFetch('/_allauth/browser/v1/auth/session', { method: 'DELETE' }).catch(() => undefined)
    clear()
    navigate('/login', { replace: true })
  }

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-8">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger
              aria-label="User menu"
              className="flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-accent"
            >
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{user?.email}</span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>User menu</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
