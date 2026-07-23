import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
} from 'lucide-react'
import amazaticLogo from '@/assets/login/amazatic-logo.svg'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/users', label: 'Users', icon: Users },
]

/**
 * D-14 (superseded 2026-07-10, quick-260710-dsh): dark navy chrome + brand
 * green active item, matching the Figma dashboard — structural bits (256px
 * width, active-item-only accent) unchanged.
 */
export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <img
          src={amazaticLogo}
          alt="Amazatic"
          className="h-6 w-auto"
          style={{ aspectRatio: '177.062 / 43.9147' }}
        />
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
      </nav>
    </aside>
  )
}
