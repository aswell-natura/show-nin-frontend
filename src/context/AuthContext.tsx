/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Profile, ActiveMode } from '../types'

interface AuthContextValue {
  currentUser: Profile | null
  activeMode: ActiveMode
  login: (profile: Profile) => void
  logout: () => void
  setActiveMode: (mode: ActiveMode) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [activeMode, setActiveModeState] = useState<ActiveMode>('player')

  function login(profile: Profile) {
    setCurrentUser(profile)
    setActiveModeState(profile.role === 'manager' ? 'manager' : 'player')
  }

  function logout() {
    setCurrentUser(null)
    setActiveModeState('player')
  }

  function setActiveMode(mode: ActiveMode) {
    setActiveModeState(mode)
  }

  return (
    <AuthContext.Provider value={{ currentUser, activeMode, login, logout, setActiveMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
