import { Card } from '@/components/ui/card'

/** Mirrors HeroBanner's shape exactly so layout doesn't shift on load. */
export function HeroBannerSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-4 overflow-hidden rounded-lg p-6"
      style={{ background: 'linear-gradient(135deg, #0b1e3a 0%, #142437 100%)' }}
    >
      <div className="h-3.5 w-56 animate-pulse rounded bg-white/15" />
      <div className="flex w-full flex-col items-start gap-4 lg:flex-row lg:items-center">
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-white/10 lg:flex-1" />
        <div className="flex w-full items-center gap-6 rounded-xs bg-white/5 py-3 pl-4 pr-3 lg:w-[378px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-7 w-10 animate-pulse rounded bg-white/15" />
              <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Mirrors ProjectSummaryCard's shape so a few pulsing cards hold the layout while projects load. */
export function ProjectCardsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="gap-[17px] px-4">
          <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-start gap-[7px] lg:w-[331px]">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:flex-nowrap">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-14 min-w-[130px] flex-1 animate-pulse rounded-sm bg-muted lg:flex-none lg:w-[140px]" />
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 lg:flex-row">
            <div className="h-24 w-full animate-pulse rounded-sm bg-muted lg:w-[506px] lg:shrink-0" />
            <div className="h-24 w-full animate-pulse rounded-sm bg-muted lg:w-[593px] lg:shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  )
}
