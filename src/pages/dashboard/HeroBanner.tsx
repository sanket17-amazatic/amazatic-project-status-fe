import { formatDashboardDateLabel } from '@/lib/format'

interface HeroBannerProps {
  totalProjects: number
  criticalProjectCount: number
  mediumRiskCount: number
  description: string
  /** DashboardSummary.date — the period the dropdown-selected range covers. */
  date: string
}

/**
 * Executive-briefing banner — all values are real, from useDashboardSummary
 * (GET /api/dashboard-summary/) in DashboardPage. `description` is the
 * server's own date-windowed narrative (names specific projects by severity
 * bucket), rendered verbatim rather than reconstructed client-side.
 *
 * Background image crop (-6.68% top / 174.87% height) is the reference
 * design's exact Figma crop, not a natural object-fit:cover — reproduced
 * literally so it matches pixel-for-pixel rather than an approximation.
 */
export function HeroBanner({
  totalProjects,
  criticalProjectCount,
  mediumRiskCount,
  description,
  date,
}: HeroBannerProps) {
  return (
    <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-lg bg-[#0b1e3a] p-6 text-white">
      <img
        src="/images/dashboard-hero-bg.png"
        alt=""
        className="pointer-events-none absolute left-0 top-[-6.68%] h-[174.87%] w-full max-w-none object-fill"
      />

      <div className="relative z-10 flex items-center gap-2">
        <div className="flex size-[18.75px] shrink-0 items-center justify-center rounded-[3.75px] bg-white/20">
          <img src="/icons/hero-briefing.svg" alt="" className="size-[11.25px]" />
        </div>
        <p className="text-[13px] font-semibold uppercase tracking-wide">Here's your executive briefing</p>
        <span aria-hidden className="size-1 shrink-0 rounded-full bg-white/60" />
        <p className="text-[13px] font-medium text-white/80">{formatDashboardDateLabel(date)}</p>
      </div>

      <div className="relative z-10 flex w-full flex-col items-start gap-4 lg:flex-row lg:items-center">
        <p className="text-sm font-medium leading-[18.75px] text-white/90 lg:flex-1">{description}</p>

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
