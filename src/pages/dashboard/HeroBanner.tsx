import { Sparkles } from 'lucide-react'

interface HeroBannerProps {
  totalProjects: number
  criticalProjectCount: number
  mediumRiskCount: number
  totalIncidents: number
}

/**
 * Executive-briefing banner — all four numbers are real (derived from
 * useProjects severity + useIncidentStats in DashboardPage). The narrative
 * sentence itself stays generic rather than naming a specific project, since
 * there's no real "why this project" signal behind that framing yet.
 */
export function HeroBanner({
  totalProjects,
  criticalProjectCount,
  mediumRiskCount,
  totalIncidents,
}: HeroBannerProps) {
  return (
    <div
      className="relative flex w-full flex-col gap-4 overflow-hidden rounded-lg p-6 text-white"
      style={{ background: 'linear-gradient(135deg, #0b1e3a 0%, #142437 100%)' }}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-[19px] shrink-0 items-center justify-center rounded-sm bg-white/20">
          <Sparkles className="size-3" aria-hidden="true" />
        </div>
        <p className="text-[13px] font-semibold uppercase tracking-wide">Here's your executive briefing</p>
      </div>

      <div className="flex w-full flex-col items-start gap-4 lg:flex-row lg:items-center">
        <p className="text-sm font-medium leading-[18.75px] text-white/90 lg:flex-1">
          {`Across your `}
          <span className="font-bold">{totalProjects}</span>
          {` project${totalProjects === 1 ? '' : 's'}, `}
          <span className="font-bold">{totalIncidents}</span>
          {' open incidents are being tracked. Review the critical and at-risk projects below for details.'}
        </p>

        <div className="flex w-full items-center rounded-xs bg-white/5 py-3 pl-4 pr-3 lg:w-[378px]">
          <div className="flex flex-wrap items-center gap-x-[26px] gap-y-3">
            <div className="flex w-24 flex-col">
              <p className="text-2xl font-semibold leading-[30px]">{totalProjects}</p>
              <p className="text-sm font-semibold leading-[15px] text-white/80">Total Projects</p>
            </div>
            <div className="flex w-[106px] flex-col">
              <p className="text-2xl font-semibold leading-[30px] text-red-400">{criticalProjectCount}</p>
              <p className="text-sm font-semibold leading-[15px] text-white/80">Critical Project</p>
            </div>
            <div className="flex w-[89px] flex-col">
              <p className="text-2xl font-semibold leading-[30px] text-amber-400">{mediumRiskCount}</p>
              <p className="text-sm font-semibold leading-[15px] text-white/80">Medium Risk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
