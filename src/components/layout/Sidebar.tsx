import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  AlertTriangle,
  Users,
  Plug,
} from 'lucide-react'
import amazaticLogo from '@/assets/login/amazatic-logo.svg'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/connections', label: 'Connections', icon: Plug },
]

/**
 * D-14 (superseded 2026-07-10, quick-260710-dsh): dark navy chrome + brand
 * green active item, matching the Figma dashboard — structural bits (256px
 * width, active-item-only accent) unchanged. Incidents/Users/Connections
 * don't have routes yet; they follow the same stub pattern Admin already
 * used (wildcard route redirects to `/`).
 * Admin is management-only (T-02-14 — nav visibility is UX only, the API
 * enforces the real authorization).
 */
export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-4">
        <img src={amazaticLogo} alt="" aria-hidden="true" className="h-6 w-auto" />
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
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary'
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
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary'
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
