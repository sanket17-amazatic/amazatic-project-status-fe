import { SourceKpiCard } from './SourceKpiCard'
import { ActionPointsList } from './ActionPointsList'
import { CategoryChip } from './CategoryChip'
import { mockSourceBreakdown, mockIncidentCategories, type MockSourceKey } from '@/lib/mockProjectBreakdown'
import type { Project } from '@/hooks/useProjects'

interface TodaysSummaryProps {
  project: Project
}

const SOURCE_ORDER: { key: MockSourceKey; label: string; icon: string }[] = [
  { key: 'slack', label: 'Slack', icon: '/icons/source-slack.svg' },
  { key: 'jira', label: 'Jira', icon: '/icons/source-jira.svg' },
  { key: 'email', label: 'Email', icon: '/icons/source-email.svg' },
  { key: 'calls', label: 'Calls', icon: '/icons/source-calls.svg' },
]

/**
 * Narrative sentence is generic (real total/critical counts only, no
 * fabricated specifics) — same approach as the Dashboard HeroBanner. The
 * per-source breakdown/action points/categories reuse the same mock
 * generators the Dashboard already established.
 */
export function TodaysSummary({ project }: TodaysSummaryProps) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const sources = mockSourceBreakdown(project.id)
  const categories = mockIncidentCategories(project.id)

  return (
    <div className="flex flex-col gap-6 rounded-md border border-border p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-base font-semibold text-foreground">
            {"Today's Summary "}
            <span className="font-medium">({today})</span>
          </p>
          <p className="text-sm font-medium text-foreground">
            {`This project has `}
            <span className="font-semibold">{project.open_incidents}</span>
            {` open incident${project.open_incidents === 1 ? '' : 's'}, `}
            <span className="font-semibold">{project.critical_incidents}</span>
            {' of them critical. Review the incidents below for details.'}
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          {SOURCE_ORDER.map(({ key, label, icon }) => (
            <SourceKpiCard key={key} label={label} icon={icon} stat={sources[key]} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ActionPointsList projectId={project.id} />

        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">Incidents by category</p>
          <div className="flex flex-wrap items-start gap-2">
            {categories.map(({ category, count }) => (
              <CategoryChip key={category} category={category} count={count} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
