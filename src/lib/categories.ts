/**
 * Single source of truth for the AI service's real closed category
 * vocabulary (amazatic-project-status-ai app/schemas.py CATEGORY_DEFINITIONS:
 * communication, cross_team_dependency, sprint_spillover, delivery_delay,
 * technical_debate, blocker) — mirrors `lib/sources.ts`'s reasoning for
 * source icon/label (previously duplicated and drifted across components).
 */
export type IncidentCategoryKey =
  | 'communication'
  | 'delivery_delay'
  | 'cross_team_dependency'
  | 'technical_debate'
  | 'sprint_spillover'
  | 'blocker'

interface CategoryMeta {
  label: string
  icon: string
}

export const CATEGORY_META: Record<IncidentCategoryKey, CategoryMeta> = {
  communication: { label: 'Communication', icon: '/icons/category-communication.svg' },
  delivery_delay: { label: 'Delivery Delays', icon: '/icons/category-delivery-delays.svg' },
  cross_team_dependency: {
    label: 'Cross team dependency', icon: '/icons/category-cross-team.svg',
  },
  technical_debate: { label: 'Technical Debt', icon: '/icons/category-technical-debt.svg' },
  sprint_spillover: { label: 'Sprint Spillover', icon: '/icons/category-sprint-spillover.svg' },
  blocker: { label: 'Blockers', icon: '/icons/category-blockers.svg' },
}

// Fixed display order — every category shows even at 0 occurrences, same
// "always-6-rows" grid the dashboard design expects.
export const CATEGORY_ORDER: IncidentCategoryKey[] = [
  'communication', 'delivery_delay', 'cross_team_dependency',
  'technical_debate', 'sprint_spillover', 'blocker',
]
