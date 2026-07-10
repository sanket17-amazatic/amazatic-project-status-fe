import { useState } from 'react'
import { CheckCircle2, XCircle, RefreshCw, ChevronDown, MessageSquare, Kanban } from 'lucide-react'
import { SeverityBadge } from '@/components/SeverityBadge'
import { cn } from '@/lib/utils'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import { mockProjectHealth } from '@/lib/mockIncidents'
import type { Project } from '@/hooks/useProjects'
import type { ProjectIntegration } from '@/hooks/useIntegrations'
import type { Membership } from '@/hooks/useMemberships'

interface ProjectSummaryCardProps {
  project: Project
  integrations: ProjectIntegration[]
  members: Membership[]
  onRefresh: () => void
}

/**
 * Figma nodes for the Project Details page (collapsed + "View more" expanded
 * states). Severity/Open/Critical Incidents/Evidence/Last Synced are real,
 * derived server-side from SlackMessageInsight (ProjectSerializer) — own-Slack
 * monitoring + AI classification are already live. Project Health % and
 * Resolved Incidents stay mock: there's no acknowledge/resolve workflow yet
 * (that's Phase 6). Slack channel names are intentionally NOT fabricated:
 * D-07 means no project has real channels yet (auto-discovered once the app
 * installs, Phase 4/7), so this shows the same honest "not connected yet"
 * state as IntegrationsTab rather than inventing channel names attached to a
 * real project.
 */
export function ProjectSummaryCard({
  project,
  integrations,
  members,
  onRefresh,
}: ProjectSummaryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const severity = mapAiPriorityToSeverity(project.severity)
  const lastSynced = formatIncidentTimestamp(project.last_synced)
  const health = mockProjectHealth(project.id)

  const jira = integrations.find((integration) => integration.type === 'jira')
  const slack = integrations.find((integration) => integration.type === 'slack_own')
  const jiraConnected = Boolean(jira?.enabled && jira.health_status === 'healthy')
  const slackConnected = Boolean(slack?.enabled && slack.health_status === 'healthy')
  const jiraProjectKey =
    typeof jira?.config?.jira_project_key === 'string' ? jira.config.jira_project_key : null

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
            <SeverityBadge severity={severity} />
          </div>
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
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {project.description || 'No description provided.'}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-md bg-green-50 px-4 py-3 text-sm">
          <span>
            <span className="text-slate-500">Project Manager: </span>
            {project.project_manager_name}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="size-4 text-violet-600" aria-hidden="true" />
            Slack
            {slackConnected ? (
              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle className="size-4 text-slate-400" aria-hidden="true" />
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Kanban className="size-4 text-blue-600" aria-hidden="true" />
            Jira
            {jiraConnected ? (
              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle className="size-4 text-slate-400" aria-hidden="true" />
            )}
          </span>
          <span>
            <span className="text-slate-500">Team Members: </span>
            {members.length}
          </span>
          <span>
            <span className="text-slate-500">Last Updated: </span>
            {lastSynced}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="ml-auto flex items-center gap-1 text-slate-600 hover:text-foreground"
          >
            {expanded ? 'View less' : 'View more'}
            <ChevronDown
              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-6 rounded-md bg-green-50 px-4 py-3 text-sm">
              <span>
                <span className="text-slate-500">Project Health: </span>
                <span className="text-base font-semibold text-foreground">{health.healthPercent}%</span>
              </span>
              <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
              <span>
                <span className="text-slate-500">Open Incidents: </span>
                <span className="text-base font-semibold text-foreground">{project.open_incidents}</span>
              </span>
              <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
              <span>
                <span className="text-slate-500">Critical Incidents: </span>
                <span className="text-base font-semibold text-foreground">{project.critical_incidents}</span>
              </span>
              <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
              <span>
                <span className="text-slate-500">Resolved Incidents: </span>
                <span className="text-base font-semibold text-foreground">{health.resolvedIncidents}</span>
              </span>
              <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
              <span>
                <span className="text-slate-500">Evidences: </span>
                <span className="text-base font-semibold text-foreground">{project.evidence_count}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-md bg-green-50 p-4">
              <div className="pr-4">
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <MessageSquare className="size-4 text-violet-600" aria-hidden="true" />
                    Slack Channels
                  </span>
                  <span className="text-sm text-slate-500">0</span>
                </div>
                <p className="text-sm text-slate-500">
                  {slackConnected
                    ? 'No channels yet — channels are auto-discovered once the app is installed.'
                    : 'Slack not connected for this project yet.'}
                </p>
              </div>

              <div className="px-4">
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Kanban className="size-4 text-blue-600" aria-hidden="true" />
                    Jira Projects
                  </span>
                  <span className="text-sm text-slate-500">{jiraProjectKey ? 1 : 0}</span>
                </div>
                {jiraProjectKey ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">{jiraProjectKey}</p>
                    <p className="text-sm text-slate-500">Software project</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Not configured yet.</p>
                )}
              </div>

              <div className="pl-4">
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-sm font-medium text-foreground">Team Members</span>
                  <span className="text-sm text-slate-500">{members.length}</span>
                </div>
                <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between">
                      <span className="text-foreground">{member.user_name || member.user_email}</span>
                      {member.user_name && (
                        <span className="text-slate-500">{member.user_email}</span>
                      )}
                    </li>
                  ))}
                  {members.length === 0 && <li className="text-slate-500">No members yet.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
