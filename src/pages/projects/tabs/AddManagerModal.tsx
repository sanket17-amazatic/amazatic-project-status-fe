import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { AssignableUser } from '@/hooks/useUsers'
import { useAssignPM } from '@/hooks/useMemberships'
import {
  useAssociatedEmails,
  useAddAssociatedEmail,
  useRemoveAssociatedEmail,
} from '@/hooks/useAssociatedEmails'

// Same shape check the create wizard's EMAIL_RE / the old AssociatedEmailsSection used.
const EMAIL_RE = /^\S+@\S+\.\S+$/

interface AddManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  users: AssignableUser[]
  currentManagerId: number
}

/** Reassigns the PM (useAssignPM) and optionally sets/updates their project-specific email (AssociatedEmail) — matches the reference design's Add Manager modal, wired to real hooks. */
export function AddManagerModal({ open, onOpenChange, projectId, users, currentManagerId }: AddManagerModalProps) {
  const assignPM = useAssignPM(projectId)
  const { data: associatedEmails } = useAssociatedEmails(projectId)
  const addEmail = useAddAssociatedEmail(projectId)
  const removeEmail = useRemoveAssociatedEmail(projectId)

  const [managerId, setManagerId] = useState(String(currentManagerId))
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setManagerId(String(currentManagerId))
      const existing = associatedEmails.find((row) => row.user === currentManagerId)
      setEmail(existing?.email ?? '')
      setTouched(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentManagerId])

  const trimmedEmail = email.trim()
  const emailInvalid = trimmedEmail.length > 0 && !EMAIL_RE.test(trimmedEmail)

  function handleSubmit() {
    setTouched(true)
    if (emailInvalid) return

    const newManagerId = Number(managerId)
    if (newManagerId !== currentManagerId) {
      assignPM.mutate(newManagerId)
    }

    const existing = associatedEmails.find((row) => row.user === newManagerId)
    if (trimmedEmail && trimmedEmail !== existing?.email) {
      if (existing) removeEmail.mutate(existing.id)
      addEmail.mutate({ userId: newManagerId, email: trimmedEmail })
    } else if (!trimmedEmail && existing) {
      removeEmail.mutate(existing.id)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[507px] p-6">
        <div className="flex flex-col gap-4">
          <DialogTitle className="border-b border-[#e6e6e6] pb-3 text-base font-semibold">
            Add Project Manager
          </DialogTitle>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-black">Project Manager</p>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger className="h-11 w-full rounded-sm border-border text-sm font-medium text-black">
                  <SelectValue placeholder="Select a manager" />
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

            <div className="flex flex-col gap-2">
              <p className="text-sm text-black">Add Project Email</p>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Project email"
                className="h-11 rounded-sm border-border text-sm"
              />
              {touched && emailInvalid && (
                <p className="text-xs text-destructive">Enter a valid email</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              className="h-9 rounded-sm bg-[#38c776] px-4 text-sm font-semibold text-white hover:bg-[#38c776]/90"
            >
              Add Manager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
