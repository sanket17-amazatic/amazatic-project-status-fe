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
import { AddActionLink } from './tabs/AddActionLink'

interface TerminologyEntry {
  abbreviation: string
  meaning: string
}

/** Splits entries into up to 4 roughly-even columns, reference-design style. */
function chunkIntoColumns<T>(entries: T[], maxColumns = 4): T[][] {
  if (entries.length === 0) return []
  const columnCount = Math.min(maxColumns, entries.length)
  const perColumn = Math.ceil(entries.length / columnCount)
  const columns: T[][] = []
  for (let i = 0; i < entries.length; i += perColumn) {
    columns.push(entries.slice(i, i + perColumn))
  }
  return columns
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

  const columns = chunkIntoColumns(entries)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
        <p className="text-base font-semibold text-black">Terminology</p>
        <AddActionLink label="Add Terminology" onClick={() => setOpen(true)} />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No terminology added yet.</p>
      ) : (
        <div className="flex w-full gap-0 overflow-x-auto rounded-sm border border-border p-[11px]">
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex flex-1 flex-col gap-3 border-border px-3 first:pl-0 last:border-r-0"
              style={{ borderRightWidth: columnIndex < columns.length - 1 ? 1 : 0 }}
            >
              {column.map((entry) => {
                const index = entries.indexOf(entry)
                return (
                  <div
                    key={`${entry.abbreviation}-${index}`}
                    className="flex items-center justify-between gap-2 text-sm whitespace-nowrap"
                  >
                    <p className="text-black">
                      <span className="font-semibold">{entry.abbreviation}</span> ={' '}
                      <span className="font-medium">{entry.meaning}</span>
                    </p>
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
                  </div>
                )
              })}
            </div>
          ))}
        </div>
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
