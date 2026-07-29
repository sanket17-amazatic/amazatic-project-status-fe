import { Link, useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SeverityBadge } from '@/components/SeverityBadge'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import { mockIncidentMediumLowSplit } from '@/lib/mockProjectBreakdown'
import type { Project } from '@/hooks/useProjects'

interface ProjectsListTableProps {
  projects: Project[]
}

/**
 * T/C are real (open_incidents/critical_incidents, ProjectSerializer). M/L
 * have no backing field yet — mocked as a split of the real remainder
 * (T-C) so T always equals C+M+L, never an inconsistent-looking row.
 */
function IncidentCounts({ project }: { project: Project }) {
  const remaining = Math.max(0, project.open_incidents - project.critical_incidents)
  const { medium, low } = mockIncidentMediumLowSplit(project.id, remaining)

  return (
    <div className="flex items-center gap-3 whitespace-nowrap text-sm text-foreground">
      <span>
        {'T: '}
        <span className="font-semibold">{project.open_incidents}</span>
      </span>
      <span>
        {'C: '}
        <span className="font-semibold text-red-600">{project.critical_incidents}</span>
      </span>
      <span>
        {'M: '}
        <span className="font-semibold text-amber-600">{medium}</span>
      </span>
      <span>
        {'L: '}
        <span className="font-semibold text-emerald-600">{low}</span>
      </span>
    </div>
  )
}

/**
 * Projects page table — Project / Manager / Incidents / Severity / Last
 * Synced. No Status column and no sort affordance, unlike the Dashboard's
 * ProjectsTable (kept separate rather than overloading one component with
 * conditional columns). T/C incident counts and severity are real, derived
 * server-side from SlackMessageInsight (ProjectSerializer); see
 * IncidentCounts for the M/L mock caveat. Whole row navigates to the
 * project detail page (click or Enter), matching the reference design —
 * the project-name Link stays for keyboard tab order / middle-click.
 */
export function ProjectsListTable({ projects }: ProjectsListTableProps) {
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Incidents</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Last Synced</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/projects/${project.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') navigate(`/projects/${project.id}`)
            }}
            className="cursor-pointer hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <TableCell>
              <Link
                to={`/projects/${project.id}`}
                onClick={(event) => event.stopPropagation()}
                className="text-primary hover:underline"
              >
                {project.name}
              </Link>
              <p className="text-xs text-slate-500">{project.description}</p>
            </TableCell>
            <TableCell>{project.project_manager_name}</TableCell>
            <TableCell>
              <IncidentCounts project={project} />
            </TableCell>
            <TableCell>
              <SeverityBadge severity={mapAiPriorityToSeverity(project.severity)} />
            </TableCell>
            <TableCell className="text-slate-500">
              {formatIncidentTimestamp(project.last_synced)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
