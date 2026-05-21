import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataStoreProvider } from './context/DataStoreContext'
import { GlobalDialogProvider } from './context/GlobalDialogContext'
import { LayoutConfigProvider } from './context/LayoutConfigContext'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import CustomerDetail from './pages/customers/[id]'
import CustomerList from './pages/customers'
import ReportView from './pages/reports/[id]'
import RecordingWindow from './pages/recording'
import TaskBoard from './pages/tasks'
import TaskDetail from './pages/tasks/[id]'
import ProjectList from './pages/projects'
import ProjectDetail from './pages/projects/[id]'
import ManagerMembers from './pages/members'
import BudgetPlanning from './pages/budget'
import PlayerBudget from './pages/my-budget'
import ManagerReviews from './pages/reviews'
import ManagerRisks from './pages/risks'
import AudioMinuteList from './pages/minutes'
import AudioMinuteDetail from './pages/minutes/[id]'
import MinuteDocumentEdit from './pages/minutes/document-edit'
import NotificationsPage from './pages/notifications'
import SettingsPage from './pages/settings'
import DesignShowcase from './pages/design'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><ManagerMembers /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><BudgetPlanning /></ProtectedRoute>} />
      <Route path="/my-budget" element={<ProtectedRoute><PlayerBudget /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><ManagerReviews /></ProtectedRoute>} />
      <Route path="/risks" element={<ProtectedRoute><ManagerRisks /></ProtectedRoute>} />
      <Route path="/reports/:id" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
      <Route path="/recording" element={<RecordingWindow />} />
      <Route path="/minutes" element={<ProtectedRoute><AudioMinuteList /></ProtectedRoute>} />
      <Route path="/minutes/:id" element={<AudioMinuteDetail />} />
      <Route path="/minutes/:id/documents/:documentId/edit" element={<ProtectedRoute><MinuteDocumentEdit /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/settings/:section" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/design" element={<DesignShowcase />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataStoreProvider>
          <LayoutConfigProvider>
            <GlobalDialogProvider>
              <AppRoutes />
            </GlobalDialogProvider>
          </LayoutConfigProvider>
        </DataStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
