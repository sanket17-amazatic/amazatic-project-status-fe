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

/** Users page "Last Active" column — real last_login, relative to now. */
export function formatRelativeTime(isoDateTime: string | null): string {
  if (!isoDateTime) return 'Never'
  const diffMs = Date.now() - new Date(isoDateTime).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}
