import type { Project } from '@/hooks/useProjects'
import { useUpdateProject } from '@/hooks/useProjectMutations'
import { useAuthStore } from '@/stores/authStore'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDeadline } from '@/lib/format'
import { ProjectForm } from '../ProjectForm'
import type { ProjectFormValues } from '@/hooks/useProjectMutations'

/** PROJ-04: management edits via the shared form; everyone else sees read-only text. */
export function DetailsTab({ project }: { project: Project }) {
  const role = useAuthStore((state) => state.user?.role)
  const updateProject = useUpdateProject(String(project.id))

  if (role === 'management') {
    function handleSubmit(values: ProjectFormValues) {
      updateProject.mutate(values)
    }

    return (
      <div className="pt-4">
        <ProjectForm
          mode="edit"
          defaultValues={{
            name: project.name,
            description: project.description,
            start_date: project.start_date,
            end_date: project.end_date,
            status: project.status,
          }}
          onSubmit={handleSubmit}
          pending={updateProject.isPending}
        />
      </div>
    )
  }

  return (
    <dl className="grid grid-cols-2 gap-4 pt-4 text-sm">
      <div>
        <dt className="text-slate-500">Name</dt>
        <dd className="text-foreground">{project.name}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Status</dt>
        <dd>
          <StatusBadge status={project.status} />
        </dd>
      </div>
      <div className="col-span-2">
        <dt className="text-slate-500">Description</dt>
        <dd className="text-foreground">{project.description || '—'}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Start date</dt>
        <dd className="text-foreground">{formatDeadline(project.start_date)}</dd>
      </div>
      <div>
        <dt className="text-slate-500">End date</dt>
        <dd className="text-foreground">{formatDeadline(project.end_date)}</dd>
      </div>
    </dl>
  )
}
