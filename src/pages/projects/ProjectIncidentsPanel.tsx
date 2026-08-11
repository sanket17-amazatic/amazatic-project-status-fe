import { useEffect, useState } from 'react'
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
import { ShimmerTable } from 'shimmer-effects-react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { SeverityBadge } from '@/components/SeverityBadge'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity, mapSeverityToAiPriority, type Severity } from '@/lib/severity'
import { useIncidents, type Incident, type IncidentSource } from '@/hooks/useIncidents'
import { useIntegrations, readJiraConfig } from '@/hooks/useIntegrations'
import { EvidenceDrawer } from './EvidenceDrawer'

const PAGE_SIZE = 25

const PRIORITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const SOURCE_OPTIONS: { value: IncidentSource; label: string }[] = [
  { value: 'slack', label: 'Slack' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'jira', label: 'Jira' },
]

// "jira" here is never a real origin (see Incident.sources' docstring) —
// this only ever renders alongside a slack/teams icon, never alone.
const SOURCE_ICON: Record<IncidentSource, { icon: string; alt: string }> = {
  slack: { icon: '/icons/source-slack.svg', alt: 'Slack' },
  teams: { icon: '/icons/source-teams.svg', alt: 'Microsoft Teams' },
  jira: { icon: '/icons/source-jira.svg', alt: 'Jira' },
}

/**
 * Real API — `/api/insights/?project=<id>` (SlackMessageInsight, own-Slack
 * monitoring + AI classification, already live). Search/priority filter and
 * pagination are server-side, same convention as ProjectsListPage.
 */
export function ProjectIncidentsPanel({ projectId }: { projectId: number }) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<IncidentSource | ''>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [page, setPage] = useState(1)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: integrations } = useIntegrations(String(projectId))
  const jiraBaseUrl = readJiraConfig(
    integrations.find((integration) => integration.type === 'jira')?.config ?? {}
  ).jira_base_url

  function openEvidence(incident: Incident) {
    setSelectedIncident(incident)
    setDrawerOpen(true)
  }

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, source, severity])

  const { data, isLoading, isError, refetch } = useIncidents({
    project: projectId,
    priority: mapSeverityToAiPriority(severity),
    source,
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
            value={source || 'all'}
            onValueChange={(value) => setSource(value === 'all' ? '' : (value as IncidentSource))}
          >
            <SelectTrigger className="w-40" aria-label="Filter by source">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <ShimmerTable
          mode="light"
          row={2}
          col={6}
          loading
          border={1}
          rounded={0.1}
          rowGap={14}
          colPadding={[10, 5, 10, 5]}
        />
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
                <TableHead>Severity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Detected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow
                  key={incident.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => openEvidence(incident)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') openEvidence(incident)
                  }}
                  className="cursor-pointer hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <TableCell
                    className="max-w-[360px] truncate font-medium text-primary"
                    title={incident.ai_summary}
                  >
                    {incident.ai_summary}
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={mapAiPriorityToSeverity(incident.ai_priority)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {incident.sources.map((sourceKey) => (
                        <img
                          key={sourceKey}
                          src={SOURCE_ICON[sourceKey].icon}
                          alt={SOURCE_ICON[sourceKey].alt}
                          className="size-4 shrink-0"
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{incident.evidence}</TableCell>
                  <TableCell className="text-slate-500">
                    {formatIncidentTimestamp(incident.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <EvidenceDrawer
            incident={selectedIncident}
            jiraBaseUrl={jiraBaseUrl}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />

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
