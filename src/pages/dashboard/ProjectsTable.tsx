import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBadge } from '@/components/StatusBadge'
import { SeverityBadge } from '@/components/SeverityBadge'
import { mockIncidentStats } from '@/lib/mockIncidents'
import type { Project } from '@/hooks/useProjects'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface SortableHeaderProps {
  field: string
  label: string
  ordering: string
  onSort: (field: string) => void
}

function SortableHeader({ field, label, ordering, onSort }: SortableHeaderProps) {
  const active = ordering.replace('-', '') === field
  const desc = ordering.startsWith('-')
  const Icon = active && desc ? ChevronDown : ChevronUp

  return (
    <div className="flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Sort by ${label.toLowerCase()}`}
            className="flex min-h-6 min-w-6 items-center justify-center rounded hover:bg-slate-100"
            onClick={() => onSort(field)}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Sort by {label.toLowerCase()}</TooltipContent>
      </Tooltip>
    </div>
  )
}

interface ProjectsTableProps {
  projects: Project[]
  ordering: string
  onSort: (field: string) => void
}

/**
 * Dashboard table: Project (link) / Manager / Status / Open+Critical
 * Incidents / Evidence / Severity / Last Synced — matches the Figma
 * dashboard's column set. Open/Critical Incidents, Evidence, Severity, and
 * Last Synced are placeholder values (mockIncidentStats) pending a real
 * Incidents API; Project/Manager/Status stay wired to the real API.
 */
export function ProjectsTable({ projects, ordering, onSort }: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortableHeader field="name" label="Project" ordering={ordering} onSort={onSort} />
          </TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>
            <SortableHeader field="status" label="Status" ordering={ordering} onSort={onSort} />
          </TableHead>
          <TableHead>Open Incidents</TableHead>
          <TableHead>Critical Incidents</TableHead>
          <TableHead>Evidence</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Last Synced</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const mock = mockIncidentStats(project.id)
          return (
            <TableRow key={project.id} className="hover:bg-slate-100">
              <TableCell>
                <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                  {project.name}
                </Link>
                <p className="text-xs text-slate-500">{project.description}</p>
              </TableCell>
              <TableCell>{project.project_manager_name}</TableCell>
              <TableCell>
                <StatusBadge status={project.status} />
              </TableCell>
              <TableCell>{mock.openIncidents}</TableCell>
              <TableCell>{mock.criticalIncidents}</TableCell>
              <TableCell>{mock.evidence}</TableCell>
              <TableCell>
                <SeverityBadge severity={mock.severity} />
              </TableCell>
              <TableCell className="text-slate-500">{mock.lastSynced}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
