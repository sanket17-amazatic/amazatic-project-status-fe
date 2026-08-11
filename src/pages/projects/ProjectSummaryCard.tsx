import { Link } from 'react-router-dom'
import { RefreshCw, Settings } from 'lucide-react'
import { SeverityBadge } from '@/components/SeverityBadge'
import { cn } from '@/lib/utils'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import type { Project } from '@/hooks/useProjects'
import type { ProjectIntegration } from '@/hooks/useIntegrations'

interface ProjectSummaryCardProps {
  project: Project
  integrations: ProjectIntegration[]
  onRefresh: () => void
}

/**
 * Header for the Project Detail page — name/severity, last-sync+refresh, a
 * source-icon pill (real slackConnected/jiraConnected signal, dimmed when
 * not connected), and a settings link. Project Health%/team/integration
 * detail all moved to the dedicated Settings page or TodaysSummary's KPI
 * cards; nothing here is fabricated.
 */
export function ProjectSummaryCard({ project, integrations, onRefresh }: ProjectSummaryCardProps) {
  const severity = mapAiPriorityToSeverity(project.severity)
  const lastSynced = formatIncidentTimestamp(project.last_synced)

  const jira = integrations.find((integration) => integration.type === 'jira')
  const slack = integrations.find((integration) => integration.type === 'slack_own')
  const jiraConnected = Boolean(jira?.enabled && jira.health_status === 'healthy')
  const slackConnected = Boolean(slack?.enabled && slack.health_status === 'healthy')

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
            <SeverityBadge severity={severity} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              Last sync: {lastSynced}
              <button
                type="button"
                aria-label="Refresh"
                onClick={onRefresh}
                className="flex size-6 items-center justify-center rounded-md hover:bg-slate-100"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-2">
              <img
                src="/icons/source-slack.svg"
                alt={slackConnected ? 'Slack connected' : 'Slack not connected'}
                title={slackConnected ? 'Slack connected' : 'Slack not connected'}
                className={cn('size-4', !slackConnected && 'opacity-30 grayscale')}
              />
              <img
                src="/icons/source-jira.svg"
                alt={jiraConnected ? 'Jira connected' : 'Jira not connected'}
                title={jiraConnected ? 'Jira connected' : 'Jira not connected'}
                className={cn('size-4', !jiraConnected && 'opacity-30 grayscale')}
              />
            </div>
            <Link
              to={`/projects/${project.id}/settings`}
              aria-label="Project settings"
              className="text-slate-500 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Settings className="size-[18px]" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {project.description || 'No description provided.'}
        </p>
      </div>
    </div>
  )
}
