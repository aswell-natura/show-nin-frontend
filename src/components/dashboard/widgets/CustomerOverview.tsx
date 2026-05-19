import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../../context/DataStoreContext'
import { Button } from '@/components/ui/button'
import { StandardWidget } from '../shared/StandardWidget'
import { ChevronRight } from 'lucide-react'
import { RankBadge } from '../shared/StatusBadge'

const referenceTime = new Date('2026-05-09T00:00:00').getTime()

function formatRelative(iso: string) {
  const diff = Math.floor((referenceTime - new Date(iso).getTime()) / 1000 / 60 / 60 / 24)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  if (diff < 7) return `${diff}日前`
  return new Date(iso).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
}

export default function CustomerOverview() {
  const navigate = useNavigate()
  const { customers, projects, activities } = useDataStore()
  const sortedCustomers = [...customers].sort(
    (a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime(),
  )
  const pinnedCount = customers.filter((customer) => customer.is_pinned).length
  const rankACount = customers.filter((customer) => customer.rank === 'A').length
  const activeCustomerCount = customers.filter((customer) =>
    projects.some((project) => project.customer_id === customer.id && project.status !== 'closed'),
  ).length

  return (
    <StandardWidget
      title="顧客一覧"
      description="企業別の案件・活動状況"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/customers')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      stats={[
        { label: '顧客数', value: customers.length, unit: '社' },
        { label: 'ランクA', value: rankACount, unit: '社', labelClassName: 'text-blue-600', valueClassName: 'text-blue-700' },
        { label: '進行中', value: activeCustomerCount, unit: '社' },
      ]}
      items={sortedCustomers}
      keyExtractor={(c) => c.id}
      maxItems={12}
      onSeeMore={() => navigate('/customers')}
      renderItem={(customer) => {
        const activeProjects = projects.filter(
          (project) => project.customer_id === customer.id && project.status !== 'closed',
        )
        const latestActivity = activities
          .filter((activity) => activity.customer_id === customer.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        return (
          <button
            onClick={() => navigate(`/customers/${customer.id}`)}
            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <RankBadge rank={customer.rank} size="lg" className="shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{customer.name}</p>
                    {customer.is_pinned && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold shrink-0">ピン</span>}
                  </div>
                  <p className="mt-0.5 text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">{customer.industry?.join("、")}</p>
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{formatRelative(customer.last_accessed_at)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-medium">
              <span className="text-muted-foreground truncate">
                {latestActivity ? latestActivity.title : '活動なし'}
              </span>
              <span className="text-primary/80 shrink-0 font-bold">
                {activeProjects.length > 0 ? `進行中 ${activeProjects.length}件` : '案件なし'}
              </span>
            </div>
          </button>
        )
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-[10px] font-bold text-muted-foreground bg-muted/10 uppercase tracking-widest">
        <span>ピン留め {pinnedCount}件</span>
        <span>・</span>
        <span>最終アクセス順</span>
      </div>
    </StandardWidget>
  )
}
