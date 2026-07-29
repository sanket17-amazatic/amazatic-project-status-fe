import type { MockIncidentCategory } from '@/lib/mockProjectBreakdown'

/** White-icon-on-brand-circle variants, used only here (Dashboard's ProjectSummaryCard has its own plain-icon local map). */
const CATEGORY_ICON_ON_BRAND: Record<MockIncidentCategory, string> = {
  Communication: '/icons/category-communication-on-brand.svg',
  'Delivery Delays': '/icons/category-delivery-delays-on-brand.svg',
  'Cross team dependency': '/icons/category-cross-team-on-brand.svg',
  'Technical Debt': '/icons/category-technical-debt-on-brand.svg',
  'Scope Change': '/icons/category-technical-debt-on-brand.svg',
  'Sprint Spillover': '/icons/category-sprint-spillover-on-brand.svg',
  Blockers: '/icons/category-blockers-on-brand.svg',
}

interface CategoryChipProps {
  category: MockIncidentCategory
  count: number
}

export function CategoryChip({ category, count }: CategoryChipProps) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap rounded-md bg-muted p-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#38C776] p-1">
        <img src={CATEGORY_ICON_ON_BRAND[category]} alt="" className="size-3.5" aria-hidden="true" />
      </span>
      <p className="text-foreground">
        <span className="text-base font-semibold">{count}</span>{' '}
        <span className="text-[13px] font-medium">{category}</span>
      </p>
    </div>
  )
}
