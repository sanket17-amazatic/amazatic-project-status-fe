const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** UI-SPEC: end_date -> "MMM D, YYYY"; null -> the muted "No deadline" string. */
export function formatDeadline(endDate: string | null): string {
  if (!endDate) return 'No deadline'
  const [year, month, day] = endDate.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}
