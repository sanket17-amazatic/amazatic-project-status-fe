/**
 * Per-project source breakdown / action points / incidents-by-category —
 * no backing model exists yet (see mockProjectHealth in mockIncidents.ts for
 * the same caveat on health%/resolved-incidents). Deterministic so values
 * stay stable across reloads and don't require a fetch.
 */

// mulberry32 — small deterministic PRNG seeded by project id (same pattern as mockIncidents.ts).
function mockRandom(seed: number): () => number {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export type MockSourceKey = 'slack' | 'jira' | 'email' | 'teams' | 'calls'

export interface MockSourceCounts {
  critical: number
  medium: number
  low: number
}

const SOURCE_KEYS: MockSourceKey[] = ['slack', 'jira', 'email', 'teams', 'calls']

export function mockSourceBreakdown(projectId: number): Record<MockSourceKey, MockSourceCounts> {
  const rand = mockRandom(projectId * 92821 + 13)
  const result = {} as Record<MockSourceKey, MockSourceCounts>
  for (const key of SOURCE_KEYS) {
    result[key] = {
      critical: Math.floor(rand() * 3),
      medium: Math.floor(rand() * 2),
      low: Math.floor(rand() * 2),
    }
  }
  return result
}

const ACTION_POINT_POOL = [
  'Review critical delivery risks.',
  'Resolve cross-team blockers.',
  'Approve pending project decisions.',
  'Optimize resource allocation.',
  'Validate release readiness.',
  'Monitor project risk trends.',
  'Review AI insight accuracy.',
  'Validate data synchronization.',
  'Track platform reliability metrics.',
] as const

export function mockActionPoints(projectId: number): string[] {
  const rand = mockRandom(projectId * 50331 + 29)
  return [...ACTION_POINT_POOL].sort(() => rand() - 0.5).slice(0, 6)
}

export type MockIncidentCategory =
  | 'Communication'
  | 'Delivery Delays'
  | 'Cross team dependency'
  | 'Technical Debt'
  | 'Scope Change'
  | 'Sprint Spillover'
  | 'Blockers'

export interface MockCategoryCount {
  category: MockIncidentCategory
  count: number
}

const CATEGORY_POOL: MockIncidentCategory[] = [
  'Communication',
  'Delivery Delays',
  'Cross team dependency',
  'Technical Debt',
  'Scope Change',
  'Sprint Spillover',
  'Blockers',
]

export function mockIncidentCategories(projectId: number): MockCategoryCount[] {
  const rand = mockRandom(projectId * 17959 + 41)
  return CATEGORY_POOL.map((category) => ({
    category,
    count: Math.floor(rand() * 4),
  }))
}
