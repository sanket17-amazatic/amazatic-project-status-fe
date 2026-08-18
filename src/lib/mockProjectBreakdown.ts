/**
 * Projects list "Incidents" column Medium/Low split — no backing model
 * exists yet (see mockProjectHealth in mockIncidents.ts for the same
 * caveat on health%/resolved-incidents). Deterministic so values stay
 * stable across reloads and don't require a fetch.
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

/**
 * Splits a real remainder (open_incidents - critical_incidents) into a
 * Medium/Low pair for the Projects list's Incidents column — there's no
 * backend field for that split, but T=C+M+L must always hold, so this
 * mocks the ratio only, not the total.
 */
export function mockIncidentMediumLowSplit(
  projectId: number,
  remaining: number
): { medium: number; low: number } {
  const rand = mockRandom(projectId * 68111 + 53)
  const medium = Math.round(remaining * (0.3 + rand() * 0.4))
  return { medium, low: remaining - medium }
}
