import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
}

function titleFor(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/projects/')) return 'Project'
  return 'Amazatic Project Status'
}

/**
 * D-14: sidebar + top bar shell with an independently-scrolling main content
 * area (32px xl gutter). Below 1024px the sidebar collapses to an icon rail
 * (UI-SPEC responsive note) — a simple width collapse, no mobile layout.
 */
export function AppShell() {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={mobileNavOpen ? 'block' : 'hidden lg:block'}>
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Toggle navigation"
            className="m-2 flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 py-2 text-sm"
            onClick={() => setMobileNavOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
        <TopBar title={titleFor(location.pathname)} />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
