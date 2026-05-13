import { useState, type ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import LayoutSettingsPanel from './LayoutSettingsPanel'

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header onMenuToggle={() => setIsMobileMenuOpen((v) => !v)} />
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
      <LayoutSettingsPanel />
    </div>
  )
}
