/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type HeaderSize = 'compact' | 'normal' | 'large'
export type ColumnCount = 1 | 2 | 3 | 4
export type TwoColRatio = '2:1' | '1:1' | '1:2'
export type FourPanelRatio = '1:2' | '1:1' | '2:1'
export type FontScale = 'small' | 'normal' | 'large'
export type ColorMode = 'light' | 'dark'

export type WidgetType =
  | 'timeline'
  | 'next-actions'
  | 'customers'
  | 'projects'
  | 'tasks'
  | 'my-budget'
  | 'members'
  | 'budget'
  | 'reviews'
  | 'risks'
  | 'reports'
  | 'team-pipeline'
  | 'at-risk'
  | 'team-activity'
  | 'calendar'
  | 'empty'

export const widgetLabels: Record<WidgetType, string> = {
  'timeline': '活動タイムライン',
  'next-actions': 'Next Action / 予定',
  'customers': '顧客一覧',
  'projects': '案件一覧',
  'tasks': 'タスク',
  'my-budget': '予算・実績',
  'members': 'メンバー',
  'budget': '予算編成',
  'reviews': 'レビュー',
  'risks': 'リスク',
  'reports': 'レポート',
  'team-pipeline': 'チームパイプライン',
  'at-risk': '要チェック案件',
  'team-activity': 'メンバー別活動',
  'calendar': 'スケジュール',
  'empty': '（空白）',
}

export const playerWidgets: WidgetType[] = ['timeline', 'next-actions', 'customers', 'projects', 'tasks', 'my-budget', 'calendar', 'empty']
export const managerWidgets: WidgetType[] = [
  'team-pipeline',
  'members',
  'customers',
  'projects',
  'tasks',
  'budget',
  'reviews',
  'risks',
  'reports',
  'at-risk',
  'team-activity',
  'calendar',
  'empty',
]

export interface LayoutConfig {
  headerSize: HeaderSize
  columns: ColumnCount
  twoColRatio: TwoColRatio
  fourPanelRatio: FourPanelRatio
  panels: WidgetType[]
}

const defaultPlayerConfig: LayoutConfig = {
  headerSize: 'normal',
  columns: 2,
  twoColRatio: '2:1',
  fourPanelRatio: '1:1',
  panels: ['timeline', 'next-actions', 'empty', 'empty'],
}

const defaultManagerConfig: LayoutConfig = {
  headerSize: 'normal',
  columns: 4,
  twoColRatio: '1:1',
  fourPanelRatio: '1:1',
  panels: ['team-pipeline', 'at-risk', 'team-activity', 'projects'],
}

interface LayoutConfigContextValue {
  playerConfig: LayoutConfig
  managerConfig: LayoutConfig
  fontScale: FontScale
  colorMode: ColorMode
  updatePlayerConfig: (config: Partial<LayoutConfig>) => void
  updateManagerConfig: (config: Partial<LayoutConfig>) => void
  setFontScale: (scale: FontScale) => void
  setColorMode: (mode: ColorMode) => void
  isSettingsPanelOpen: boolean
  openSettingsPanel: () => void
  closeSettingsPanel: () => void
}

const LayoutConfigContext = createContext<LayoutConfigContextValue | null>(null)

function loadConfig(key: string, defaultConfig: LayoutConfig): LayoutConfig {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return { ...defaultConfig, ...JSON.parse(stored) }
  } catch {
    return defaultConfig
  }
  return defaultConfig
}

export function LayoutConfigProvider({ children }: { children: ReactNode }) {
  const [playerConfig, setPlayerConfig] = useState<LayoutConfig>(() =>
    loadConfig('show-nin-layout-player', defaultPlayerConfig)
  )
  const [managerConfig, setManagerConfig] = useState<LayoutConfig>(() =>
    loadConfig('show-nin-layout-manager', defaultManagerConfig)
  )
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    const stored = localStorage.getItem('show-nin-font-scale')
    return stored === 'small' || stored === 'large' ? stored : 'normal'
  })
  const [colorMode, setColorModeState] = useState<ColorMode>(() =>
    localStorage.getItem('show-nin-color-mode') === 'dark' ? 'dark' : 'light'
  )
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('show-nin-layout-player', JSON.stringify(playerConfig))
  }, [playerConfig])

  useEffect(() => {
    localStorage.setItem('show-nin-layout-manager', JSON.stringify(managerConfig))
  }, [managerConfig])

  useEffect(() => {
    const size = fontScale === 'small' ? '14px' : fontScale === 'large' ? '18px' : '16px'
    document.documentElement.style.fontSize = size
    localStorage.setItem('show-nin-font-scale', fontScale)
  }, [fontScale])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', colorMode === 'dark')
    localStorage.setItem('show-nin-color-mode', colorMode)
  }, [colorMode])

  function setFontScale(scale: FontScale) {
    setFontScaleState(scale)
  }

  function setColorMode(mode: ColorMode) {
    setColorModeState(mode)
  }

  return (
    <LayoutConfigContext.Provider
      value={{
        playerConfig,
        managerConfig,
        fontScale,
        colorMode,
        updatePlayerConfig: (c) => setPlayerConfig((prev) => ({ ...prev, ...c })),
        updateManagerConfig: (c) => setManagerConfig((prev) => ({ ...prev, ...c })),
        setFontScale,
        setColorMode,
        isSettingsPanelOpen,
        openSettingsPanel: () => setIsSettingsPanelOpen(true),
        closeSettingsPanel: () => setIsSettingsPanelOpen(false),
      }}
    >
      {children}
    </LayoutConfigContext.Provider>
  )
}

export function useLayoutConfig() {
  const ctx = useContext(LayoutConfigContext)
  if (!ctx) throw new Error('useLayoutConfig must be used within LayoutConfigProvider')
  return ctx
}
