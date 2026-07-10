import { useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AssignableUser } from '@/hooks/useUsers'

interface MemberTypeaheadProps {
  users: AssignableUser[]
  /** The currently-selected manager — hidden from the options list so the
   * PM can't also be added as a plain team member (spec requirement). */
  excludeUserId?: number | null
  value: number[]
  onChange: (ids: number[]) => void
}

/** Select-styled trigger (search-as-you-type, no cmdk/Popover dep in this
 * repo yet) with selected members rendered as removable chips below it,
 * matching the design's "Select team members" dropdown + separate chip row. */
export function MemberTypeahead({ users, excludeUserId, value, onChange }: MemberTypeaheadProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedUsers = useMemo(
    () => users.filter((user) => value.includes(user.id)),
    [users, value]
  )

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((user) => {
      if (user.id === excludeUserId) return false
      if (value.includes(user.id)) return false
      if (!q) return true
      return `${user.name || ''} ${user.email}`.toLowerCase().includes(q)
    })
  }, [users, excludeUserId, value, query])

  function addMember(id: number) {
    onChange([...value, id])
    setQuery('')
  }

  function removeMember(id: number) {
    onChange(value.filter((existing) => existing !== id))
  }

  return (
    <div>
      <div className="relative">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Select team members"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm outline-none placeholder:text-slate-400 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        {open && (
          <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-white shadow-md">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">No matching users.</p>
            ) : (
              options.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addMember(user.id)}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="text-foreground">{user.name || user.email}</span>
                  {user.name && <span className="text-xs text-slate-500">{user.email}</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selectedUsers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="h-7 gap-1.5 rounded-full bg-slate-100 px-3 text-sm font-normal text-slate-700 hover:bg-slate-100"
            >
              {user.name || user.email}
              <button
                type="button"
                aria-label={`Remove ${user.name || user.email}`}
                onClick={() => removeMember(user.id)}
                className="rounded-full text-slate-500 hover:text-slate-700"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
