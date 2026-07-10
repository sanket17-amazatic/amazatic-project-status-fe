import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '@/auth/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/login/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import IncidentsPage from '@/pages/incidents/IncidentsPage'
import ProjectsListPage from '@/pages/projects/ProjectsListPage'
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage'
import ProjectCreatePage from '@/pages/projects/ProjectCreatePage'
import UsersPage from '@/pages/users/UsersPage'

/**
 * Single owner of the route table (D-14/D-16). Downstream plans (02-05,
 * 02-06, 02-07) only replace the stub page files referenced here — they
 * must not edit this file.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/new" element={<ProjectCreatePage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
