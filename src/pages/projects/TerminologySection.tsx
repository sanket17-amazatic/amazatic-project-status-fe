import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface TerminologyEntry {
  abbreviation: string
  meaning: string
}

/**
 * Purely local, non-persisting glossary — no backend model exists for this
 * anywhere in the app (and the reference design's own version doesn't
 * persist either, its Cancel/Update buttons just navigate away). Resets on
 * reload; seeded empty rather than with the reference's arbitrary sample
 * entries, since those wouldn't mean anything duplicated across real
 * projects here.
 */
export function TerminologySection() {
  const [entries, setEntries] = useState<TerminologyEntry[]>([])
  const [open, setOpen] = useState(false)
  const [abbreviation, setAbbreviation] = useState('')
  const [meaning, setMeaning] = useState('')

  const canSubmit = abbreviation.trim().length > 0 && meaning.trim().length > 0

  function handleAdd() {
    if (!canSubmit) return
    setEntries((prev) => [...prev, { abbreviation: abbreviation.trim(), meaning: meaning.trim() }])
    setAbbreviation('')
    setMeaning('')
    setOpen(false)
  }

  function handleRemove(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Terminology</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Add Terminology
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No terminology added yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map((entry, index) => (
            <li key={`${entry.abbreviation}-${index}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-foreground">
                <span className="font-semibold">{entry.abbreviation}</span> = {entry.meaning}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.abbreviation}`}
                    className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-slate-100"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Remove {entry.abbreviation}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Terminology</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Abbreviation</label>
              <Input
                value={abbreviation}
                onChange={(event) => setAbbreviation(event.target.value)}
                placeholder="MVP"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Full Term</label>
              <Input
                value={meaning}
                onChange={(event) => setMeaning(event.target.value)}
                placeholder="Minimum Viable Product"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={!canSubmit} onClick={handleAdd}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
