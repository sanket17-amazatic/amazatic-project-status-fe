import { ShimmerContentBlock } from 'shimmer-effects-react'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useActionPoints } from '@/hooks/useActionPoints'

interface ActionPointsListProps {
  projectId: number
}

/**
 * Real API — `GET /api/projects/{id}/action-points/` (useActionPoints).
 * Server already sorts soonest-deadline-first; capped at 8 here and split
 * column-major into two balanced columns (ceil(n/2) in col1, remainder in
 * col2 — e.g. 3 items is 2+1, not 3+0), mirroring the reference design (a
 * project with more than 8 open action points just shows its 8 most
 * urgent).
 */
export function ActionPointsList({ projectId }: ActionPointsListProps) {
  const { data, isLoading, isError, refetch } = useActionPoints(projectId)

  if (isLoading) {
    return <ShimmerContentBlock mode="light" items={2} loading />
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-2">
        <p className="border-b border-border pb-2 text-base font-semibold text-foreground">Action Points</p>
        <Alert variant="destructive">
          <AlertTitle>Couldn't load action points.</AlertTitle>
          <AlertAction>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      </div>
    )
  }

  const points = (data ?? []).slice(0, 8)
  const splitAt = Math.ceil(points.length / 2)
  const columns = [points.slice(0, splitAt), points.slice(splitAt)]

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="border-b border-border pb-2 text-base font-semibold text-foreground">Action Points</p>
      {points.length === 0 ? (
        <p className="text-sm text-slate-500">No open action points right now.</p>
      ) : (
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-10">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-1 flex-col">
              {column.map((point) => (
                <div
                  key={`${point.source}-${point.channel_name}-${point.user_name}-${point.created_at}`}
                  className="flex items-start gap-2.5 px-2.5 pt-2"
                >
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" />
                  <p className="text-sm font-normal leading-5 text-foreground">{point.ai_summary}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
