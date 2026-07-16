import { useEffect, useState } from 'react'
import { Search, MessageSquare, Kanban } from 'lucide-react'
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
import { ShimmerTable } from 'shimmer-effects-react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '@/components/SeverityBadge'
import { Pagination } from '@/components/Pagination'
import { useProjects } from '@/hooks/useProjects'
import { useIncidents } from '@/hooks/useIncidents'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity, mapSeverityToAiPriority, type Severity } from '@/lib/severity'

const PAGE_SIZE = 25

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

/**
 * Org-wide incident feed (Figma: Incidents nav item). Real API —
 * `/api/insights/` (SlackMessageInsight, own-Slack monitoring + AI
 * classification, already live — just never had a listing page before).
 * Project list (for the filter dropdown) is real too (useProjects, already
 * role-scoped server-side). Search/project/severity filters + pagination
 * are all server-side.
 */
export default function IncidentsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, projectId, severity])

  const { data: projectsData } = useProjects({ ordering: 'name' })
  const projects = projectsData?.results ?? []

  const { data, isLoading, isError, refetch } = useIncidents({
    project: projectId ? Number(projectId) : '',
    priority: mapSeverityToAiPriority(severity),
    search,
    page,
  })
  const incidents = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  function handleProjectChange(value: string) {
    setProjectId(value === 'all' ? '' : value)
  }

  function handleSeverityChange(value: string) {
    setSeverity(value === 'all' ? '' : (value as Severity))
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
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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

      {isLoading && <ShimmerTable mode="light" row={3} col={7} />}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load incidents. Check your connection and try again.</AlertTitle>
          <AlertAction>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Detected Time &amp; Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-slate-100">
                  <TableCell className="font-medium text-foreground">
                    {incident.ai_summary}
                  </TableCell>
                  <TableCell>{incident.project_name}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={mapAiPriorityToSeverity(incident.ai_priority)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="size-4 text-violet-600" aria-hidden="true" />
                      {incident.jira_ticket_keys.length > 0 && (
                        <Kanban className="size-4 text-blue-600" aria-hidden="true" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{incident.evidence}</TableCell>
                  <TableCell>#{incident.channel_name}</TableCell>
                  <TableCell className="text-slate-500">
                    {formatIncidentTimestamp(incident.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {incidents.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              No incidents match your filters.
            </p>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
