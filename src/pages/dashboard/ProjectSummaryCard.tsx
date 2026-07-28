import { Link } from 'react-router-dom'
import {
  Hash,
  Ticket,
  Mail,
  Users,
  Phone,
  MessageSquare,
  Clock,
  GitBranch,
  Wrench,
  RefreshCw,
  Repeat,
  Ban,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SeverityBadge } from '@/components/SeverityBadge'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import {
  mockSourceBreakdown,
  mockActionPoints,
  mockIncidentCategories,
  type MockSourceKey,
  type MockIncidentCategory,
} from '@/lib/mockProjectBreakdown'
import type { Project } from '@/hooks/useProjects'

interface ProjectSummaryCardProps {
  project: Project
}

const SOURCE_META: Record<MockSourceKey, { label: string; icon: LucideIcon }> = {
  slack: { label: 'Slack', icon: Hash },
  jira: { label: 'Jira', icon: Ticket },
  email: { label: 'Email', icon: Mail },
  teams: { label: 'Microsoft Teams', icon: Users },
  calls: { label: 'Calls', icon: Phone },
}

const SOURCE_ORDER: MockSourceKey[] = ['slack', 'jira', 'email', 'teams', 'calls']

const CATEGORY_ICON: Record<MockIncidentCategory, LucideIcon> = {
  Communication: MessageSquare,
  'Delivery Delays': Clock,
  'Cross team dependency': GitBranch,
  'Technical Debt': Wrench,
  'Scope Change': RefreshCw,
  'Sprint Spillover': Repeat,
  Blockers: Ban,
}

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
  const sources = mockSourceBreakdown(project.id)
  const actionPoints = mockActionPoints(project.id)
  const categories = mockIncidentCategories(project.id)

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
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:flex-nowrap">
            {SOURCE_ORDER.map((key) => {
              const counts = sources[key]
              const meta = SOURCE_META[key]
              const Icon = meta.icon
              return (
                <div
                  key={key}
                  className="flex min-w-[130px] flex-1 flex-col gap-2 rounded-sm border border-border bg-muted p-3 lg:flex-none lg:w-auto"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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

        <div className="flex w-full flex-col gap-4 lg:flex-row">
          <SectionCard title="Action Points" className="flex flex-col lg:w-[506px] lg:shrink-0">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start">
              {chunk(actionPoints, 3).map((column, columnIndex) => (
                <div key={columnIndex} className="flex shrink-0 flex-col gap-1">
                  {column.map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <span aria-hidden className="size-[5px] shrink-0 rounded-full bg-foreground" />
                      <p className="whitespace-nowrap text-sm text-foreground">{point}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Incidents by category" className="flex flex-col lg:w-[593px] lg:shrink-0">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start">
              {chunk(categories, 2).map((column, columnIndex) => (
                <div key={columnIndex} className="flex shrink-0 flex-col gap-4">
                  {column.map(({ category, count }) => {
                    const Icon = CATEGORY_ICON[category]
                    return (
                      <div key={category} className="flex items-center gap-2">
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <p className="whitespace-nowrap text-sm text-foreground">
                          <span className="font-semibold">{count}</span> <span>{category}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </Card>
    </Link>
  )
}
