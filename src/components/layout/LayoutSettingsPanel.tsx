import { useAuth } from "../../context/AuthContext";
import {
  useLayoutConfig,
  type HeaderSize,
  type FontScale,
  type ColorMode,
} from "../../context/LayoutConfigContext";
import type { ActiveMode } from "../../types";
import Icon from "../ui/Icon";

export default function LayoutSettingsPanel() {
  const { currentUser, activeMode } = useAuth();
  const {
    playerConfig,
    managerConfig,
    updatePlayerConfig,
    updateManagerConfig,
    fontScale,
    colorMode,
    setFontScale,
    setColorMode,
    isSettingsPanelOpen,
    closeSettingsPanel,
  } = useLayoutConfig();

  if (!currentUser) return null;

  const effectiveMode: ActiveMode =
    currentUser.role === "manager"
      ? "manager"
      : currentUser.role === "dual"
        ? activeMode
        : "player";

  const config = effectiveMode === "manager" ? managerConfig : playerConfig;
  const updateConfig =
    effectiveMode === "manager" ? updateManagerConfig : updatePlayerConfig;

  return (
    <>
      {isSettingsPanelOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40"
          onClick={closeSettingsPanel}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-72 bg-background border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSettingsPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">表示設定</p>
            <p className="text-xs text-muted-foreground mt-0.5"></p>
          </div>
          <button
            onClick={closeSettingsPanel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
          {/* ① ヘッダーサイズ */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="layout" className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                ヘッダーサイズ
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "compact", label: "小", icon: "minimize" },
                { id: "normal", label: "標準", icon: "layout" },
                { id: "large", label: "大", icon: "maximize" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    updateConfig({ headerSize: item.id as HeaderSize })
                  }
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    config.headerSize === item.id
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <Icon name={item.icon} className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ② 表示設定 */}
          <section className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="type" className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  文字サイズ
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "small", label: "小" },
                  { id: "normal", label: "標準" },
                  { id: "large", label: "大" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFontScale(item.id as FontScale)}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      fontScale === item.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="palette" className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  カラーモード
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setColorMode("light" as ColorMode)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    colorMode === "light"
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon name="sun" className="w-4 h-4" />
                  <span className="text-xs font-medium">ライト</span>
                </button>
                <button
                  onClick={() => setColorMode("dark" as ColorMode)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    colorMode === "dark"
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon name="moon" className="w-4 h-4" />
                  <span className="text-xs font-medium">ダーク</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            設定は自動保存されます
          </p>
        </div>
      </div>
    </>
  );
}
