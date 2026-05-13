import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLayoutConfig } from '../../context/LayoutConfigContext'
import { useDataStore } from '../../context/DataStoreContext'
import type { ActiveMode } from '../../types'


function RecordButton({ compact }: { compact: boolean }) {
  const popupRef = useRef<Window | null>(null)

  function openRecordingWindow() {
    const width = 430
    const height = 780
    const left = Math.max(0, window.screenX + window.outerWidth - width - 24)
    const top = Math.max(0, window.screenY + 32)
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
      'noopener=no',
    ].join(',')

    const popup = window.open('/recording', 'show_nin_recording', features)
    if (popup) {
      popupRef.current = popup
      popup.focus()
    } else {
      window.location.href = '/recording'
    }
  }

  return (
    <button
      onClick={openRecordingWindow}
      title="録音画面を開く"
      className={`
        relative flex items-center gap-2 rounded-lg font-semibold transition-all duration-150 shrink-0
        bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md active:scale-[0.98]
        ${compact ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm'}
      `}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8" />
        </svg>
      </span>
      <span className="whitespace-nowrap">{compact ? '録音' : '録音開始'}</span>
    </button>
  )
}

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { currentUser, activeMode, setActiveMode, logout } = useAuth()
  const { playerConfig, managerConfig, openSettingsPanel } = useLayoutConfig()
  const { notifications, customers, resetToDefaults } = useDataStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  if (!currentUser) return null

  const effectiveMode: ActiveMode =
    currentUser.role === 'manager' ? 'manager' :
    currentUser.role === 'dual' ? activeMode : 'player'

  const headerSize = effectiveMode === 'manager'
    ? managerConfig.headerSize
    : playerConfig.headerSize

  const isCompact = headerSize === 'compact'
  const isLarge   = headerSize === 'large'

  const headerHeight = isCompact ? 'h-10' : isLarge ? 'h-16' : 'h-14'
  const iconSize     = isCompact ? 'w-7 h-7' : isLarge ? 'w-9 h-9' : 'w-8 h-8'
  const px           = isCompact ? 'px-3 gap-2' : isLarge ? 'px-5 gap-4' : 'px-4 gap-3'

  const unreadCount = notifications.filter(
    (n) => n.user_id === currentUser.id && !n.is_read
  ).length

  const userNotifications = notifications.filter(
    (n) => n.user_id === currentUser.id
  )

  const filteredCustomers = searchQuery.length > 0
    ? customers.filter((c) =>
        c.name.includes(searchQuery) || c.industry.includes(searchQuery)
      )
    : []

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className={`${headerHeight} bg-white border-b border-gray-200 flex items-center ${px} shrink-0 relative z-50 transition-all duration-200`}>

      {/* ハンバーガー（モバイルのみ） */}
      <button
        onClick={onMenuToggle}
        className={`md:hidden ${iconSize} flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors shrink-0`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
          <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
          <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
        </svg>
      </button>

      {/* ロゴ */}
      <div className={`${isCompact ? 'text-sm' : isLarge ? 'text-lg' : 'text-base'} font-semibold text-gray-900 tracking-tight shrink-0`}>
        SHOW-NIN
      </div>

      {/* 顧客検索（コンパクト時は非表示） */}
      {!isCompact && (
        <div className="relative hidden sm:block flex-1 max-w-sm">
          <div
            className={`flex items-center gap-2 ${isLarge ? 'h-10' : 'h-8'} px-3 bg-gray-100 rounded-lg cursor-text`}
            onClick={() => setShowSearch(true)}
          >
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            {showSearch ? (
              <input
                autoFocus
                className="bg-transparent text-sm text-gray-800 outline-none w-full placeholder-gray-400"
                placeholder="顧客を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { setTimeout(() => { setShowSearch(false); setSearchQuery('') }, 150) }}
              />
            ) : (
              <span className="text-sm text-gray-400 flex-1">顧客を検索</span>
            )}
            <span className="text-xs text-gray-400 shrink-0 hidden md:block">⌘K</span>
          </div>

          {filteredCustomers.length > 0 && (
            <div className="absolute top-10 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
                  onClick={() => { navigate(`/customers/${c.id}`); setShowSearch(false); setSearchQuery('') }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${c.rank === 'A' ? 'bg-blue-500' : c.rank === 'B' ? 'bg-gray-400' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.industry}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">ランク {c.rank}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dual権限時のモード切り替え */}
      {currentUser.role === 'dual' && (
        <div className="flex items-center bg-gray-100 rounded-full p-0.5 shrink-0">
          <button
            onClick={() => setActiveMode('player')}
            className={`px-2.5 sm:px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-150 ${
              activeMode === 'player'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            PL<span className="hidden sm:inline">ayer</span>
          </button>
          <button
            onClick={() => setActiveMode('manager')}
            className={`px-2.5 sm:px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-150 ${
              activeMode === 'manager'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            MG<span className="hidden sm:inline">R</span>
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {/* 録音ボタン */}
        <RecordButton compact={isCompact} />

        {/* レイアウト設定 */}
        <button
          onClick={openSettingsPanel}
          title="レイアウト設定"
          className={`${iconSize} flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors`}
        >
          <svg className="w-4.5 h-4.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* 通知 */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
            className={`relative ${iconSize} flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors`}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">通知</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {userNotifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">通知はありません</p>
                ) : (
                  userNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* プロフィール */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
            className={`${iconSize} rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 hover:bg-blue-200 transition-colors`}
          >
            {currentUser.avatar}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.email}</p>
              </div>
              <button
                onClick={() => { resetToDefaults(); setShowProfile(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
              >
                データをリセット
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
