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
import CreateSecretPage from './pages/CreateSecretPage'
import ImagesPage from './pages/ImagesPage'
import SchedulesPage from './pages/SchedulesPage'
import StoragePage from './pages/StoragePage'
import VolumeDetailPage from './pages/VolumeDetailPage'
import StoppedApps from './components/StoppedApps'
import SettingsLayout from './pages/SettingsPage'
import ProfilePage from './pages/settings/ProfilePage'
import WorkspacesListPage from './pages/settings/WorkspacesListPage'
import EmailPage from './pages/settings/EmailPage'
import UsagePage from './pages/settings/UsagePage'
import APITokensPage from './pages/settings/APITokensPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, devMode } = useAuth()
  return (isAuthenticated || devMode) ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/apps/adrian-tucicovenco/main" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/apps/:workspace/:environment" element={<DashboardPage />} />
        <Route path="/apps/:workspace/:environment/:appId" element={<AppDetailPage />} />
        <Route path="/logs/:workspace/:environment" element={<StoppedApps />} />
        <Route path="/secrets/:workspace/:environment" element={<SecretsPage />} />
        <Route path="/secrets/:workspace/:environment/create" element={<CreateSecretPage />} />
        <Route path="/storage/:workspace/:environment" element={<StoragePage />} />
        <Route path="/storage/:workspace/:environment/:volumeName" element={<VolumeDetailPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
        <Route path="/sandboxes/:id" element={<SandboxDetailPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/images/:workspace/:environment" element={<ImagesPage />} />
        <Route path="/schedules/:workspace/:environment" element={<SchedulesPage />} />
        <Route path="*" element={<Navigate to="/apps/adrian-tucicovenco/main" replace />} />
      </Route>
      <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/settings/profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="workspaces" element={<WorkspacesListPage />} />
        <Route path="email" element={<EmailPage />} />
        <Route path="usage" element={<UsagePage />} />
        <Route path="api-tokens" element={<APITokensPage />} />
        <Route path="*" element={<Navigate to="/settings/profile" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/apps/adrian-tucicovenco/main" replace />} />
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
