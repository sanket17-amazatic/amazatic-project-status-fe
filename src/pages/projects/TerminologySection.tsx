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
import { useUpdateProject } from '@/hooks/useProjectMutations'
import type { TerminologyEntry } from '@/hooks/useProjects'

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
 * Project-specific shorthand glossary (Project.terminology) — fed into the
 * AI summarizer's project_context server-side, so it's not just a display
 * list (see backend projects.services.ai_context.build_ai_project_context).
 * Persists via PATCH like ClientEmailsField; each add/remove sends the
 * whole updated array as the sole PATCH key (backend's PM carve-out
 * requires that — see IsManagementOrPMCanCreateProject).
 */
export function TerminologySection({
  projectId,
  terminology,
  editable,
}: {
  projectId: number
  terminology: TerminologyEntry[]
  editable: boolean
}) {
  const updateProject = useUpdateProject(String(projectId))
  const [open, setOpen] = useState(false)
  const [abbreviation, setAbbreviation] = useState('')
  const [meaning, setMeaning] = useState('')

  const canSubmit = abbreviation.trim().length > 0 && meaning.trim().length > 0

  function handleAdd() {
    if (!canSubmit || updateProject.isPending) return
    const next = [...terminology, { abbreviation: abbreviation.trim(), meaning: meaning.trim() }]
    updateProject.mutate(
      { terminology: next },
      {
        // Only clear the form and close on success — on failure the dialog
        // stays open with what was typed so the user can just retry instead
        // of losing their input and having to retype it (PR #12 review).
        onSuccess: () => {
          setAbbreviation('')
          setMeaning('')
          setOpen(false)
        },
      }
    )
  }

  function handleRemove(index: number) {
    if (updateProject.isPending) return
    updateProject.mutate({ terminology: terminology.filter((_, i) => i !== index) })
  }

  // Pair each entry with its real index before chunking — avoids
  // terminology.indexOf(entry) (O(n) per row, reference-equality-based)
  // inside the render loop below (PR #12 review).
  const columns = chunkIntoColumns(terminology.map((entry, index) => ({ entry, index })))

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
        <p className="text-base font-semibold text-black">Terminology</p>
        {editable && <AddActionLink label="Add Terminology" onClick={() => setOpen(true)} />}
      </div>

      {terminology.length === 0 ? (
        <p className="text-sm text-slate-500">No terminology added yet.</p>
      ) : (
        <div className="flex w-full gap-0 overflow-x-auto rounded-sm border border-border p-[11px]">
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex flex-1 flex-col gap-3 border-border px-3 first:pl-0 last:border-r-0"
              style={{ borderRightWidth: columnIndex < columns.length - 1 ? 1 : 0 }}
            >
              {column.map(({ entry, index }) => (
                <div
                  key={`${entry.abbreviation}-${index}`}
                  className="flex items-center justify-between gap-2 text-sm whitespace-nowrap"
                >
                  <p className="text-black">
                    <span className="font-semibold">{entry.abbreviation}</span> ={' '}
                    <span className="font-medium">{entry.meaning}</span>
                  </p>
                  {editable && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Remove ${entry.abbreviation}`}
                          disabled={updateProject.isPending}
                          className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => handleRemove(index)}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove {entry.abbreviation}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ))}
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
            <Button disabled={!canSubmit || updateProject.isPending} onClick={handleAdd}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
