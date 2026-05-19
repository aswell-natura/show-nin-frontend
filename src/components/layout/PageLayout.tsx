import { useState, type ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import LayoutSettingsPanel from './LayoutSettingsPanel'
import { RecordButton } from './RecordButton'

/**
 * PageLayout — for normal content pages (Dashboard, detail views, etc.)
 * The <main> area scrolls naturally, so pages don't need to manage their own scroll container.
 *
 * Use AppLayout instead for CRUD/table pages (CustomerList, ProjectList, TaskBoard, etc.)
 * that manage their own internal scroll containers.
 */
export default function PageLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header onMenuToggle={() => setIsMobileMenuOpen((v) => !v)} />
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto bg-background relative z-10 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.3)] custom-scrollbar">
          {children}
        </main>
      </div>
      <LayoutSettingsPanel />

      {/* モバイル用フローティング録音ボタン */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <RecordButton fab />
      </div>
    </div>
  )
}
