import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ChipProps {
  label: string
  onRemove?: () => void
}

/**
 * Pill chip matching the reference design's team-member/channel chips —
 * shared by TeamTab (member chips), TeamsChannelsSection, and
 * SlackChannelsSection so a style tweak updates one place instead of three
 * copies drifting out of sync. `onRemove` omitted renders a plain,
 * non-removable chip (SlackChannelsSection's read-only list).
 */
export function Chip({ label, onRemove }: ChipProps) {
  return (
    <Badge
      variant="secondary"
      className="h-[30px] max-w-full gap-2.5 rounded-full bg-[#f5f5f5] px-3 text-[13px] font-medium text-black hover:bg-[#f5f5f5]"
    >
      <span className="min-w-0 truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="text-slate-500 transition-colors hover:text-black"
        >
          <X className="size-[15px]" aria-hidden="true" />
        </button>
      )}
    </Badge>
  )
}
