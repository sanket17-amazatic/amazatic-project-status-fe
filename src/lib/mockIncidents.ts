/**
 * Project Health % / Resolved Incidents — still mock (see mockProjectHealth
 * below). Everything else that used to live in this file (per-project stats,
 * the org-wide incident feed) is now real data from /api/insights/ and
 * /api/projects/'s severity/evidence/last_synced fields (quick-user asked to
 * "map the API" — SlackMessageInsight was already a live pipeline, just
 * admin-only until then). Resolved/health has no backing model yet — there's
 * no acknowledge/resolve workflow (that's Phase 6), so it stays a
 * deterministic placeholder for now.
 */

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

export interface MockProjectHealth {
  healthPercent: number
  resolvedIncidents: number
}

/** Project-detail health summary — still a placeholder, no resolve/acknowledge model exists yet (Phase 6). */
export function mockProjectHealth(projectId: number): MockProjectHealth {
  const rand = mockRandom(projectId * 40503 + 7)
  return {
    healthPercent: 40 + Math.floor(rand() * 55),
    resolvedIncidents: Math.floor(rand() * 6),
  }
}
