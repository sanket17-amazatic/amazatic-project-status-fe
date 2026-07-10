import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SeverityBadge } from '@/components/SeverityBadge'
import { mockIncidentStats } from '@/lib/mockIncidents'
import type { Project } from '@/hooks/useProjects'

interface ProjectsListTableProps {
  projects: Project[]
}

/**
 * Projects page table (Figma node 73:5163) — Project / Manager / Open
 * Incidents / Critical Incidents / Evidences / Severity / Last Synced.
 * No Status column and no sort affordance, unlike the Dashboard's
 * ProjectsTable (kept separate rather than overloading one component with
 * conditional columns). Incident/severity columns are mock placeholders
 * pending a real Incidents API (see src/lib/mockIncidents.ts).
 */
export function ProjectsListTable({ projects }: ProjectsListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Open Incidents</TableHead>
          <TableHead>Critical Incidents</TableHead>
          <TableHead>Evidences</TableHead>
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
