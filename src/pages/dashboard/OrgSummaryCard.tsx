import { Sparkles } from 'lucide-react'

interface OrgSummaryCardProps {
  projectCount: number
}

/**
 * Placeholder stats (open/critical/resolved incidents, evidence records) —
 * pending a real Incidents API (see quick-260710-dsh). Only projectCount is
 * real, from useProjects.
 */
export function OrgSummaryCard({ projectCount }: OrgSummaryCardProps) {
  return (
    <div
      className="relative flex-1 overflow-hidden rounded-lg p-6 text-white"
      style={{ background: 'linear-gradient(135deg, #0b1e3a 0%, #142437 100%)' }}
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/70">
        <Sparkles className="size-3.5" aria-hidden="true" />
        ORGANIZATION SUMMARY
      </div>
      <p className="text-2xl font-semibold">AI analyzed {projectCount} projects</p>
      <p className="mt-1 text-sm text-white/60">Scan completed recently across all connected workspaces</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-bold">65</p>
          <p className="text-xs text-white/60">Open Incidents</p>
        </div>
        <div>
          <p className="text-2xl font-bold">24</p>
          <p className="text-xs text-white/60">Critical Incidents</p>
        </div>
        <div>
          <p className="text-2xl font-bold">18</p>
          <p className="text-xs text-white/60">Resolved Incidents</p>
        </div>
        <div>
          <p className="text-2xl font-bold">84</p>
          <p className="text-xs text-white/60">Evidence Records</p>
        </div>
      </div>
    </div>
  )
}
