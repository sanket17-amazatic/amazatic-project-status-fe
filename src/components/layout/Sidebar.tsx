import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { LayoutDashboard, FolderKanban, ShieldCheck } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
]

/**
 * D-14: fixed 256px sidebar, slate-100 bg, 1px right border slate-200.
 * Active item uses the reserved accent (UI-SPEC: accent is only for active
 * nav, primary buttons, focus rings, and links — never generic hover).
 * Admin is management-only (T-02-14 — nav visibility is UX only, the API
 * enforces the real authorization).
 */
export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-semibold text-sidebar-foreground">Amazatic</span>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-accent text-sidebar-primary'
              )
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        {role === 'management' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-accent text-sidebar-primary'
              )
            }
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Admin
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
