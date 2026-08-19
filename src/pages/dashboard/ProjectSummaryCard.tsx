import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { SeverityBadge } from '@/components/SeverityBadge'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import { SOURCE_META, type MessageSource } from '@/lib/sources'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/categories'
import type { Project, PriorityCounts } from '@/hooks/useProjects'

interface ProjectSummaryCardProps {
  project: Project
}

// Only slack/teams have real per-source incident counts on Project
// (slack_incidents/teams_incidents, ProjectSerializer) — jira has no
// equivalent breakdown field yet.
const SOURCE_ORDER: MessageSource[] = ['slack', 'teams']

// project.action_points can return up to 9 phrases (ProjectSerializer's
// _ACTION_POINT_POOL) — capped/split here to mirror the reference design's
// fixed-width 2-column-of-3 grid.
const MAX_ACTION_POINTS = 6

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size))
  }
  return groups
}

function SectionCard({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <div className="rounded-t-sm border border-border bg-muted px-3 py-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="flex items-start gap-3 rounded-b-sm border-b border-l border-r border-border p-3">
        {children}
      </div>
    </div>
  )
}

export function ProjectSummaryCard({ project }: ProjectSummaryCardProps) {
  const sources: Record<MessageSource, PriorityCounts> = {
    slack: project.slack_incidents,
    teams: project.teams_incidents,
  }

  const actionPoints = project.action_points.slice(0, MAX_ACTION_POINTS)

  const categoryCounts = new Map(project.incident_categories.map((c) => [c.category, c.count]))
  const categories = CATEGORY_ORDER.map((category) => ({
    category, count: categoryCounts.get(category) ?? 0,
  }))

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Card className="gap-[17px] px-4 transition-colors hover:border-primary/40 hover:shadow-md">
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-[7px] lg:w-[331px]">
            <div className="flex items-center gap-[7px]">
              <p className="text-[15px] font-semibold text-foreground">{project.name}</p>
              <SeverityBadge severity={mapAiPriorityToSeverity(project.severity)} />
            </div>
            <p className="text-sm">{project.summary}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:flex-nowrap">
            {SOURCE_ORDER.map((key) => {
              const counts = sources[key]
              const meta = SOURCE_META[key]
              return (
                <div
                  key={key}
                  className="flex min-w-[130px] flex-1 flex-col gap-2 rounded-sm border border-border bg-muted p-3 lg:flex-none lg:w-auto"
                >
                  <div className="flex items-center gap-2">
                    <img src={meta.icon} alt="" className="size-4 shrink-0" aria-hidden="true" />
                    <p className="whitespace-nowrap text-sm font-semibold text-foreground">{meta.label}</p>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap text-sm text-foreground">
                    <p>
                      {'C: '}
                      <span className="font-semibold text-red-600">{counts.critical}</span>
                    </p>
                    <p>
                      {'M: '}
                      <span className="font-semibold text-amber-600">{counts.medium}</span>
                    </p>
                    <p>
                      {'L: '}
                      <span className="font-semibold text-emerald-600">{counts.low}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:flex-row lg:flex-wrap">
          <SectionCard title="Action Points" className="flex flex-col lg:w-[506px] lg:shrink-0">
            {actionPoints.length === 0 ? (
              <p className="text-sm text-slate-500">No open action points right now.</p>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start">
                {chunk(actionPoints, 3).map((column, columnIndex) => (
                  <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-2">
                    {column.map((point) => (
                      <div key={point} className="flex min-w-0 items-start gap-2">
                        <span
                          aria-hidden
                          className="mt-1.5 size-[5px] shrink-0 rounded-full bg-foreground"
                        />
                        <p className="min-w-0 break-words text-sm text-foreground">{point}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Incidents by category" className="flex flex-col lg:w-[593px] lg:shrink-0">
            <div className="grid w-full grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              {categories.map(({ category, count }) => {
                const meta = CATEGORY_META[category]
                return (
                  <div key={category} className="flex min-w-0 items-center gap-2">
                    <img
                      src={meta.icon}
                      alt=""
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <p className="min-w-0 text-sm text-foreground">
                      <span className="font-semibold">{count}</span> <span>{meta.label}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      </Card>
    </Link>
  )
}
