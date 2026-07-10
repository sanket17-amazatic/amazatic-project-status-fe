import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { useProjects } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import { mapAiPriorityToSeverity, type Severity } from '@/lib/severity'
import { ProjectsToolbar } from './ProjectsToolbar'
import { ProjectsListTable } from './ProjectsListTable'

const PAGE_SIZE = 25

export default function ProjectsListPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [page, setPage] = useState(1)
  const role = useAuthStore((state) => state.user?.role)

  // Debounce search input before it hits the API param.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search])

  const { data, isLoading, isError, refetch } = useProjects({ ordering: 'name', search, page })

  const projects = data?.results ?? []
  // Severity is derived server-side (ProjectSerializer.get_severity) from the
  // real SlackMessageInsight data, but there's no ?severity= query param on
  // ProjectViewSet — filtering the current page client-side here is display
  // logic on already-authorized data (same reasoning useMemberships/
  // useIntegrations narrow by ?project= client-side), not a re-scoping.
  const visibleProjects = severity
    ? projects.filter((project) => mapAiPriorityToSeverity(project.severity) === severity)
    : projects
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <div>
      <ProjectsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        severity={severity}
        onSeverityChange={setSeverity}
      />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load projects. Check your connection and try again.</AlertTitle>
          <AlertAction>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && !isError && data && data.results.length === 0 && (
        <div className="py-12 text-center">
          {role === 'management' ? (
            <>
              <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create your first project to start tracking status across the team.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground">Nothing assigned yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                You haven't been added to any projects. Ask management to assign you.
              </p>
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && data && data.results.length > 0 && (
        <>
          <ProjectsListTable projects={visibleProjects} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
