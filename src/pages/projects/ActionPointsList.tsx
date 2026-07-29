import { mockActionPoints } from '@/lib/mockProjectBreakdown'

interface ActionPointsListProps {
  projectId: number
}

/** Column counts (4/4) mirror the reference design's 8-item column-major grouping. */
export function ActionPointsList({ projectId }: ActionPointsListProps) {
  const points = mockActionPoints(projectId, 8)
  const columns = [points.slice(0, 4), points.slice(4, 8)]

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="border-b border-border pb-2 text-base font-semibold text-foreground">Action Points</p>
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-1 flex-col">
            {column.map((point) => (
              <div key={point} className="flex items-start gap-2.5 px-2.5 pt-1.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                <p className="text-sm font-medium leading-5 text-foreground">{point}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
