import { useAuthStore } from '@/stores/authStore'
import type { Project } from './useProjects'

/**
 * Single source of truth for "management or this project's own PM" —
 * previously re-derived identically in IntegrationsTab (canManage),
 * ProjectSettingsPage (editable), and TeamTab (canManageTeam), with no
 * compiler/lint signal if the PM-eligibility rule ever changed in only some
 * of those places (PR #12 review).
 *
 * `project` is optional so callers can call this unconditionally before an
 * async `project` finishes loading (React's rules of hooks forbid calling a
 * hook only after a conditional early return) — `canManage` is just `false`
 * until then.
 */
export function useCanManageProject(project: Pick<Project, 'project_manager'> | undefined) {
  const role = useAuthStore((state) => state.user?.role)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isManagement = role === 'management'
  const canManage = isManagement || (project != null && project.project_manager === currentUserId)
  return { isManagement, canManage }
}
