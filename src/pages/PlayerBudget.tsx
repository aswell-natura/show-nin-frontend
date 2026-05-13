import { useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useDataStore } from '../context/DataStoreContext'
import type { ProjectStatus } from '../types'

type PeriodMode = 'month' | 'quarter' | 'half' | 'year'

function formatAmount(amount: number) {
  return `${(amount / 10000).toLocaleString()}万円`
}

function monthKey(value: string) {
  return value.slice(0, 7)
}

function yearKey(value: string) {
  return value.slice(0, 4)
}

function quarterKey(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
}

function halfKey(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return `${date.getFullYear()}-H${date.getMonth() < 6 ? 1 : 2}`
}

function periodKey(value: string, mode: PeriodMode) {
  if (mode === 'year') return yearKey(value)
  if (mode === 'quarter') return quarterKey(value)
  if (mode === 'half') return halfKey(value)
  return monthKey(value)
}

function defaultPeriod(mode: PeriodMode) {
  if (mode === 'year') return '2026'
  if (mode === 'quarter') return '2026-Q2'
  if (mode === 'half') return '2026-H1'
  return '2026-05'
}

function formatPeriod(period: string) {
  if (period.includes('-Q')) {
    const [year, quarter] = period.split('-Q')
    return `${year}年 Q${quarter}`
  }
  if (period.includes('-H')) {
    const [year, half] = period.split('-H')
    return `${year}年 ${half === '1' ? '上期' : '下期'}`
  }
  if (/^\d{4}$/.test(period)) return `${period}年`
  return period
}

function projectDate(project: { close_date?: string; updated_at: string; created_at: string; status: ProjectStatus }) {
  if (project.status === 'closed') return project.close_date ?? project.updated_at
  return project.updated_at ?? project.created_at
}

function statusLabel(status: ProjectStatus) {
  if (status === 'closed') return '成約'
  if (status === 'negotiating') return '交渉中'
  if (status === 'proposing') return '提案中'
  return 'リード'
}

function grossProfit(amount: number) {
  return Math.round(amount * 0.35)
}

function elapsedDays(start: string, end: string) {
  const startTime = new Date(start.includes('T') ? start : `${start}T00:00:00`).getTime()
  const endTime = new Date(end.includes('T') ? end : `${end}T00:00:00`).getTime()
  return Math.max(0, Math.round((endTime - startTime) / 86400000))
}

export default function PlayerBudget() {
  const { currentUser } = useAuth()
  const { profiles, projects, targets } = useDataStore()
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const myProjects = projects.filter((project) => project.user_id === currentUser?.id)
  const myTargets = targets.filter((item) => item.type === 'individual' && item.user_id === currentUser?.id)
  const periodOptions = useMemo(() => {
    const keys = new Set<string>()
    myTargets.forEach((target) => keys.add(periodKey(target.target_month, periodMode)))
    myProjects.forEach((project) => keys.add(periodKey(projectDate(project), periodMode)))
    return [...keys].sort().reverse()
  }, [myProjects, myTargets, periodMode])
  const [selectedPeriod, setSelectedPeriod] = useState('2026-05')
  const effectivePeriod = periodOptions.includes(selectedPeriod) ? selectedPeriod : periodOptions[0] ?? selectedPeriod

  const periodTargets = myTargets.filter((target) =>
    periodKey(target.target_month, periodMode) === effectivePeriod,
  )
  const targetAmount = periodTargets.reduce((sum, target) => sum + target.amount, 0)
  const manager = profiles.find((profile) => profile.id === periodTargets[0]?.manager_id || profile.id === currentUser?.manager_id)

  const periodProjects = myProjects.filter((project) =>
    periodKey(projectDate(project), periodMode) === effectivePeriod,
  )
  const closedProjects = periodProjects.filter((project) => project.status === 'closed')
  const closedAmount = closedProjects.reduce((sum, project) => sum + project.amount, 0)
  const closedGrossProfit = closedProjects.reduce((sum, project) => sum + grossProfit(project.amount), 0)
  const pipelineProjects = periodProjects.filter((project) => project.status !== 'closed')
  const pipelineAmount = pipelineProjects.reduce((sum, project) => sum + project.amount, 0)
  const pipelineGrossProfit = pipelineProjects.reduce((sum, project) => sum + grossProfit(project.amount), 0)
  const projectedAmount = closedAmount + pipelineAmount
  const projectedGrossProfit = closedGrossProfit + pipelineGrossProfit
  const actualProgress = targetAmount ? Math.round((closedAmount / targetAmount) * 100) : 0
  const projectedProgress = targetAmount ? Math.round((projectedAmount / targetAmount) * 100) : 0
  const gap = Math.max(0, targetAmount - projectedAmount)
  const statusCounts = {
    lead: periodProjects.filter((project) => project.status === 'lead').length,
    proposing: periodProjects.filter((project) => project.status === 'proposing').length,
    negotiating: periodProjects.filter((project) => project.status === 'negotiating').length,
    closed: closedProjects.length,
  }
  const averageOrderAmount = closedProjects.length ? Math.round(closedAmount / closedProjects.length) : 0
  const newProjectCount = myProjects.filter((project) => periodKey(project.created_at, periodMode) === effectivePeriod).length
  const lostCount = 0
  const leadTimeProjects = periodProjects.length ? periodProjects : myProjects
  const averageLeadTime = leadTimeProjects.length
    ? Math.round(
        leadTimeProjects.reduce((sum, project) => {
          const end = project.status === 'closed' ? (project.close_date ?? project.updated_at) : new Date().toISOString().slice(0, 10)
          return sum + elapsedDays(project.created_at, end)
        }, 0) / leadTimeProjects.length,
      )
    : 0

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">予算・実績</h1>
              <p className="mt-0.5 text-xs text-gray-400">マネージャーから配分された予算と案件実績を確認します</p>
            </div>
            <div className="flex gap-2">
              <select
                value={periodMode}
                onChange={(event) => {
                  const nextMode = event.target.value as PeriodMode
                  setPeriodMode(nextMode)
                  setSelectedPeriod(defaultPeriod(nextMode))
                }}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none"
              >
                <option value="month">月</option>
                <option value="year">年</option>
                <option value="quarter">四半期</option>
                <option value="half">半期</option>
              </select>
              <select
                value={effectivePeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none"
              >
                {periodOptions.map((period) => (
                  <option key={period} value={period}>{formatPeriod(period)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['配分予算', formatAmount(targetAmount)],
              ['売上', formatAmount(closedAmount)],
              ['粗利', formatAmount(closedGrossProfit)],
              ['成約数', `${closedProjects.length}件`],
              ['案件対応数', `${periodProjects.length}件`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">達成状況</h2>
                <p className="mt-0.5 text-xs text-gray-400">配分者: {manager?.name ?? '未設定'} / 不足見込み {formatAmount(gap)}</p>
              </div>
              <span className="text-xs text-gray-400">実績 {actualProgress}% / 見込み {projectedProgress}%</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(projectedProgress, 100)}%` }} />
            </div>
          </section>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ['新規獲得数', `${newProjectCount}件`],
              ['失注数', `${lostCount}件`],
              ['成約数', `${closedProjects.length}件`],
              ['リードタイム', `${averageLeadTime}日`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ['リード', `${statusCounts.lead}件`],
              ['提案中', `${statusCounts.proposing}件`],
              ['交渉中', `${statusCounts.negotiating}件`],
              ['平均受注単価', formatAmount(averageOrderAmount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-4 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">案件実績の内訳</h2>
                <p className="mt-0.5 text-xs text-gray-400">案件一覧のステータス・金額から期間別に集計しています</p>
              </div>
              <span className="text-xs text-gray-400">見込み込み 売上 {formatAmount(projectedAmount)} / 粗利 {formatAmount(projectedGrossProfit)}</span>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="hidden md:grid px-4 py-2 grid-cols-[1fr_120px_120px_120px_120px] gap-3 bg-gray-50 text-xs font-medium text-gray-400">
                <span>案件</span>
                <span>ステータス</span>
                <span>売上</span>
                <span>粗利</span>
                <span>計上区分</span>
              </div>
              {periodProjects.map((project) => (
                <div key={project.id} className="px-4 py-3 grid gap-3 md:grid-cols-[1fr_120px_120px_120px_120px] md:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{project.close_date ?? project.updated_at.slice(0, 10)}</p>
                  </div>
                  <span className="text-sm text-gray-600">{statusLabel(project.status)}</span>
                  <span className="text-sm font-bold text-gray-900">{formatAmount(project.amount)}</span>
                  <span className="text-sm font-bold text-gray-900">{formatAmount(grossProfit(project.amount))}</span>
                  <span className="text-xs text-gray-400">{project.status === 'closed' ? '受注計上' : '見込み計上'}</span>
                </div>
              ))}
              {periodProjects.length === 0 && (
                <p className="py-12 text-center text-sm text-gray-400">この期間の案件実績はありません</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
