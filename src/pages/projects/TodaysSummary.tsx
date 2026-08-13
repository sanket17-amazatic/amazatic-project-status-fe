import { useState } from 'react'
import { ShimmerContentBlock } from 'shimmer-effects-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SourceKpiCard } from './SourceKpiCard'
import { ActionPointsList } from './ActionPointsList'
import { CategoryChip } from './CategoryChip'
import { useProjectSummary, type SummaryRange } from '@/hooks/useProjectSummary'
import { SOURCE_META, SOURCE_ORDER } from '@/lib/sources'
import type { Project } from '@/hooks/useProjects'

interface TodaysSummaryProps {
  project: Project
}

const RANGE_OPTIONS: { value: SummaryRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

/**
 * Real API — `GET /api/projects/{id}/summary/?range=` (useProjectSummary).
 * Narrative/totals/per-source breakdown/categories all come from the
 * server, range-scoped by the dropdown below; Action Points is a separate,
 * unfiltered real endpoint (see ActionPointsList) — its forward-looking
 * deadline window doesn't compose with this range filter.
 */
export function TodaysSummary({ project }: TodaysSummaryProps) {
  const [range, setRange] = useState<SummaryRange>('today')
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const { data, isLoading, isError, refetch } = useProjectSummary(project.id, range)

  return (
    <div className="flex flex-col gap-6 rounded-md border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-semibold text-foreground">
          {"Today's Summary "}
          <span className="font-medium">({today})</span>
        </p>
        <Select value={range} onValueChange={(value) => setRange(value as SummaryRange)}>
          <SelectTrigger className="h-9 w-40" aria-label="Summary date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <ShimmerContentBlock mode="light" items={3} loading />}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load this project's summary. Check your connection and try again.</AlertTitle>
          <AlertAction>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && !isError && data && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-foreground">{data.narrative}</p>

          <div className="flex flex-wrap items-stretch gap-3">
            {SOURCE_ORDER.map((key) => (
              <SourceKpiCard
                key={key}
                label={SOURCE_META[key].label}
                icon={SOURCE_META[key].icon}
                stat={data.sources[key]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Independent of the summary query above (own endpoint, no range
            filter) — must stay mounted across the summary's isLoading
            transitions, or it unmounts/remounts and re-fetches for no
            reason every time the range dropdown changes. */}
        <ActionPointsList projectId={project.id} />

        {!isLoading && !isError && data && (
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-foreground">Incidents by category</p>
            {data.categories.length === 0 ? (
              <p className="text-sm text-slate-500">No categorized incidents in this range.</p>
            ) : (
              <div className="flex flex-wrap items-start gap-2">
                {data.categories.map(({ category, count }) => (
                  <CategoryChip key={category} category={category} count={count} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
