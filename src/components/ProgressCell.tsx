import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * D-02: null progress renders a muted em dash with a "Not connected"
 * tooltip — never a 0% bar, which would imply a project made zero progress.
 * Phase 2 data is always null; the populated branch is reserved for Phase 3.
 */
export function ProgressCell({ progress }: { progress: number | null }) {
  if (progress == null) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-slate-500" aria-label="Not connected">
            —
          </span>
        </TooltipTrigger>
        <TooltipContent>Not connected</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full bg-slate-700" style={{ width: `${progress}%` }} />
    </div>
  )
}
