import { useAuth } from '../../context/AuthContext'
import {
  useLayoutConfig,
  widgetLabels,
  playerWidgets,
  managerWidgets,
  type HeaderSize,
  type ColumnCount,
  type TwoColRatio,
  type FourPanelRatio,
  type WidgetType,
  type FontScale,
  type ColorMode,
} from '../../context/LayoutConfigContext'
import type { ActiveMode } from '../../types'

function btn(active: boolean, onClick: () => void, label: string) {
  return (
    <button
      key={label}
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

export default function LayoutSettingsPanel() {
  const { currentUser, activeMode } = useAuth()
  const {
    playerConfig, managerConfig,
    updatePlayerConfig, updateManagerConfig,
    fontScale, colorMode, setFontScale, setColorMode,
    isSettingsPanelOpen, closeSettingsPanel,
  } = useLayoutConfig()

  if (!currentUser) return null

  const effectiveMode: ActiveMode =
    currentUser.role === 'manager' ? 'manager' :
    currentUser.role === 'dual' ? activeMode : 'player'

  const config = effectiveMode === 'manager' ? managerConfig : playerConfig
  const updateConfig = effectiveMode === 'manager' ? updateManagerConfig : updatePlayerConfig
  const availableWidgets = effectiveMode === 'manager' ? managerWidgets : playerWidgets

  const panelCount = config.columns === 4 ? 4 : config.columns
  const panelLabels =
    config.columns === 4 ? ['左上', '右上', '左下', '右下'] :
    config.columns === 3 ? ['左', '中', '右'] :
    config.columns === 2 ? ['左', '右'] : ['全体']

  function setPanel(i: number, widget: WidgetType) {
    const panels = [...config.panels]
    while (panels.length < 4) panels.push('empty')
    panels[i] = widget
    updateConfig({ panels })
  }

  return (
    <>
      {isSettingsPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={closeSettingsPanel}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-72 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSettingsPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-900">レイアウト設定</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {effectiveMode === 'manager' ? 'Manager モード' : 'Player モード'}
            </p>
          </div>
          <button
            onClick={closeSettingsPanel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">

          {/* ① ヘッダーサイズ */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">ヘッダーサイズ</p>
            <div className="flex gap-1.5 flex-wrap">
              {btn(config.headerSize === 'compact', () => updateConfig({ headerSize: 'compact' as HeaderSize }), 'コンパクト')}
              {btn(config.headerSize === 'normal',  () => updateConfig({ headerSize: 'normal'  as HeaderSize }), '標準')}
              {btn(config.headerSize === 'large',   () => updateConfig({ headerSize: 'large'   as HeaderSize }), '大')}
            </div>
          </section>

          {/* 表示設定 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">表示設定</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">文字サイズ</p>
                <div className="flex gap-1.5 flex-wrap">
                  {btn(fontScale === 'small', () => setFontScale('small' as FontScale), '小')}
                  {btn(fontScale === 'normal', () => setFontScale('normal' as FontScale), '標準')}
                  {btn(fontScale === 'large', () => setFontScale('large' as FontScale), '大')}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">カラーモード</p>
                <div className="flex gap-1.5 flex-wrap">
                  {btn(colorMode === 'light', () => setColorMode('light' as ColorMode), 'ライト')}
                  {btn(colorMode === 'dark', () => setColorMode('dark' as ColorMode), 'ダーク')}
                </div>
              </div>
            </div>
          </section>

          {/* ② 分割数 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">分割数</p>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4] as ColumnCount[]).map((n) =>
                btn(config.columns === n, () => updateConfig({ columns: n }), String(n))
              )}
            </div>
            {config.columns === 4 && (
              <p className="text-xs text-gray-400 mt-2">上下2行 × 左右2列のグリッド</p>
            )}
          </section>

          {/* ③ 幅の比率（2列 or 4分割） */}
          {config.columns === 2 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">左右の比率</p>
              <div className="flex gap-1.5">
                {(['2:1', '1:1', '1:2'] as TwoColRatio[]).map((r) =>
                  btn(config.twoColRatio === r, () => updateConfig({ twoColRatio: r }), r)
                )}
              </div>
            </section>
          )}

          {config.columns === 4 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">左右の比率</p>
              <div className="flex gap-1.5">
                {(['1:2', '1:1', '2:1'] as FourPanelRatio[]).map((r) =>
                  btn(config.fourPanelRatio === r, () => updateConfig({ fourPanelRatio: r }), r)
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">上下どちらの行にも同じ比率を適用</p>
            </section>
          )}

          {/* ④ パネル内容 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">パネル内容</p>
            <div className="flex flex-col gap-3">
              {Array.from({ length: panelCount }).map((_, i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500 mb-1.5">{panelLabels[i]}</p>
                  <select
                    value={config.panels[i] ?? 'empty'}
                    onChange={(e) => setPanel(i, e.target.value as WidgetType)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  >
                    {availableWidgets.map((w) => (
                      <option key={w} value={w}>{widgetLabels[w]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">設定は自動保存されます</p>
        </div>
      </div>
    </>
  )
}
