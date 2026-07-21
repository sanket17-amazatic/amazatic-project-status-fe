import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@/hooks/useProjects'
import { useUpdateProject, useDeleteProject } from '@/hooks/useProjectMutations'
import { useAuthStore } from '@/stores/authStore'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDeadline } from '@/lib/format'
import { ProjectForm } from '../ProjectForm'
import type { ProjectFormValues } from '@/hooks/useProjectMutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

/** PROJ-04: management edits via the shared form; everyone else sees read-only text. */
export function DetailsTab({ project }: { project: Project }) {
  const role = useAuthStore((state) => state.user?.role)
  const updateProject = useUpdateProject(String(project.id))
  const deleteProject = useDeleteProject()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  if (role === 'management') {
    function handleSubmit(values: ProjectFormValues) {
      updateProject.mutate(values)
    }

    function handleDelete() {
      deleteProject.mutate(String(project.id), {
        onSuccess: () => navigate('/projects'),
      })
    }

    return (
      <div className="space-y-8 pt-4">
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

        <div className="rounded-md border border-destructive/30 p-4">
          <h3 className="text-sm font-medium text-foreground">Delete this project</h3>
          <p className="mt-1 text-sm text-slate-500">
            Permanently deletes {project.name}, its team, integrations, and every incident and
            piece of evidence recorded against it. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            onClick={() => setDeleteOpen(true)}
          >
            Delete project
          </Button>
        </div>

        <Dialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setConfirmName('')
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete "{project.name}"?</DialogTitle>
              <DialogDescription>
                This permanently deletes the project along with its team, integrations, and
                every incident and piece of evidence recorded against it. Type{' '}
                <span className="font-medium text-foreground">{project.name}</span> to confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={project.name}
              aria-label="Confirm project name"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={confirmName !== project.name || deleteProject.isPending}
                onClick={handleDelete}
              >
                Delete project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
