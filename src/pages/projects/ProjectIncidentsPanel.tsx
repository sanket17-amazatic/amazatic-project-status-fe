import { useMemo, useState } from 'react'
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
import { SeverityBadge } from '@/components/SeverityBadge'
import { mockIncidentsList, type Severity } from '@/lib/mockIncidents'

const PRIORITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

/**
 * Fully mock — no Incidents API exists yet (see mockIncidentsList). Search
 * and priority filter are client-side over this project's mock rows only
 * (not the "never client-filter" rule — there's no server endpoint at all
 * to violate here).
 */
export function ProjectIncidentsPanel({ projectId }: { projectId: number }) {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<Severity | ''>('')

  const incidents = useMemo(() => mockIncidentsList(projectId), [projectId])
  const visible = incidents.filter((incident) => {
    if (priority && incident.priority !== priority) return false
    if (search && !incident.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-8"
            />
          </div>
          <Select
            value={priority || 'all'}
            onValueChange={(value) => setPriority(value === 'all' ? '' : (value as Severity))}
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
          {visible.map((incident) => (
            <TableRow key={incident.id} className="hover:bg-slate-100">
              <TableCell className="font-medium text-foreground">{incident.title}</TableCell>
              <TableCell>
                <SeverityBadge severity={incident.priority} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {incident.sources.includes('slack') && (
                    <MessageSquare className="size-4 text-violet-600" aria-hidden="true" />
                  )}
                  {incident.sources.includes('jira') && (
                    <Kanban className="size-4 text-blue-600" aria-hidden="true" />
                  )}
                </div>
              </TableCell>
              <TableCell>{incident.evidence}</TableCell>
              <TableCell>{incident.impact}</TableCell>
              <TableCell className="text-slate-500">{incident.detected}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">No incidents match your filters.</p>
      )}
    </div>
  )
}
