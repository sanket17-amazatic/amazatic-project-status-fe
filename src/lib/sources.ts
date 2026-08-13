export type MessageSource = 'slack' | 'teams'
export type IncidentSource = MessageSource | 'jira'

interface SourceMeta {
  label: string
  icon: string
}

/**
 * Single source of truth for source icon/label, used by Incidents,
 * Today's Summary, and the Evidence Drawer — previously duplicated three
 * times and already drifted (a two-branch ternary silently defaulted any
 * non-"teams" origin to "Slack" instead of failing loudly on an unmapped
 * source). Add a new platform here once and every consumer picks it up.
 */
export const SOURCE_META: Record<IncidentSource, SourceMeta> = {
  slack: { label: 'Slack', icon: '/icons/source-slack.svg' },
  teams: { label: 'Microsoft Teams', icon: '/icons/source-teams.svg' },
  jira: { label: 'Jira', icon: '/icons/source-jira.svg' },
}

export const SOURCE_ORDER: IncidentSource[] = ['slack', 'teams', 'jira']
