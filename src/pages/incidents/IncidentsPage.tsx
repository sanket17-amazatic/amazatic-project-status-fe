import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '@/components/SeverityBadge'
import { Pagination } from '@/components/Pagination'
import { useProjects } from '@/hooks/useProjects'
import { mockAllIncidents, type Severity } from '@/lib/mockIncidents'

const PAGE_SIZE = 12

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

/**
 * Org-wide incident feed (Figma: Incidents nav item). Fully mock — no
 * Incidents API exists yet (see mockAllIncidents). Project list is real
 * (useProjects, already role-scoped server-side); search/project/severity
 * filters run client-side over the mock rows only.
 */
export default function IncidentsPage() {
  const [search, setSearch] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useProjects({ ordering: 'name' })
  const projects = data?.results ?? []

  const incidents = useMemo(() => mockAllIncidents(data?.results ?? []), [data])
  const visible = incidents.filter((incident) => {
    if (projectId && String(incident.projectId) !== projectId) return false
    if (severity && incident.priority !== severity) return false
    if (search && !incident.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleProjectChange(value: string) {
    setProjectId(value === 'all' ? '' : value)
    setPage(1)
  }

  function handleSeverityChange(value: string) {
    setSeverity(value === 'all' ? '' : (value as Severity))
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load incidents. Check your connection and try again.</AlertTitle>
        <AlertAction>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search incidents, projects"
            aria-label="Search incidents or projects"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="h-9 pl-8"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={projectId || 'all'} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-40" aria-label="Filter by project">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity || 'all'} onValueChange={handleSeverityChange}>
            <SelectTrigger className="w-36" aria-label="Filter by severity">
              <SelectValue placeholder="All Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {SEVERITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Incident</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Detected Time &amp; Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((incident) => (
            <TableRow key={incident.id} className="hover:bg-slate-100">
              <TableCell className="font-medium text-foreground">{incident.title}</TableCell>
              <TableCell>{incident.projectName}</TableCell>
              <TableCell>
                <SeverityBadge severity={incident.priority} />
              </TableCell>
              <TableCell>{incident.evidence}</TableCell>
              <TableCell>{incident.impact}</TableCell>
              <TableCell className="text-slate-500">{incident.detected}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {visible.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">No incidents match your filters.</p>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
