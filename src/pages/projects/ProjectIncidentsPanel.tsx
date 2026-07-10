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
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { SeverityBadge } from '@/components/SeverityBadge'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity, mapSeverityToAiPriority, type Severity } from '@/lib/severity'
import { useIncidents } from '@/hooks/useIncidents'

const PAGE_SIZE = 25

const PRIORITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

/**
 * Real API — `/api/insights/?project=<id>` (SlackMessageInsight, own-Slack
 * monitoring + AI classification, already live). Search/priority filter and
 * pagination are server-side, same convention as ProjectsListPage.
 */
export function ProjectIncidentsPanel({ projectId }: { projectId: number }) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, severity])

  const { data, isLoading, isError, refetch } = useIncidents({
    project: projectId,
    priority: mapSeverityToAiPriority(severity),
    search,
    page,
  })
  const incidents = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Incidents</h2>
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search incidents..."
              aria-label="Search incidents"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-9 pl-8"
            />
          </div>
          <Select
            value={severity || 'all'}
            onValueChange={(value) => setSeverity(value === 'all' ? '' : (value as Severity))}
          >
            <SelectTrigger className="w-36" aria-label="Filter by priority">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

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
                <TableHead>Priority</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Detected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-slate-100">
                  <TableCell className="font-medium text-foreground">
                    {incident.ai_summary}
                  </TableCell>
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
            <p className="py-8 text-center text-sm text-slate-500">
              No incidents recorded for this project yet.
            </p>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
