import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { mockProfiles } from '../../data/mock'
import type { Profile } from '../../types'

const roleCards = [
  {
    profile: mockProfiles[0],
    title: 'プレイヤー',
    subtitle: '営業マンとしてログイン',
    description: '個人成績・案件管理・活動履歴',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: '👤',
  },
  {
    profile: mockProfiles[2],
    title: 'マネージャー',
    subtitle: 'マネージャーとしてログイン',
    description: 'チーム分析・フィードバック・目標管理',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    badgeColor: 'bg-gray-200 text-gray-700',
    icon: '👥',
  },
  {
    profile: mockProfiles[3],
    title: '管理者',
    subtitle: '管理者としてログイン',
    description: '全機能・プレイヤー／マネージャー表示切り替え',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    badgeColor: 'bg-gray-300 text-gray-800',
    icon: '⚙️',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleLogin(profile: Profile) {
    login(profile)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <div className="text-2xl font-semibold text-gray-900 tracking-tight">SHOW-NIN</div>
        <p className="mt-2 text-sm text-gray-500">営業支援プラットフォーム</p>
      </div>

      <p className="mb-6 text-sm text-gray-500">ログインするロールを選択してください</p>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-3xl">
        {roleCards.map((card) => (
          <button
            key={card.profile.id}
            onClick={() => handleLogin(card.profile)}
            className={`
              flex-1 text-left border rounded-xl p-6 cursor-pointer
              transition-all duration-200
              hover:shadow-lg hover:-translate-y-0.5
              ${card.bgColor} ${card.borderColor}
            `}
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.badgeColor}`}>
              {card.title}
            </span>
            <h3 className="mt-3 text-base font-semibold text-gray-900">{card.subtitle}</h3>
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{card.description}</p>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
                  {card.profile.avatar}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{card.profile.name}</p>
                  <p className="text-xs text-gray-400">{card.profile.email}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs text-gray-400">
        これはデモ用のモックアプリケーションです
      </p>
    </div>
  )
}
