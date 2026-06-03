import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import { StandardWidget } from '../shared/StandardWidget'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

const referenceTime = new Date('2026-05-09T00:00:00').getTime()

export default function ManagerAtRisk() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { profiles, projects, activities, customers } = useDataStore()

  const myTeam = profiles.filter((p) => p.manager_id === currentUser!.id)
  const allProjects = projects.filter((p) => myTeam.some((m) => m.id === p.user_id))

  const staleProjects = allProjects.filter((p) => {
    if (p.status === 'closed') return false
    const lastActivity = activities
      .filter((a) => a.project_id === p.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    if (!lastActivity) return true
    const daysSince = (referenceTime - new Date(lastActivity.created_at).getTime()) / 1000 / 60 / 60 / 24
    return daysSince >= 3
  })

  return (
    <StandardWidget
      title="要チェック案件"
      description="活動が停滞している案件の確認"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/risks')} className="font-bold text-muted-foreground hover:text-red-600 transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={staleProjects}
      keyExtractor={(p) => p.id}
      emptyMessage="要フォロー案件はありません"
      renderItem={(p) => {
        const customer = customers.find((c) => c.id === p.customer_id)
        const owner = myTeam.find((m) => m.id === p.user_id)
        return (
          <button
            onClick={() => navigate(`/customers/${p.customer_id}`)}
            className="w-full text-left px-4 py-3 hover:bg-red-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-red-600 transition-colors">{customer?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">{p.name}</p>
              </div>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground shrink-0 uppercase tracking-wider">{owner?.name.split(' ')[0]}</span>
            </div>
          </button>
        )
      }}
    />
  )
}
