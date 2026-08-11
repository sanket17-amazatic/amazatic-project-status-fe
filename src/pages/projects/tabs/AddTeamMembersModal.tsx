import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AssignableUser } from '@/hooks/useUsers'
import type { Membership } from '@/hooks/useMemberships'
import { useAddMember, useRemoveMember } from '@/hooks/useMemberships'
import {
  useAssociatedEmails,
  useAddAssociatedEmail,
  useRemoveAssociatedEmail,
} from '@/hooks/useAssociatedEmails'

// Same shape check the create wizard's EMAIL_RE / the old AssociatedEmailsSection used.
const EMAIL_RE = /^\S+@\S+\.\S+$/

interface AddTeamMembersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  users: AssignableUser[]
  members: Membership[]
}

/**
 * Multi-select of assignable users (search + toggle, no chip row — the
 * table below already shows the selection) plus a per-row "Project Email"
 * table, wired to real membership + AssociatedEmail hooks. Matches the
 * reference design's Add Team Members modal.
 */
export function AddTeamMembersModal({ open, onOpenChange, projectId, users, members }: AddTeamMembersModalProps) {
  const addMember = useAddMember(projectId)
  const removeMember = useRemoveMember(projectId)
  const { data: associatedEmails } = useAssociatedEmails(projectId)
  const addEmail = useAddAssociatedEmail(projectId)
  const removeEmail = useRemoveAssociatedEmail(projectId)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [emails, setEmails] = useState<Record<number, string>>({})

  useEffect(() => {
    if (open) {
      setSelectedIds(members.map((member) => member.user))
      setEmails(Object.fromEntries(associatedEmails.map((row) => [row.user, row.email])))
      setQuery('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) => `${user.name || ''} ${user.email}`.toLowerCase().includes(q))
  }, [users, query])

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(user.id)),
    [users, selectedIds]
  )

  function toggleUser(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  function handleUpdateMembers() {
    const currentUserIds = new Set(members.map((member) => member.user))
    const nextUserIds = new Set(selectedIds)

    for (const user of selectedUsers) {
      if (!currentUserIds.has(user.id)) {
        addMember.mutate(user.id)
      }
    }
    for (const member of members) {
      if (!nextUserIds.has(member.user)) {
        removeMember.mutate({ membershipId: member.id, name: member.user_name || member.user_email })
      }
    }

    for (const user of selectedUsers) {
      const trimmed = (emails[user.id] ?? '').trim()
      if (trimmed && !EMAIL_RE.test(trimmed)) continue // invalid — leave existing row untouched
      const existing = associatedEmails.find((row) => row.user === user.id)
      if (trimmed && trimmed !== existing?.email) {
        if (existing) removeEmail.mutate(existing.id)
        addEmail.mutate({ userId: user.id, email: trimmed })
      } else if (!trimmed && existing) {
        removeEmail.mutate(existing.id)
      }
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[507px] p-6">
        <div className="flex flex-col gap-4">
          <DialogTitle className="border-b border-[#e6e6e6] pb-3 text-base font-semibold">
            Add Team Members
          </DialogTitle>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-black">Team Members</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between rounded-sm border border-border px-3 text-sm text-slate-500 transition-colors hover:bg-slate-50"
              >
                Select team members
                <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
              </button>
              {dropdownOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close member list"
                    className="fixed inset-0 z-[9] cursor-default"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-sm border border-border bg-white shadow-md">
                  <div className="border-b border-border p-2">
                    <Input
                      autoFocus
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search..."
                      className="h-9 rounded-sm border-border text-sm"
                    />
                  </div>
                  {options.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-500">No matching users.</p>
                  ) : (
                    options.map((user) => {
                      const checked = selectedIds.includes(user.id)
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleUser(user.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded-xs border border-input',
                              checked && 'border-[#38c776] bg-[#38c776]'
                            )}
                          >
                            {checked && <Check className="size-3 text-white" aria-hidden="true" />}
                          </span>
                          {user.name || user.email}
                        </button>
                      )
                    })
                  )}
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-black">Add project email</p>
              <div className="max-h-64 overflow-y-auto rounded-md outline outline-1 outline-offset-0 outline-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-10 bg-slate-50">Member</TableHead>
                      <TableHead className="h-10 bg-slate-50 text-center">Project Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedUsers.map((user) => {
                      const value = emails[user.id] ?? ''
                      const invalid = value.trim().length > 0 && !EMAIL_RE.test(value.trim())
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="h-[54px] font-medium">
                            {user.name || user.email}
                          </TableCell>
                          <TableCell className="h-[54px]">
                            <Input
                              value={value}
                              onChange={(event) =>
                                setEmails((prev) => ({ ...prev, [user.id]: event.target.value }))
                              }
                              placeholder="Add project email"
                              className={cn(
                                'h-9 rounded-sm border-border text-sm',
                                invalid && 'border-destructive'
                              )}
                            />
                            {invalid && (
                              <p className="mt-1 text-xs text-destructive">Enter a valid email</p>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleUpdateMembers}
              className="h-9 rounded-sm bg-[#38c776] px-4 text-sm font-semibold text-white hover:bg-[#38c776]/90"
            >
              Update Members
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
