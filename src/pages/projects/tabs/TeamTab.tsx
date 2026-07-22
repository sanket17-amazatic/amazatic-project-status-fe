import { useState } from 'react'
import type { Project } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import { useUsers } from '@/hooks/useUsers'
import { useProjectMembers, useAddMember, useRemoveMember, useAssignPM } from '@/hooks/useMemberships'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { X } from 'lucide-react'
import { ShimmerButton, ShimmerContentBlock } from 'shimmer-effects-react'

/** PROJ-02: management assigns PM + adds/removes members; both selects are fed by useUsers(). */
export function TeamTab({ project }: { project: Project }) {
  const role = useAuthStore((state) => state.user?.role)
  const isManagement = role === 'management'
  const projectId = String(project.id)

  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  // useUsers() 403s for non-management — only fetch/render it when it's usable.
  const { data: users, isLoading: usersLoading } = useUsers()
  const addMember = useAddMember(projectId)
  const removeMember = useRemoveMember(projectId)
  const assignPM = useAssignPM(projectId)

  const [removeTarget, setRemoveTarget] = useState<{ id: number; name: string } | null>(null)
  const [addUserId, setAddUserId] = useState<string>('')

  if (membersLoading || (isManagement && usersLoading)) {
    return (
      <div className="space-y-6 pt-4">
        <ShimmerContentBlock mode="light" items={4} loading />
      </div>
    )
  }

  const memberUserIds = new Set(members.map((member) => member.user))
  const availableUsers = users.filter((user) => !memberUserIds.has(user.id))

  if (!isManagement) {
    return (
      <div className="space-y-4 pt-4 text-sm">
        <div>
          <span className="text-slate-500">Project manager: </span>
          {project.project_manager_name}
        </div>
        <div>
          <span className="text-slate-500">Members</span>
          <ul className="mt-1 list-disc pl-5">
            {members.map((member) => (
              <li key={member.id}>{member.user_name || member.user_email}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Project manager</label>
        <Select
          value={String(project.project_manager)}
          onValueChange={(value) => assignPM.mutate(Number(value))}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Members</h3>
        <ul className="space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between text-sm">
              <span>{member.user_name || member.user_email}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Remove member"
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-slate-100"
                    onClick={() =>
                      setRemoveTarget({ id: member.id, name: member.user_name || member.user_email })
                    }
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Remove member</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Add member</label>
          <Select value={addUserId} onValueChange={setAddUserId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ShimmerButton mode="light" loading={addMember.isPending}>
          <Button
            disabled={!addUserId || addMember.isPending}
            onClick={() => {
              addMember.mutate(Number(addUserId))
              setAddUserId('')
            }}
          >
            Add member
          </Button>
        </ShimmerButton>
      </div>

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
