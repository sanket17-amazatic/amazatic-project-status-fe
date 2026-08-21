import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ChipProps {
  label: string
  /** Plain-text name for the remove button's aria-label, e.g. without a
   * `#` prefix. Defaults to `label` when the chip's label is already
   * screen-reader-clean (e.g. TeamTab's member names). */
  name?: string
  onRemove?: () => void
}

/**
 * Pill chip matching the reference design's team-member/channel chips —
 * shared by TeamTab (member chips), TeamsChannelsSection, and
 * SlackChannelsSection so a style tweak updates one place instead of three
 * copies drifting out of sync. `onRemove` omitted renders a plain,
 * non-removable chip (SlackChannelsSection's read-only list). `title`
 * mirrors `label` so a truncated chip still exposes its full value on
 * hover.
 */
export function Chip({ label, name, onRemove }: ChipProps) {
  return (
    <Badge
      variant="secondary"
      className="h-[30px] max-w-full gap-2.5 rounded-full bg-[#f5f5f5] px-3 text-[13px] font-medium text-black hover:bg-[#f5f5f5]"
    >
      <span className="min-w-0 truncate" title={label}>
        {label}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name ?? label}`}
          className="text-slate-500 transition-colors hover:text-black"
        >
          <X className="size-[15px]" aria-hidden="true" />
        </button>
      )}
    </Badge>
  )
}
