import { useState } from 'react'
import type { Project } from '@/hooks/useProjects'
import { useCanManageProject } from '@/hooks/useCanManageProject'
import { useUsers } from '@/hooks/useUsers'
import { useProjectMembers, useRemoveMember } from '@/hooks/useMemberships'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ShimmerContentBlock } from 'shimmer-effects-react'
import { AddActionLink } from './AddActionLink'
import { ProjectNameField } from './ProjectNameField'
import { AddManagerModal } from './AddManagerModal'
import { AddTeamMembersModal } from './AddTeamMembersModal'

/** Chip pill matching the reference design's team-member chip — reuses Badge the same way MemberTypeahead already does elsewhere in this repo, just with the reference's exact spacing/color values. */
function MemberChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="h-[30px] gap-2.5 rounded-full bg-[#f5f5f5] px-3 text-[13px] font-medium text-black hover:bg-[#f5f5f5]"
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="text-slate-500 transition-colors hover:text-black"
        >
          <X className="size-[15px]" aria-hidden="true" />
        </button>
      )}
    </Badge>
  )
}

/**
 * PROJ-02: management reassigns the PM; management or the project's own PM
 * can add/remove team members and set their project-specific (client-Slack)
 * emails, all from the Add Team Members modal — backend relaxed 2026-07-30
 * (MembershipViewSet + the assignable-user list both now allow PM, matching
 * AssociatedEmail's existing PM/management split) so PM and management use
 * the exact same modal instead of PM having a separate, email-only path.
 */
export function TeamTab({ project }: { project: Project }) {
  const { isManagement, canManage: canManageTeam } = useCanManageProject(project)
  const projectId = String(project.id)

  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  // useUsers() 403s for anyone who isn't management or PM — only fetch/render it when it's usable.
  const { data: users, isLoading: usersLoading } = useUsers()
  const removeMember = useRemoveMember(projectId)

  const [removeTarget, setRemoveTarget] = useState<{ id: number; name: string } | null>(null)
  const [managerModalOpen, setManagerModalOpen] = useState(false)
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  if (membersLoading || (canManageTeam && usersLoading)) {
    return (
      <div className="space-y-6">
        <ShimmerContentBlock mode="light" items={4} loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex w-full flex-col gap-4 lg:w-[566px] lg:shrink-0">
          <ProjectNameField projectId={project.id} name={project.name} editable={isManagement} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black">Project Manager</p>
              {isManagement && (
                <AddActionLink label="Add Manager" onClick={() => setManagerModalOpen(true)} />
              )}
            </div>
            <div className="flex h-11 items-center justify-center rounded-sm border border-border px-3">
              <p className="text-sm font-medium text-black">{project.project_manager_name}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-[565px] lg:shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-black">Team Members</p>
            {canManageTeam && (
              <AddActionLink label="Add Team Members" onClick={() => setMembersModalOpen(true)} />
            )}
          </div>
          <div className="flex min-h-[132px] flex-wrap items-start gap-2 rounded-sm border border-border p-[13px]">
            {members.map((member) => (
              <MemberChip
                key={member.id}
                label={member.user_name || member.user_email}
                onRemove={
                  canManageTeam
                    ? () =>
                        setRemoveTarget({
                          id: member.id,
                          name: member.user_name || member.user_email,
                        })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      {isManagement && (
        <AddManagerModal
          open={managerModalOpen}
          onOpenChange={setManagerModalOpen}
          projectId={projectId}
          users={users}
          currentManagerId={project.project_manager}
        />
      )}
      {canManageTeam && (
        <AddTeamMembersModal
          open={membersModalOpen}
          onOpenChange={setMembersModalOpen}
          projectId={projectId}
          users={users}
          members={members}
        />
      )}

      <Dialog open={removeTarget != null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.name} from this project?</DialogTitle>
            <DialogDescription>They'll lose access to this project immediately.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) {
                  removeMember.mutate({ membershipId: removeTarget.id, name: removeTarget.name })
                  setRemoveTarget(null)
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
