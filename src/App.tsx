import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataStoreProvider } from './context/DataStoreContext'
import { LayoutConfigProvider } from './context/LayoutConfigContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerDetail from './pages/CustomerDetail'
import CustomerList from './pages/CustomerList'
import ReportView from './pages/ReportView'
import RecordingWindow from './pages/RecordingWindow'
import TaskBoard from './pages/TaskBoard'
import ProjectList from './pages/ProjectList'
import ManagerMembers from './pages/ManagerMembers'
import BudgetPlanning from './pages/BudgetPlanning'
import PlayerBudget from './pages/PlayerBudget'
import ManagerReviews from './pages/ManagerReviews'
import ManagerRisks from './pages/ManagerRisks'
import AudioMinuteList from './pages/AudioMinuteList'
import AudioMinuteDetail from './pages/AudioMinuteDetail'
import DesignShowcase from './pages/DesignShowcase'
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
      <Route path="/members" element={<ProtectedRoute><ManagerMembers /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><BudgetPlanning /></ProtectedRoute>} />
      <Route path="/my-budget" element={<ProtectedRoute><PlayerBudget /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><ManagerReviews /></ProtectedRoute>} />
      <Route path="/risks" element={<ProtectedRoute><ManagerRisks /></ProtectedRoute>} />
      <Route path="/reports/:id" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
      <Route path="/recording" element={<RecordingWindow />} />
      <Route path="/minutes" element={<ProtectedRoute><AudioMinuteList /></ProtectedRoute>} />
      <Route path="/minutes/:id" element={<AudioMinuteDetail />} />
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
            <AppRoutes />
          </LayoutConfigProvider>
        </DataStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
