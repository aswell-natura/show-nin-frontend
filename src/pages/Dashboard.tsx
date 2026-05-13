import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayoutConfig, type WidgetType, type LayoutConfig } from '../context/LayoutConfigContext'
import AppLayout from '../components/layout/AppLayout'
import SummaryCards from '../components/dashboard/SummaryCards'
import PlayerTimeline from '../components/dashboard/widgets/PlayerTimeline'
import PlayerNextActions from '../components/dashboard/widgets/PlayerNextActions'
import ManagerTeamPipeline from '../components/dashboard/widgets/ManagerTeamPipeline'
import ManagerAtRisk from '../components/dashboard/widgets/ManagerAtRisk'
import ManagerTeamActivity from '../components/dashboard/widgets/ManagerTeamActivity'
import TaskOverview from '../components/dashboard/widgets/TaskOverview'
import ProjectOverview from '../components/dashboard/widgets/ProjectOverview'
import CustomerOverview from '../components/dashboard/widgets/CustomerOverview'
import PlayerBudgetOverview from '../components/dashboard/widgets/PlayerBudgetOverview'
import {
  BudgetSummaryWidget,
  MemberSummaryWidget,
  ReportSummaryWidget,
  ReviewSummaryWidget,
  RiskSummaryWidget,
} from '../components/dashboard/widgets/ManagerMenuOverviews'
import CalendarWidget from '../components/dashboard/widgets/CalendarWidget'
import type { ActiveMode } from '../types'

const tabLabel: Record<WidgetType, string> = {
  'timeline':      '活動',
  'next-actions':  'Next',
  'customers':     '顧客',
  'projects':      '案件',
  'tasks':         'タスク',
  'my-budget':     '予算',
  'members':       'メンバー',
  'budget':        '予算',
  'reviews':       'レビュー',
  'risks':         'リスク',
  'reports':       'レポート',
  'team-pipeline': 'パイプライン',
  'at-risk':       '要チェック',
  'team-activity': 'メンバー',
  'calendar':      'スケジュール',
  'empty':         '---',
}

// ─── ウィジェット描画 ───────────────────────────────────────────────────────

function WidgetPanel({ widget }: { widget: WidgetType }) {
  switch (widget) {
    case 'timeline':       return <PlayerTimeline />
    case 'next-actions':   return <PlayerNextActions />
    case 'customers':      return <CustomerOverview />
    case 'projects':       return <ProjectOverview />
    case 'tasks':          return <TaskOverview />
    case 'my-budget':      return <PlayerBudgetOverview />
    case 'members':        return <MemberSummaryWidget />
    case 'budget':         return <BudgetSummaryWidget />
    case 'reviews':        return <ReviewSummaryWidget />
    case 'risks':          return <RiskSummaryWidget />
    case 'reports':        return <ReportSummaryWidget />
    case 'team-pipeline':  return <ManagerTeamPipeline />
    case 'at-risk':        return <ManagerAtRisk />
    case 'team-activity':  return <ManagerTeamActivity />
    case 'calendar':       return <CalendarWidget />
    default:               return <div className="h-full bg-gray-50" />
  }
}

// ─── レイアウトエンジン ─────────────────────────────────────────────────────

function DashboardContent({ config }: { config: LayoutConfig }) {
  const { columns, twoColRatio, fourPanelRatio, panels } = config
  const [mobileTab, setMobileTab] = useState(0)

  const [lf2, rf2] =
    twoColRatio === '2:1' ? [2, 1] :
    twoColRatio === '1:2' ? [1, 2] : [1, 1]

  const [lf4, rf4] =
    fourPanelRatio === '1:2' ? [1, 2] :
    fourPanelRatio === '2:1' ? [2, 1] : [1, 1]

  const w = (i: number) => panels[i] ?? 'empty'

  if (columns === 1) {
    return (
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto md:overflow-hidden">
        <WidgetPanel widget={w(0)} />
      </div>
    )
  }

  if (columns === 2) {
    return (
      <div className="flex flex-col md:flex-row flex-1 min-h-0 min-w-0 overflow-y-auto md:overflow-hidden">
        <div style={{ flex: lf2 }} className="min-w-0 md:overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 min-h-48 md:min-h-0">
          <WidgetPanel widget={w(0)} />
        </div>
        <div style={{ flex: rf2 }} className="min-w-0 md:overflow-y-auto min-h-48 md:min-h-0">
          <WidgetPanel widget={w(1)} />
        </div>
      </div>
    )
  }

  if (columns === 3) {
    return (
      <div className="flex flex-col md:flex-row flex-1 min-h-0 min-w-0 overflow-y-auto md:overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ flex: 1 }}
            className={`min-w-0 md:overflow-y-auto min-h-48 md:min-h-0 ${i < 2 ? 'border-b md:border-b-0 md:border-r border-gray-200' : ''}`}
          >
            <WidgetPanel widget={w(i)} />
          </div>
        ))}
      </div>
    )
  }

  // 4分割（モバイル：タブ切り替え / デスクトップ：2×2グリッド）
  return (
    <>
      {/* モバイル：タブ + 1パネル表示 */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-white shrink-0">
          {([0, 1, 2, 3] as const).map((i) => (
            <button
              key={i}
              onClick={() => setMobileTab(i)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors truncate px-1 ${
                mobileTab === i
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tabLabel[w(i)]}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <WidgetPanel widget={w(mobileTab)} />
        </div>
      </div>

      {/* デスクトップ：2×2グリッド */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="flex flex-row flex-1 min-h-0 min-w-0 overflow-hidden border-b border-gray-200">
          <div style={{ flex: lf4 }} className="min-w-0 overflow-y-auto border-r border-gray-200">
            <WidgetPanel widget={w(0)} />
          </div>
          <div style={{ flex: rf4 }} className="min-w-0 overflow-y-auto">
            <WidgetPanel widget={w(1)} />
          </div>
        </div>
        <div className="flex flex-row flex-1 min-h-0 min-w-0 overflow-hidden">
          <div style={{ flex: lf4 }} className="min-w-0 overflow-y-auto border-r border-gray-200">
            <WidgetPanel widget={w(2)} />
          </div>
          <div style={{ flex: rf4 }} className="min-w-0 overflow-y-auto">
            <WidgetPanel widget={w(3)} />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Player / Manager ─────────────────────────────────────────────────────

function PlayerDashboard() {
  const { playerConfig } = useLayoutConfig()
  const [cardOrder, setCardOrder] = useState([1, 2, 3, 4, 5])

  return (
    <div className="h-full min-h-0 flex flex-col">
      <SummaryCards mode="player" cardOrder={cardOrder} onOrderChange={setCardOrder} />
      <DashboardContent config={playerConfig} />
    </div>
  )
}

function ManagerDashboard() {
  const { managerConfig } = useLayoutConfig()
  const [cardOrder, setCardOrder] = useState([6, 7, 8, 9, 10])

  return (
    <div className="h-full min-h-0 flex flex-col">
      <SummaryCards mode="manager" cardOrder={cardOrder} onOrderChange={setCardOrder} />
      <DashboardContent config={managerConfig} />
    </div>
  )
}

// ─── ルーター ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser, activeMode } = useAuth()
  const navigate = useNavigate()

  if (!currentUser) {
    navigate('/login')
    return null
  }

  const effectiveMode: ActiveMode =
    currentUser.role === 'manager' ? 'manager' :
    currentUser.role === 'dual' ? activeMode : 'player'

  return (
    <AppLayout>
      {effectiveMode === 'manager' ? <ManagerDashboard /> : <PlayerDashboard />}
    </AppLayout>
  )
}
