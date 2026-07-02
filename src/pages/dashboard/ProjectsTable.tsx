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
import { ProgressCell } from '@/components/ProgressCell'
import { formatDeadline } from '@/lib/format'
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

/** UI-SPEC dashboard table: Project (link) / Status / Progress / Next deadline / PM name. */
export function ProjectsTable({ projects, ordering, onSort }: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortableHeader field="name" label="Project" ordering={ordering} onSort={onSort} />
          </TableHead>
          <TableHead>
            <SortableHeader field="status" label="Status" ordering={ordering} onSort={onSort} />
          </TableHead>
          <TableHead>
            <SortableHeader
              field="progress"
              label="Progress"
              ordering={ordering}
              onSort={onSort}
            />
          </TableHead>
          <TableHead>
            <SortableHeader
              field="end_date"
              label="Next deadline"
              ordering={ordering}
              onSort={onSort}
            />
          </TableHead>
          <TableHead>PM name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="hover:bg-slate-100">
            <TableCell>
              <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                {project.name}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={project.status} />
            </TableCell>
            <TableCell>
              <ProgressCell progress={project.progress} />
            </TableCell>
            <TableCell className="text-slate-500">{formatDeadline(project.end_date)}</TableCell>
            <TableCell>{project.project_manager_name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
