/**
 * Placeholder incident stats, pending a real Incidents API (no Incident
 * model/serializer exists in the backend yet — see quick-260710-dsh).
 * Deterministic per project id so values stay stable across re-renders
 * and refetches instead of jumping around like Math.random() would.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low'

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
const LAST_SYNCED_SAMPLES = [
  'Today, 10:45 AM',
  'Yesterday, 12:45 PM',
  'Today, 9:15 AM',
  'Today, 9:30 AM',
  'Yesterday, 4:20 PM',
]

// mulberry32 — small deterministic PRNG seeded by project id.
function mockRandom(seed: number): () => number {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export interface MockIncidentStats {
  openIncidents: number
  criticalIncidents: number
  evidence: number
  severity: Severity
  lastSynced: string
}

export function mockIncidentStats(projectId: number): MockIncidentStats {
  const rand = mockRandom(projectId * 2654435761)
  const openIncidents = 1 + Math.floor(rand() * 9)
  const criticalIncidents = Math.floor(rand() * Math.min(openIncidents, 5))
  return {
    openIncidents,
    criticalIncidents,
    evidence: 1 + Math.floor(rand() * 20),
    severity: SEVERITIES[Math.floor(rand() * SEVERITIES.length)],
    lastSynced: LAST_SYNCED_SAMPLES[projectId % LAST_SYNCED_SAMPLES.length],
  }
}
