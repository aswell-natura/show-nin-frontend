import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { useDataStore } from '../../context/DataStoreContext'

function formatAmount(amount: number) {
  return `${(amount / 10000).toLocaleString()}万円`
}

export default function BudgetPlanning() {
  const { currentUser } = useAuth()
  const { profiles, projects, targets, addTarget, updateTarget } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)
  const teamProjects = projects.filter((project) => members.some((member) => member.id === project.user_id))
  const teamTarget = targets.find((target) =>
    target.type === 'team' && target.manager_id === currentUser?.id && target.target_month === '2026-05-01',
  )
  const closedAmount = teamProjects.filter((project) => project.status === 'closed').reduce((sum, project) => sum + project.amount, 0)
  const pipelineAmount = teamProjects.filter((project) => project.status !== 'closed').reduce((sum, project) => sum + project.amount, 0)
  const targetAmount = teamTarget?.amount ?? 0
  const projectedAmount = closedAmount + pipelineAmount
  const progress = targetAmount ? Math.round((closedAmount / targetAmount) * 100) : 0
  const projectedProgress = targetAmount ? Math.round((projectedAmount / targetAmount) * 100) : 0
  const gap = Math.max(0, targetAmount - projectedAmount)
  const allocatedAmount = members.reduce((sum, member) => {
    const target = targets.find((item) => item.type === 'individual' && item.user_id === member.id && item.target_month === '2026-05-01')
    return sum + (target?.amount ?? 0)
  }, 0)
  const allocationGap = targetAmount - allocatedAmount

  function handleAllocationChange(userId: string, value: string) {
    if (!currentUser) return
    const amount = Math.max(0, Math.round((Number(value) || 0) * 10000))
    const existing = targets.find((target) =>
      target.type === 'individual' && target.user_id === userId && target.target_month === '2026-05-01',
    )

    if (existing) {
      updateTarget(existing.id, { amount, manager_id: currentUser.id })
      return
    }

    addTarget({
      type: 'individual',
      user_id: userId,
      manager_id: currentUser.id,
      amount,
      target_month: '2026-05-01',
    })
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">予算編成</h1>
          <p className="mt-0.5 text-xs text-gray-400">チーム目標、メンバー配分、現在見込みとの差分を管理します</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ['チーム目標', formatAmount(targetAmount)],
              ['配分済み', formatAmount(allocatedAmount)],
              ['成約済み', formatAmount(closedAmount)],
              ['未配分', formatAmount(Math.max(0, allocationGap))],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-900">目標達成シミュレーション</h2>
              <span className="text-xs text-gray-400">成約済み {progress}% / 見込み込み {projectedProgress}% / 不足 {formatAmount(gap)}</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(projectedProgress, 100)}%` }} />
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">メンバー別予算配分</h2>
                <p className="text-xs text-gray-400">金額を万円単位で入力すると配分予算に反映されます</p>
              </div>
              <span className={`text-xs font-medium ${allocationGap < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                配分差分 {formatAmount(allocationGap)}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((member) => {
                const memberTarget = targets.find((target) =>
                  target.type === 'individual' && target.user_id === member.id && target.target_month === '2026-05-01',
                )
                const memberProjects = projects.filter((project) => project.user_id === member.id)
                const memberClosed = memberProjects.filter((project) => project.status === 'closed').reduce((sum, project) => sum + project.amount, 0)
                const memberPipeline = memberProjects.filter((project) => project.status !== 'closed').reduce((sum, project) => sum + project.amount, 0)
                const memberTargetAmount = memberTarget?.amount ?? 0
                const memberActualProgress = memberTargetAmount ? Math.round((memberClosed / memberTargetAmount) * 100) : 0
                const memberProjectedProgress = memberTargetAmount ? Math.round(((memberClosed + memberPipeline) / memberTargetAmount) * 100) : 0

                return (
                  <div key={member.id} className="px-4 py-3">
                    <div className="grid gap-3 lg:grid-cols-[minmax(160px,1fr)_180px_minmax(180px,1fr)_80px] lg:items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">成約 {formatAmount(memberClosed)} / 見込み {formatAmount(memberClosed + memberPipeline)}</p>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400">配分予算（万円）</label>
                        <input
                          type="number"
                          min={0}
                          value={Math.round(memberTargetAmount / 10000)}
                          onChange={(event) => handleAllocationChange(member.id, event.target.value)}
                          className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>実績 {memberActualProgress}%</span>
                          <span>見込み {memberProjectedProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(memberProjectedProgress, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-right text-sm font-bold text-gray-900">{memberProjectedProgress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
