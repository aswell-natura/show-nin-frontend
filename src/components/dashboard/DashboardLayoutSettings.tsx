import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useLayoutConfig,
  widgetLabels,
  playerWidgets,
  managerWidgets,
  type ColumnCount,
  type WidgetType,
} from "../../context/LayoutConfigContext";
import type { ActiveMode } from "../../types";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import Icon from "../ui/Icon";
import { cn } from "../../lib/utils";

const widgetIcons: Record<WidgetType, string> = {
  timeline: "history",
  "next-actions": "calendar-check",
  customers: "building-2",
  projects: "briefcase",
  tasks: "check-square",
  "my-budget": "pie-chart",
  members: "users",
  budget: "calculator",
  reviews: "clipboard-check",
  risks: "alert-triangle",
  reports: "file-text",
  "team-pipeline": "git-pull-request",
  "at-risk": "shield-alert",
  "team-activity": "activity",
  calendar: "calendar",
  empty: "minus",
};

export default function DashboardLayoutSettings() {
  const { currentUser, activeMode } = useAuth();
  const {
    playerConfig,
    managerConfig,
    updatePlayerConfig,
    updateManagerConfig,
  } = useLayoutConfig();
  const [activePanelIndex, setActivePanelIndex] = useState<number | null>(null);

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
  const availableWidgets =
    effectiveMode === "manager" ? managerWidgets : playerWidgets;

  const panelCount = config.columns === 4 ? 4 : config.columns;
  const panelLabels =
    config.columns === 4
      ? ["左上", "右上", "左下", "右下"]
      : config.columns === 3
        ? ["左", "中", "右"]
        : config.columns === 2
          ? ["左", "右"]
          : ["全体"];

  function setPanel(i: number, widget: WidgetType) {
    const panels = [...config.panels];
    while (panels.length < 4) panels.push("empty");
    panels[i] = widget;
    updateConfig({ panels });
  }

  const layoutIcons: Record<number, string> = {
    1: "square",
    2: "columns-2",
    3: "columns-3",
    4: "layout-grid",
  };

  const usedWidgets = config.panels.slice(0, panelCount).filter((_, idx) => idx !== activePanelIndex);

  return (
    <Popover onOpenChange={(open) => !open && setActivePanelIndex(null)}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" className="h-8 w-8">
          <Icon name="layout-dashboard" className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden shadow-2xl border-border/40 flex flex-col max-h-[85vh]" align="end">
        <div className="bg-muted/30 p-4 border-b border-border shrink-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            ダッシュボード設定
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin">
          {/* ① 分割数 */}
          <section>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              分割レイアウト
            </p>
            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as ColumnCount[]).map((n) => {
                const active = config.columns === n;
                return (
                  <Button
                    key={n}
                    onClick={() => {
                      updateConfig({ columns: n });
                      setActivePanelIndex(null);
                    }}
                    variant="ghost"
                    className={cn(
                      "h-12 flex flex-col gap-1 border-2 transition-all",
                      active 
                        ? "bg-primary/5 border-primary text-primary shadow-sm" 
                        : "border-border/60 hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <Icon name={layoutIcons[n]} className="w-4 h-4" />
                    <span className="text-[9px] font-bold">{n}分割</span>
                  </Button>
                );
              })}
            </div>
          </section>

          {/* ② ミニプレビュー & パネル選択 */}
          <section>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              編集パネルの選択
            </p>
            <div className={cn(
              "grid gap-2 mb-2 p-2 bg-muted/20 rounded-xl border border-border/50",
              config.columns === 1 ? "grid-cols-1" : 
              config.columns === 2 ? "grid-cols-2" :
              config.columns === 3 ? "grid-cols-3" : "grid-cols-2"
            )}>
              {Array.from({ length: panelCount }).map((_, i) => {
                const widget = config.panels[i] ?? "empty";
                const isActive = activePanelIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActivePanelIndex(isActive ? null : i)}
                    className={cn(
                      "h-14 flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-all duration-200 shadow-sm",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]" 
                        : "bg-background border-border hover:border-primary/60 hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <Icon 
                      name={widgetIcons[widget]} 
                      className={cn(
                        "w-4 h-4", 
                        isActive ? "text-primary-foreground" : "text-primary/70"
                      )} 
                    />
                    <span className={cn(
                      "text-[9px] font-bold truncate px-1 w-full text-center tracking-tight",
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {panelLabels[i]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ③ ウィジェットグリッド (選択時のみ表示) */}
          {activePanelIndex !== null && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {panelLabels[activePanelIndex]}パネル の内容
                </p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setActivePanelIndex(null)}>
                  <Icon name="x" className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {availableWidgets.map((w) => {
                  const isSelectedInCurrent = config.panels[activePanelIndex] === w;
                  const isTaken = usedWidgets.includes(w) && w !== "empty";
                  
                  return (
                    <button
                      key={w}
                      disabled={isTaken}
                      onClick={() => setPanel(activePanelIndex, w)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 h-16 rounded-xl border-2 transition-all gap-1.5 shadow-sm",
                        isSelectedInCurrent 
                          ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm" 
                          : isTaken
                            ? "bg-muted/10 border-border/30 opacity-30 cursor-not-allowed"
                            : "bg-background border-border hover:border-primary hover:bg-primary/5 text-foreground"
                      )}
                    >
                      <Icon name={widgetIcons[w]} className={cn("w-4 h-4", isSelectedInCurrent ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-[8px] font-bold leading-tight text-center px-0.5 line-clamp-2">
                        {widgetLabels[w]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
