import { Link } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import type { ProjectStatus } from '@/hooks/useProjects'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
]

interface DashboardToolbarProps {
  status: ProjectStatus | ''
  onStatusChange: (status: ProjectStatus | '') => void
}

/** DASH-04/D-12: status filter drives the server-side ?status= param. No client filtering. */
export function DashboardToolbar({ status, onStatusChange }: DashboardToolbarProps) {
  const role = useAuthStore((state) => state.user?.role)

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <Select
        value={status || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? '' : (value as ProjectStatus))}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role === 'management' && (
        <Button asChild>
          <Link to="/projects/new">Create Project</Link>
        </Button>
      )}
    </div>
  )
}
