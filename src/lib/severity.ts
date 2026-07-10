/** UI-facing severity bucket — used by SeverityBadge and every incident/project list filter. */
export type Severity = 'critical' | 'high' | 'medium' | 'low'

/** Real vocabulary from the AI service (amazatic-project-status-ai/app/schemas.py). */
export type AiPriority = 'low' | 'medium' | 'high' | 'urgent'

const PRIORITY_TO_SEVERITY: Record<AiPriority, Severity> = {
  urgent: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

/** `null`/`''` means no qualifying insight exists yet for that project — not an error. */
export function mapAiPriorityToSeverity(priority: AiPriority | '' | null): Severity | null {
  if (!priority) return null
  return PRIORITY_TO_SEVERITY[priority]
}

const SEVERITY_TO_PRIORITY: Record<Severity, AiPriority> = {
  critical: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

/** Reverse of the above — for sending a UI-selected severity filter as `?priority=`. */
export function mapSeverityToAiPriority(severity: Severity | ''): AiPriority | '' {
  return severity ? SEVERITY_TO_PRIORITY[severity] : ''
}
