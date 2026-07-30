import { Plus } from 'lucide-react'

/** Small green "+ Add X" text-link — matches the reference design's affordance for opening the Add Manager / Add Team Members / Add Terminology modals. */
export function AddActionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center justify-end gap-1 text-sm font-medium whitespace-nowrap text-[#38c776] transition-colors hover:text-[#38c776]/80"
    >
      <Plus className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  )
}
