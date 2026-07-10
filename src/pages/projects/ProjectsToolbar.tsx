import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import type { Severity } from '@/lib/mockIncidents'

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

interface ProjectsToolbarProps {
  search: string
  onSearchChange: (search: string) => void
  severity: Severity | ''
  onSeverityChange: (severity: Severity | '') => void
}

/**
 * Search hits the real `?search=` API param (ProjectViewSet SearchFilter).
 * Severity filters client-side over the mock incident data (no backend
 * severity field exists yet — same placeholder pattern as mockIncidentStats).
 */
export function ProjectsToolbar({
  search,
  onSearchChange,
  severity,
  onSeverityChange,
}: ProjectsToolbarProps) {
  const role = useAuthStore((state) => state.user?.role)

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="relative w-72">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search projects..."
          aria-label="Search projects"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-8"
        />
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={severity || 'all'}
          onValueChange={(value) => onSeverityChange(value === 'all' ? '' : (value as Severity))}
        >
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
        {role === 'management' && (
          <Button asChild className="bg-[#38C776] text-white hover:bg-[#2fb267]">
            <Link to="/projects/new">Create Project</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
