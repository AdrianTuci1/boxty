import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import WorkspacesPage from './pages/WorkspacesPage'
import WorkspaceDetailPage from './pages/WorkspaceDetailPage'
import AppDetailPage from './pages/AppDetailPage'
import SandboxDetailPage from './pages/SandboxDetailPage'
import BillingPage from './pages/BillingPage'
import SecretsPage from './pages/SecretsPage'
import ImagesPage from './pages/ImagesPage'
import SchedulesPage from './pages/SchedulesPage'
import VolumesPage from './pages/VolumesPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, devMode } = useAuth()
  return (isAuthenticated || devMode) ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
        <Route path="/apps/:id" element={<AppDetailPage />} />
        <Route path="/sandboxes/:id" element={<SandboxDetailPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/secrets" element={<SecretsPage />} />
        <Route path="/images" element={<ImagesPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/volumes" element={<VolumesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
