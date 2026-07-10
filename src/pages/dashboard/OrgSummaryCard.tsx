import { Sparkles } from 'lucide-react'

interface OrgSummaryCardProps {
  /** AI-analyzed project count — from /api/insights/stats/, not the raw project total. */
  analyzedProjectCount: number
  openIncidents: number
  criticalIncidents: number
  /** Still mock — no acknowledge/resolve workflow exists yet (Phase 6). */
  resolvedIncidents: number
  evidenceRecords: number
}

/**
 * Open/Critical Incidents + Evidence Records are real (/api/insights/stats/,
 * derived from SlackMessageInsight). Resolved Incidents stays mock — see
 * ProjectSummaryCard for the same caveat on the per-project card.
 */
export function OrgSummaryCard({
  analyzedProjectCount,
  openIncidents,
  criticalIncidents,
  resolvedIncidents,
  evidenceRecords,
}: OrgSummaryCardProps) {
  return (
    <div
      className="relative flex-1 overflow-hidden rounded-lg p-6 text-white"
      style={{ background: 'linear-gradient(135deg, #0b1e3a 0%, #142437 100%)' }}
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/70">
        <Sparkles className="size-3.5" aria-hidden="true" />
        ORGANIZATION SUMMARY
      </div>
      <p className="text-2xl font-semibold">AI analyzed {analyzedProjectCount} projects</p>
      <p className="mt-1 text-sm text-white/60">Scan completed recently across all connected workspaces</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-bold">{openIncidents}</p>
          <p className="text-xs text-white/60">Open Incidents</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{criticalIncidents}</p>
          <p className="text-xs text-white/60">Critical Incidents</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{resolvedIncidents}</p>
          <p className="text-xs text-white/60">Resolved Incidents</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{evidenceRecords}</p>
          <p className="text-xs text-white/60">Evidence Records</p>
        </div>
      </div>
    </div>
  )
}
