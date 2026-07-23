import { useState } from 'react'
import type { Project } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import { useUsers } from '@/hooks/useUsers'
import { useProjectMembers, useAddMember, useRemoveMember, useAssignPM } from '@/hooks/useMemberships'
import {
  useAssociatedEmails,
  useAddAssociatedEmail,
  useRemoveAssociatedEmail,
} from '@/hooks/useAssociatedEmails'
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
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { X } from 'lucide-react'
import { ShimmerButton, ShimmerContentBlock } from 'shimmer-effects-react'

function emailError(value: string): string | null {
  if (!value) return 'Required'
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email'
  return null
}

/**
 * Client-domain identity per project member (accounts.AssociatedEmail) —
 * scoped to a project's own PM or management (backend
 * IsProjectManagerOrManagement), a narrower gate than the rest of this tab
 * (which is management-only). Only members already on the project (or its
 * PM) are eligible — the backend serializer rejects anyone else.
 */
function AssociatedEmailsSection({
  project,
  members,
}: {
  project: Project
  members: { user: number; user_name: string; user_email: string }[]
}) {
  const projectId = String(project.id)
  const { data: associatedEmails, isLoading } = useAssociatedEmails(projectId)
  const addEmail = useAddAssociatedEmail(projectId)
  const removeEmail = useRemoveAssociatedEmail(projectId)

  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ id: number; email: string } | null>(null)

  const allCandidates = [
    { id: project.project_manager, label: project.project_manager_name },
    ...members.map((member) => ({
      id: member.user,
      label: member.user_name || member.user_email,
    })),
  ].filter(
    (candidate, index, all) => all.findIndex((other) => other.id === candidate.id) === index
  )
  // AssociatedEmailSerializer's user_name is User.get_full_name(), blank for
  // a user with no first/last name set — fall back to the member/PM label
  // (which itself falls back to email) rather than showing nothing.
  const nameById = new Map(allCandidates.map((candidate) => [candidate.id, candidate.label]))
  const eligibleUsers = allCandidates.filter(
    (candidate) => !associatedEmails.some((row) => row.user === candidate.id)
  )

  const error = emailError(email)
  const valid = !!userId && !error

  function handleAdd() {
    setTouched(true)
    if (!valid) return
    addEmail.mutate(
      { userId: Number(userId), email },
      {
        onSuccess: () => {
          setUserId('')
          setEmail('')
          setTouched(false)
        },
      }
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-foreground">Associated emails</h3>
      <p className="mb-3 text-xs text-slate-500">
        The client-domain address a member posts under in this project's client Slack workspace.
      </p>

      {isLoading ? (
        <ShimmerContentBlock mode="light" items={2} />
      ) : (
        <>
          <ul className="space-y-2">
            {associatedEmails.map((row) => (
              <li key={row.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-foreground">
                    {row.user_name || nameById.get(row.user) || `User #${row.user}`}
                  </span>
                  <span className="text-slate-500"> — {row.email}</span>
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Remove associated email"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-slate-100"
                      onClick={() => setRemoveTarget({ id: row.id, email: row.email })}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Remove associated email</TooltipContent>
                </Tooltip>
              </li>
            ))}
            {associatedEmails.length === 0 && (
              <li className="text-sm text-slate-500">No associated emails yet.</li>
            )}
          </ul>

          <div className="mt-3 flex items-end gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Member</label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.map((candidate) => (
                    <SelectItem key={candidate.id} value={String(candidate.id)}>
                      {candidate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Client email
              </label>
              <Input
                type="email"
                placeholder="member@client.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-56"
              />
              {touched && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
            <ShimmerButton mode="light" loading={addEmail.isPending}>
              <Button disabled={addEmail.isPending || (touched && !valid)} onClick={handleAdd}>
                Add
              </Button>
            </ShimmerButton>
          </div>
        </>
      )}

      <Dialog open={removeTarget != null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.email}?</DialogTitle>
            <DialogDescription>
              This client-domain identity will no longer be matched against inbound Slack
              messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) {
                  removeEmail.mutate(removeTarget.id)
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

/** PROJ-02: management assigns PM + adds/removes members; both selects are fed by useUsers(). */
export function TeamTab({ project }: { project: Project }) {
  const role = useAuthStore((state) => state.user?.role)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isManagement = role === 'management'
  // Associated emails are gated narrower than the rest of this tab (backend
  // IsProjectManagerOrManagement) — management, or specifically this
  // project's own PM, not any PM.
  const canManageEmails = isManagement || project.project_manager === currentUserId
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

        {canManageEmails && (
          <div className="border-t border-border pt-4">
            <AssociatedEmailsSection project={project} members={members} />
          </div>
        )}
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

      {canManageEmails && (
        <div className="border-t border-border pt-6">
          <AssociatedEmailsSection project={project} members={members} />
        </div>
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
