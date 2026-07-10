import type { UserRole } from '@/stores/authStore'

/**
 * Figma's Users page uses Admin/Manager/Employee; the backend's global roles
 * (accounts/models.py User.Role) are management/pm/member. Mapping locked
 * with the user: Admin=management, Manager=pm, Employee=member.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  management: 'Admin',
  pm: 'Manager',
  member: 'Employee',
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'management', label: 'Admin' },
  { value: 'pm', label: 'Manager' },
  { value: 'member', label: 'Employee' },
]
