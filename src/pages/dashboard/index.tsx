import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  useLayoutConfig,
  type WidgetType,
  type LayoutConfig,
} from "../../context/LayoutConfigContext";
import PageLayout from "../../components/layout/PageLayout";
import SummaryCards from "../../components/dashboard/SummaryCards";
import PlayerTimeline from "../../components/dashboard/widgets/PlayerTimeline";
import PlayerNextActions from "../../components/dashboard/widgets/PlayerNextActions";
import ManagerTeamPipeline from "../../components/dashboard/widgets/ManagerTeamPipeline";
import ManagerAtRisk from "../../components/dashboard/widgets/ManagerAtRisk";
import ManagerTeamActivity from "../../components/dashboard/widgets/ManagerTeamActivity";
import TaskOverview from "../../components/dashboard/widgets/TaskOverview";
import ProjectOverview from "../../components/dashboard/widgets/ProjectOverview";
import CustomerOverview from "../../components/dashboard/widgets/CustomerOverview";
import PlayerBudgetOverview from "../../components/dashboard/widgets/PlayerBudgetOverview";
import {
  BudgetSummaryWidget,
  MemberSummaryWidget,
  ReportSummaryWidget,
  ReviewSummaryWidget,
  RiskSummaryWidget,
} from "../../components/dashboard/widgets/ManagerMenuOverviews";
import CalendarWidget from "../../components/dashboard/widgets/CalendarWidget";
import DashboardLayoutSettings from "../../components/dashboard/DashboardLayoutSettings";
import type { ActiveMode } from "../../types";
import { cn } from "../../lib/utils";
import { LayoutDashboard, ChevronUp, ChevronDown } from "lucide-react";

const tabLabel: Record<WidgetType, string> = {
  timeline: "活動",
  "next-actions": "Next",
  customers: "顧客",
  projects: "案件",
  tasks: "タスク",
  "my-budget": "予算",
  members: "メンバー",
  budget: "予算",
  reviews: "レビュー",
  risks: "リスク",
  reports: "レポート",
  "team-pipeline": "パイプライン",
  "at-risk": "要チェック",
  "team-activity": "メンバー",
  calendar: "スケジュール",
  empty: "---",
};

// ─── ウィジェット描画 ───────────────────────────────────────────────────────

function WidgetPanel({ widget }: { widget: WidgetType }) {
  switch (widget) {
    case "timeline":
      return <PlayerTimeline />;
    case "next-actions":
      return <PlayerNextActions />;
    case "customers":
      return <CustomerOverview />;
    case "projects":
      return <ProjectOverview />;
    case "tasks":
      return <TaskOverview />;
    case "my-budget":
      return <PlayerBudgetOverview />;
    case "members":
      return <MemberSummaryWidget />;
    case "budget":
      return <BudgetSummaryWidget />;
    case "reviews":
      return <ReviewSummaryWidget />;
    case "risks":
      return <RiskSummaryWidget />;
    case "reports":
      return <ReportSummaryWidget />;
    case "team-pipeline":
      return <ManagerTeamPipeline />;
    case "at-risk":
      return <ManagerAtRisk />;
    case "team-activity":
      return <ManagerTeamActivity />;
    case "calendar":
      return <CalendarWidget />;
    default:
      return null;
  }
}

// ─── 空の状態 ─────────────────────────────────────────────────────────────

function EmptyDashboard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300",
        compact ? "min-h-0 py-12" : "min-h-[500px]",
      )}
    >
      <div className={cn("relative group", compact ? "mb-4" : "mb-8")}>
        <>
          <img
            src="/src/assets/show-nin.svg"
            alt="show-nin"
            className={cn(
              "h-auto opacity-10 grayscale transition-opacity duration-300 group-hover:opacity-30 dark:hidden",
              compact ? "w-32" : "w-48",
            )}
          />
          <img
            src="/src/assets/show-nin-white.svg"
            alt="show-nin"
            className={cn(
              "h-auto opacity-10 grayscale transition-opacity duration-300 group-hover:opacity-30 hidden dark:block",
              compact ? "w-32" : "w-48",
            )}
          />
        </>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <h2
        className={cn(
          "font-bold text-foreground mb-3 tracking-tight",
          compact ? "text-base" : "text-xl",
        )}
      >
        ダッシュボードが未設定です
      </h2>
      <p
        className={cn(
          "text-muted-foreground leading-relaxed mb-8 font-medium",
          compact ? "text-[12px] max-w-md" : "text-sm max-w-lg",
        )}
      >
        右上の設定ボタン
        <span className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 rounded bg-muted text-primary align-middle">
          <LayoutDashboard className="w-3 h-3" />
          <span className="text-[10px] font-bold tracking-wider">レイアウト設定</span>
        </span>
        からパネルを配置しましょう
      </p>
    </div>
  );
}

// ─── レイアウトエンジン ─────────────────────────────────────────────────────

function DashboardContent({ config }: { config: LayoutConfig }) {
  const { columns, panels } = config;
  const [mobileTab, setMobileTab] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const activePanels = panels.slice(0, columns);
  const isAllEmpty = activePanels.every((p) => p === "empty" || !p);

  const w = (i: number) => activePanels[i] ?? "empty";

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="flex items-center gap-1.5 text-foreground hover:opacity-70 transition-opacity"
        >
          {isVisible ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
          <h1 className="text-lg font-bold">パネル</h1>
        </button>
        {isVisible && <DashboardLayoutSettings />}
      </div>

      {isVisible && (
        isAllEmpty ? (
          <EmptyDashboard />
        ) : (
          <>
      {/* モバイルビュー：1パネルならそのまま、複数ならタブ表示 */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        {activePanels.length > 1 && (
          <div className="flex border-b border-border/50 bg-muted/5 shrink-0 px-2 overflow-x-auto scrollbar-none">
            {activePanels.map((p, i) => (
              <button
                key={i}
                onClick={() => setMobileTab(i)}
                className={cn(
                  "flex-1 min-w-[80px] py-3.5 text-[10px] font-bold uppercase tracking-wider transition-colors truncate px-1",
                  mobileTab === i
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tabLabel[p]}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 min-h-0 p-4 flex flex-col">
          {WidgetPanel({ widget: activePanels[mobileTab] }) || (
            <EmptyDashboard compact />
          )}
        </div>
      </div>

      {/* デスクトップビュー：分割数に応じたグリッド表示 */}
      <div className="hidden md:flex flex-col flex-1 min-w-0 p-4 gap-4">
        {columns === 1 && (
          <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
            {WidgetPanel({ widget: w(0) })}
          </div>
        )}

        {columns === 2 && (
          <div className="flex flex-row flex-1 min-w-0 gap-4">
            <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
              {WidgetPanel({ widget: w(0) })}
            </div>
            <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
              {WidgetPanel({ widget: w(1) })}
            </div>
          </div>
        )}

        {columns === 3 && (
          <div className="flex flex-row flex-1 min-w-0 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40"
              >
                {WidgetPanel({ widget: w(i) })}
              </div>
            ))}
          </div>
        )}

        {columns === 4 && (
          <>
            <div className="flex flex-row flex-1 min-w-0 gap-4">
              <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
                {WidgetPanel({ widget: w(0) })}
              </div>
              <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
                {WidgetPanel({ widget: w(1) })}
              </div>
            </div>
            <div className="flex flex-row flex-1 min-w-0 gap-4">
              <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
                {WidgetPanel({ widget: w(2) })}
              </div>
              <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-muted/5 border border-dashed border-border/40">
                {WidgetPanel({ widget: w(3) })}
              </div>
            </div>
          </>
        )}
      </div>
          </>
        )
      )}
    </>
  );
}

// ─── Player / Manager ─────────────────────────────────────────────────────

function PlayerDashboard() {
  const { playerConfig } = useLayoutConfig();
  const [cardOrder, setCardOrder] = useState([1, 2, 3, 4, 5]);

  return (
    <div className="flex flex-col">
      <SummaryCards
        mode="player"
        cardOrder={cardOrder}
        onOrderChange={setCardOrder}
      />
      <DashboardContent config={playerConfig} />
    </div>
  );
}

function ManagerDashboard() {
  const { managerConfig } = useLayoutConfig();
  const [cardOrder, setCardOrder] = useState([6, 7, 8, 9, 10]);

  return (
    <div className="flex flex-col">
      <SummaryCards
        mode="manager"
        cardOrder={cardOrder}
        onOrderChange={setCardOrder}
      />
      <DashboardContent config={managerConfig} />
    </div>
  );
}

// ─── ルーター ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser, activeMode } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const effectiveMode: ActiveMode =
    currentUser.role === "manager"
      ? "manager"
      : currentUser.role === "dual"
        ? activeMode
        : "player";

  return (
    <PageLayout>
      {effectiveMode === "manager" ? <ManagerDashboard /> : <PlayerDashboard />}
    </PageLayout>
  );
}
