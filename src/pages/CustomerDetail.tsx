import { useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PanelRightClose,
  PanelRightOpen,
  Building,
  User,
  Calendar,
  FileText,
  Clock,
  Edit,
  Plus,
  Briefcase,
  Check,
  Mic,
  ChevronRight,
  Users,
  MapPin,
  Phone,
  Globe,
  CheckSquare,
  ArrowLeft,
  ExternalLink,
  Info,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { useDataStore } from "../context/DataStoreContext";
import { useGlobalDialog } from "../context/GlobalDialogContext";
import CustomerDialogForm from "@/components/customers/CustomerDialogForm";
import ActivityTypeIcon from "../components/dashboard/widgets/ActivityTypeIcon";
import {
  RankBadge,
  StatusBadge,
} from "../components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mockAudioMinutes } from "../data/mock";

type Tab = "projects" | "details" | "profile";

const tabs: { id: Tab; label: string }[] = [
  { id: "projects", label: "案件一覧" },
  { id: "details", label: "活動・タスク" },
  { id: "profile", label: "企業概要" },
];

const priorityLabel: Record<number, string> = {
  1: "高",
  2: "中",
  3: "低",
};

const priorityColor: Record<number, string> = {
  1: "bg-destructive/10 text-destructive",
  2: "bg-yellow-500/10 text-yellow-600",
  3: "bg-muted text-muted-foreground",
};

const sourceColor: Record<string, string> = {
  recording: "bg-primary/10 text-primary",
  manual: "bg-emerald-500/10 text-emerald-600",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function openDetailWindow(id: string) {
  const width = 860;
  const height = 820;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + 40);
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
  const popup = window.open(`/minutes/${id}`, `minute_${id}`, features);
  if (popup) popup.focus();
  else window.open(`/minutes/${id}`, "_blank");
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    customers,
    projects: allProjects,
    activities: allActivities,
    tasks: allTasks,
    profiles,
    updateTask,
    updateCustomer,
  } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  // 案件フィルター & 選択状態
  const [projectFilter, setProjectFilter] = useState<
    "active" | "closed" | "all"
  >("active");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    "all",
  );

  // 詳細タブ & タスクサブフィルター
  const [detailsTab, setDetailsTab] = useState<
    "activities" | "minutes" | "tasks"
  >("activities");
  const [taskFilter, setTaskFilter] = useState<
    "incomplete" | "completed" | "all"
  >("incomplete");

  // タスク完了アニメーションステート
  const [completingTaskIds, setCompletingTaskIds] = useState<string[]>([]);

  const handleCompleteTask = (taskId: string, currentCompleted: boolean) => {
    if (completingTaskIds.includes(taskId)) return;
    setCompletingTaskIds((prev) => [...prev, taskId]);
    setTimeout(() => {
      updateTask(taskId, {
        is_completed: !currentCompleted,
        progress_percent: !currentCompleted ? 100 : 0,
      });
      setCompletingTaskIds((prev) => prev.filter((id) => id !== taskId));
    }, 600);
  };

  const customer = customers.find((c) => c.id === id);

  const handleOpenEditCustomerDialog = () => {
    if (!customer) return;
    const formId = "customer-edit-form";

    openDialog({
      mode: "edit",
      eyebrow: "顧客",
      breadcrumbs: ["編集"],
      title: "顧客を編集",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <CustomerDialogForm
          formId={formId}
          submitLabel="変更を保存"
          initialValues={{
            name: customer.name,
            industry: customer.industry,
            rank: customer.rank,
            is_pinned: customer.is_pinned,
            address: customer.address,
            phone: customer.phone,
            website: customer.website,
            employee_count: customer.employee_count,
            labels: customer.labels,
            acquisition_source: customer.acquisition_source,
            note: customer.note,
          }}
          onSubmit={(values) => {
            updateCustomer(customer.id, values);
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={formId} variant="primary">
            変更を保存
          </Button>
        </>
      ),
    });
  };

  if (!customer) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full text-muted-foreground bg-background font-medium">
          <Card className="p-8 text-center max-w-md mx-auto border-border shadow-sm">
            <p className="text-base font-bold text-foreground mb-2">
              顧客が見つかりません
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              指定されたIDの顧客データが存在しないか、削除されました。
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/customers")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> 顧客一覧へ戻る
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const customerProjects = allProjects.filter((p) => p.customer_id === id);
  const filteredProjects = customerProjects.filter((p) => {
    if (projectFilter === "active") return p.status !== "closed";
    if (projectFilter === "closed") return p.status === "closed";
    return true;
  });

  const isValidSelectedProject =
    selectedProjectId === "all" ||
    customerProjects.some((p) => p.id === selectedProjectId);
  const effectiveProjectId = isValidSelectedProject ? selectedProjectId : "all";

  const activities = allActivities
    .filter(
      (a) =>
        a.customer_id === id &&
        (effectiveProjectId === "all" || a.project_id === effectiveProjectId),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const audioMinutes = mockAudioMinutes
    .filter(
      (m) =>
        m.customer_id === id &&
        (effectiveProjectId === "all" || m.project_id === effectiveProjectId),
    )
    .sort(
      (a, b) =>
        new Date(b.recording_date).getTime() -
        new Date(a.recording_date).getTime(),
    );

  const allCustomerTasks = allTasks.filter(
    (t) =>
      t.customer_id === id &&
      (effectiveProjectId === "all" || t.project_id === effectiveProjectId),
  );

  const tasks = allCustomerTasks.filter((t) => {
    if (taskFilter === "incomplete") return !t.is_completed;
    if (taskFilter === "completed") return t.is_completed;
    return true;
  });

  const owner = profiles.find((p) => p.id === customer.created_by);

  // ─── 右パネル：企業概要コンテンツ ────────────────────────────────────────────────

  const renderProfileContent = (panelAction?: ReactNode) => (
    <div className="px-4 py-5 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-primary" /> 企業概要
        </p>
        {panelAction}
      </div>

      {/* ラベル・獲得経路 */}
      <div className="flex flex-col gap-2">
        {customer.acquisition_source && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 dark:bg-muted/10 p-2.5 rounded-xl border border-border/50 font-medium">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              流入経路:
            </span>
            <span className="text-foreground font-semibold">
              {customer.acquisition_source}
            </span>
          </div>
        )}
        {customer.labels && customer.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {customer.labels.map((lbl, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs px-2.5 py-1 font-medium bg-primary/10 text-primary border border-primary/20 shadow-2xs"
              >
                {lbl}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        {customer.employee_count && (
          <div className="flex flex-col gap-1 bg-muted/30 dark:bg-muted/10 p-3 rounded-xl border border-border/50">
            <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary/80" /> 従業員数
            </dt>
            <dd className="text-foreground font-semibold text-xs pl-5">
              {customer.employee_count.toLocaleString()}名
            </dd>
          </div>
        )}
        {customer.address && (
          <div className="flex flex-col gap-1 bg-muted/30 dark:bg-muted/10 p-3 rounded-xl border border-border/50">
            <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary/80" /> 所在地
            </dt>
            <dd className="text-foreground text-xs leading-relaxed pl-5">
              {customer.address}
            </dd>
          </div>
        )}
        {customer.phone && (
          <div className="flex flex-col gap-1 bg-muted/30 dark:bg-muted/10 p-3 rounded-xl border border-border/50">
            <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary/80" /> 電話番号
            </dt>
            <dd className="text-foreground font-semibold text-xs pl-5">
              {customer.phone}
            </dd>
          </div>
        )}
        {customer.website && (
          <div className="flex flex-col gap-1 bg-muted/30 dark:bg-muted/10 p-3 rounded-xl border border-border/50">
            <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary/80" /> Webサイト
            </dt>
            <dd className="text-primary text-xs break-all hover:underline cursor-pointer pl-5 font-medium">
              {customer.website}
            </dd>
          </div>
        )}
      </dl>

      {customer.note && (
        <div className="pt-5 border-t border-border/60 flex flex-col gap-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" /> メモ
          </p>
          <Card className="p-3.5 bg-muted/40 dark:bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground/90 leading-relaxed shadow-none py-3.5">
            {customer.note}
          </Card>
        </div>
      )}

      <div className="pt-5 border-t border-border/60 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary" /> 名刺情報
        </p>
        <div className="flex flex-col gap-3">
          {[
            {
              name: "山田 智",
              dept: "DX推進室 室長",
              email: "yamada@example.com",
            },
            {
              name: "佐々木 誠",
              dept: "情報システム部",
              email: "sasaki@example.com",
            },
          ].map((card, i) => (
            <Card
              key={i}
              className="p-3.5 bg-muted/30 dark:bg-muted/10 border border-border/60 rounded-xl text-xs hover:bg-muted/50 dark:hover:bg-muted/20 transition-all cursor-pointer shadow-none hover:shadow-sm py-3.5 gap-1.5"
            >
              <p className="font-bold text-foreground text-sm">{card.name}</p>
              <p className="text-muted-foreground text-[11px] font-medium">
                {card.dept}
              </p>
              <p className="text-primary font-medium text-[11px] mt-1 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> {card.email}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfileContent = renderProfileContent();

  // ─── 左パネル：案件・活動フィルターコンテンツ ────────────────────────────────────────────────

  const ProjectsContent = (
    <div className="px-4 py-5 bg-background min-h-full flex flex-col">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center shadow-2xs shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>案件・活動フィルター</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground/60 hover:text-primary transition-colors cursor-help outline-none p-0.5 rounded"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="w-64 p-3 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs text-foreground/90 leading-relaxed animate-in zoom-in-95 duration-200 z-50"
                >
                  <p>案件を選択して中央パネルの履歴やタスクを絞り込めます</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground border-0 shadow-none"
        >
          {customerProjects.length} 案件
        </Badge>
      </div>

      {/* 進行中 / 完了 / すべて のセグメントコントロール */}
      <div className="flex bg-muted/40 dark:bg-muted/20 p-1 rounded-xl mb-4 border border-border/50 shadow-2xs">
        {(["active", "closed", "all"] as const).map((filter) => {
          const label =
            filter === "active"
              ? "進行中"
              : filter === "closed"
                ? "完了"
                : "すべて";
          const count = customerProjects.filter((p) =>
            filter === "active"
              ? p.status !== "closed"
              : filter === "closed"
                ? p.status === "closed"
                : true,
          ).length;
          const isActive = projectFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setProjectFilter(filter)}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5",
                isActive
                  ? "bg-background text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-semibold leading-none",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/15 text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {/* すべての案件・全社活動 カード */}
        <Card
          onClick={() => setSelectedProjectId("all")}
          className={cn(
            "p-4 rounded-xl text-left transition-all duration-200 cursor-pointer relative shadow-sm hover:shadow-md py-4 gap-3",
            selectedProjectId === "all"
              ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
              : "border-border bg-card hover:border-primary/30 hover:bg-accent/5",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate leading-snug">
                  すべての案件・全社活動
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  顧客全体に紐づくすべての履歴を表示
                </p>
              </div>
            </div>
            {selectedProjectId === "all" && (
              <ChevronRight className="w-4 h-4 text-primary shrink-0 animate-in fade-in duration-200" />
            )}
          </div>
        </Card>

        {/* 案件リスト */}
        {filteredProjects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          const projOwner =
            profiles.find((p) => p.id === proj.user_id)?.name ?? "未設定";
          const source = proj.source ?? "manual";

          return (
            <Card
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={cn(
                "p-4 rounded-xl text-left transition-all duration-200 cursor-pointer relative shadow-sm hover:shadow-md py-4 gap-3 flex flex-col justify-between",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:bg-accent/5",
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-foreground truncate flex-1 leading-snug">
                    {proj.name}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={proj.status} />
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-primary shrink-0 animate-in fade-in duration-200" />
                    )}
                  </div>
                </div>

                {/* ラベル・優先度・登録元バッジ */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {proj.priority && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0.5 font-bold border-0",
                        priorityColor[proj.priority],
                      )}
                    >
                      優先度 {priorityLabel[proj.priority]}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-bold border-0",
                      sourceColor[source],
                    )}
                  >
                    {source === "recording" ? "🎙 音声録音" : "✍️ 手動登録"}
                  </Badge>
                  {proj.labels?.map((lbl, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 font-medium bg-muted text-muted-foreground border-0"
                    >
                      {lbl}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground flex-wrap font-medium mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                    <span className="text-foreground/90">{projOwner}</span>
                  </span>
                  <span className="text-foreground font-semibold ml-auto bg-muted px-2 py-0.5 rounded-md">
                    {(proj.amount / 10000).toLocaleString()}万円
                  </span>
                </div>

                {proj.next_action_date && (
                  <div className="mb-3 bg-primary/10 text-primary px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>アクション予定日: {proj.next_action_date}</span>
                  </div>
                )}
              </div>

              {/* 案件詳細へリダイレクトするボタン (ユーザー要望) */}
              <div className="pt-3 border-t border-border/60 flex justify-end items-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/projects?search=${encodeURIComponent(proj.name)}`,
                    );
                  }}
                  className="h-8 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 px-2.5 transition-colors"
                >
                  <span>案件詳細へ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}

        {filteredProjects.length === 0 && (
          <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-8">
            <p className="text-xs text-muted-foreground font-medium">
              該当する案件はありません
            </p>
          </Card>
        )}
      </div>
    </div>
  );

  // ─── 中央パネル：活動・タスク・議事録コンテンツ ────────────────────────────────────────────────

  const ProjectDetailsContent = (
    <div className="min-h-full flex flex-col bg-background">
      {/* タブヘッダー */}
      <div
        className={cn(
          "pt-3 md:pt-2 border-b border-border/60 flex items-end justify-between shrink-0 bg-card/90 backdrop-blur-md sticky top-0 z-10 shadow-2xs transition-all duration-200",
          isProfilePanelOpen ? "px-3 md:px-4 gap-1.5" : "px-4 gap-3 md:gap-4",
        )}
      >
        {/* モバイル用ドロップダウン (md:hidden) */}
        <div className="md:hidden flex-1 max-w-[180px] pb-2.5">
          <Select
            value={detailsTab}
            onValueChange={(val: any) => setDetailsTab(val)}
          >
            <SelectTrigger className="h-9 bg-muted/40 font-bold shadow-2xs border-border/50 text-xs">
              <SelectValue placeholder="表示切替" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activities" className="text-xs font-bold">
                <div className="flex items-center justify-between w-full min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>活動履歴</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {activities.length}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="minutes" className="text-xs font-bold">
                <div className="flex items-center justify-between w-full min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    <span>音声議事録</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {audioMinutes.length}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="tasks" className="text-xs font-bold">
                <div className="flex items-center justify-between w-full min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    <span>タスク</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {allCustomerTasks.length}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* デスクトップ用タブリスト (hidden md:flex) */}
        <div className="hidden md:flex items-end gap-1 md:gap-1.5 overflow-hidden -mb-px">
          <button
            onClick={() => setDetailsTab("activities")}
            className={cn(
              "flex items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-bold tracking-wide transition-colors whitespace-nowrap",
              isProfilePanelOpen ? "px-2" : "px-2.5 md:px-3",
              detailsTab === "activities"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span
              className={cn(
                isProfilePanelOpen ? "hidden xl:inline" : "hidden md:inline",
              )}
            >
              活動履歴
            </span>
            <span
              className={cn(
                isProfilePanelOpen ? "inline xl:hidden" : "inline md:hidden",
              )}
            >
              活動
            </span>
            <Badge
              variant="secondary"
              className="min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none bg-muted-foreground/15 text-muted-foreground border-0 shadow-none"
            >
              {activities.length}
            </Badge>
          </button>

          <button
            onClick={() => setDetailsTab("minutes")}
            className={cn(
              "flex items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-bold tracking-wide transition-colors whitespace-nowrap",
              isProfilePanelOpen ? "px-2" : "px-2.5 md:px-3",
              detailsTab === "minutes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span
              className={cn(
                isProfilePanelOpen ? "hidden xl:inline" : "hidden md:inline",
              )}
            >
              音声議事録
            </span>
            <span
              className={cn(
                isProfilePanelOpen ? "inline xl:hidden" : "inline md:hidden",
              )}
            >
              議事録
            </span>
            <Badge
              variant="secondary"
              className="min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none bg-muted-foreground/15 text-muted-foreground border-0 shadow-none"
            >
              {audioMinutes.length}
            </Badge>
          </button>

          <button
            onClick={() => setDetailsTab("tasks")}
            className={cn(
              "flex items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-bold tracking-wide transition-colors whitespace-nowrap",
              isProfilePanelOpen ? "px-2" : "px-2.5 md:px-3",
              detailsTab === "tasks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
            <span>タスク</span>
            <Badge
              variant={
                allCustomerTasks.some(
                  (t) => !t.is_completed && new Date(t.due_date) < new Date(),
                )
                  ? "destructive"
                  : "secondary"
              }
              className="min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none border-0 shadow-none"
            >
              {allCustomerTasks.length}
            </Badge>
          </button>
        </div>

        {/* タブに応じたアクションボタン */}
        <div className="shrink-0 pb-2.5 flex items-center">
          <TooltipProvider delayDuration={200}>
            {detailsTab === "activities" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 md:w-8 px-3 md:px-0 md:justify-center gap-1.5 shrink-0 shadow-sm rounded-md md:rounded-full"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="md:hidden text-xs">記録</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="hidden md:block px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-full text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
                >
                  活動を記録
                </TooltipContent>
              </Tooltip>
            )}
            {detailsTab === "minutes" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/recording")}
                    className="h-8 md:w-8 px-3 md:px-0 md:justify-center gap-1.5 shrink-0 shadow-sm rounded-md md:rounded-full"
                  >
                    <Mic className="w-4 h-4 shrink-0" />
                    <span className="md:hidden text-xs">録音</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="hidden md:block px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
                >
                  音声録音を開始
                </TooltipContent>
              </Tooltip>
            )}
            {detailsTab === "tasks" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 md:w-8 px-3 md:px-0 md:justify-center gap-1.5 shrink-0 shadow-sm rounded-md md:rounded-full"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="md:hidden text-xs">追加</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="hidden md:block px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
                >
                  タスク追加
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* タブコンテンツエリア */}
      <div className="flex-1 px-4 py-5">
        {detailsTab === "activities" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200 outline-none">
            {activities.map((act) => {
              const actProject = allProjects.find(
                (p) => p.id === act.project_id,
              );

              return (
                <Card
                  key={act.id}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header: Icon, Title, Date, Details Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 shrink-0">
                          <ActivityTypeIcon type={act.type} className="w-4 h-4 text-primary" />
                        </span>
                        <h4 className="text-sm font-bold text-foreground leading-snug truncate">
                          {act.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />{" "}
                          {formatDate(act.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reports/${act.id}`)}
                          className="h-7 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 px-2 transition-colors shrink-0"
                        >
                          <span>詳細</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Combined Metadata Row */}
                    {(actProject || act.audio_url) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {actProject && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-muted text-muted-foreground font-medium border-0 px-2 py-0.5"
                          >
                            案件: {actProject.name}
                          </Badge>
                        )}
                        {act.audio_url && (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 shadow-2xs px-2 py-0.5"
                          >
                            <Mic className="w-3 h-3" /> 音声あり
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Summary text */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {act.content_json.summary}
                    </p>
                  </div>
                </Card>
              );
            })}

            {activities.length === 0 && (
              <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-8">
                <p className="text-sm font-bold text-foreground/70 mb-1">
                  活動履歴がありません
                </p>
                <p className="text-xs text-muted-foreground">
                  この条件に一致する活動履歴はまだ記録されていません。
                </p>
              </Card>
            )}
          </div>
        )}

        {detailsTab === "minutes" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200 outline-none">
            {audioMinutes.map((m) => {
              const minProject = allProjects.find((p) => p.id === m.project_id);
              const doneCount = m.checklist.filter((c) => c.checked).length;

              return (
                <Card
                  key={m.id}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header: Icon, Title, Date, Details Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 shrink-0">
                          <Mic className="w-4 h-4 text-primary" />
                        </span>
                        <h4 className="text-sm font-bold text-foreground leading-snug truncate">
                          {m.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {m.recording_date}{" "}
                          ({m.start_time}〜{m.end_time})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailWindow(m.id)}
                          className="h-7 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 px-2 transition-colors shrink-0"
                        >
                          <span>詳細</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Combined Metadata Row */}
                    {(minProject || m.checklist.length > 0) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {minProject && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-muted text-muted-foreground font-medium border-0 px-2 py-0.5"
                          >
                            案件: {minProject.name}
                          </Badge>
                        )}
                        {m.checklist.length > 0 && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-[10px] font-medium border-border px-2 py-0.5"
                          >
                            <CheckSquare className="w-3 h-3 text-primary" />{" "}
                            チェックリスト {doneCount}/{m.checklist.length} 完了
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Summary text */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {m.summary}
                    </p>
                  </div>
                </Card>
              );
            })}

            {audioMinutes.length === 0 && (
              <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-8">
                <p className="text-sm font-bold text-foreground/70 mb-1">
                  音声議事録がありません
                </p>
                <p className="text-xs text-muted-foreground">
                  この条件に一致する音声議事録はまだ記録されていません。
                </p>
              </Card>
            )}
          </div>
        )}

        {detailsTab === "tasks" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200 outline-none">
            {/* 未完了 / 完了 / すべて のサブフィルター */}
            <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-1.5 rounded-xl border border-border/50 mb-2">
              <div className="flex gap-1">
                {(["incomplete", "completed", "all"] as const).map((filter) => {
                  const label =
                    filter === "incomplete"
                      ? "未完了"
                      : filter === "completed"
                        ? "完了済み"
                        : "すべて";
                  const count = allCustomerTasks.filter((t) =>
                    filter === "incomplete"
                      ? !t.is_completed
                      : filter === "completed"
                        ? t.is_completed
                        : true,
                  ).length;
                  const isActive = taskFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setTaskFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5",
                        isActive
                          ? "bg-background text-foreground shadow-2xs border border-border/50"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-full font-semibold leading-none",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted-foreground/15 text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* タスクボードへリダイレクトするボタン (ユーザー要望) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/tasks")}
                className="h-8 text-xs font-bold text-primary hover:bg-primary/10 gap-1.5 px-3 shadow-2xs border border-primary/20 bg-primary/5"
              >
                <span>タスクボードを開く</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* タスクリスト */}
            {tasks.map((task) => {
              const isOverdue =
                !task.is_completed && new Date(task.due_date) < new Date();
              const isCompleting = completingTaskIds.includes(task.id);
              const taskProject = allProjects.find(
                (p) => p.id === task.project_id,
              );

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "group p-4 rounded-xl border shadow-sm flex flex-col gap-2.5 transition-all duration-500 hover:shadow-md text-left",
                    isCompleting
                      ? "opacity-40 scale-[0.98] bg-muted/40 border-primary/40"
                      : isOverdue
                        ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
                        : "border-border bg-card hover:border-primary/30 hover:bg-accent/5",
                  )}
                >
                  {/* Header: Checkbox + Title on the left, Date + Details Button on the right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div
                        onClick={() =>
                          handleCompleteTask(task.id, task.is_completed)
                        }
                        className={cn(
                          "w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all duration-300 shadow-2xs cursor-pointer",
                          task.is_completed || isCompleting
                            ? "bg-primary border-primary text-primary-foreground scale-110"
                            : isOverdue
                              ? "border-destructive text-destructive bg-background"
                              : "border-muted-foreground/50 hover:border-primary bg-background",
                        )}
                      >
                        {(task.is_completed || isCompleting) && (
                          <Check className="w-3.5 h-3.5 text-background stroke-3 animate-in zoom-in duration-200" />
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm font-bold leading-snug transition-all duration-500 truncate",
                          task.is_completed || isCompleting
                            ? "line-through text-muted-foreground"
                            : "text-foreground/90",
                        )}
                      >
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] font-medium flex items-center gap-1",
                          isOverdue && !task.is_completed && !isCompleting
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        <Calendar className="w-3.5 h-3.5" /> 期限: {task.due_date}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/tasks")}
                        className="h-7 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 px-2 transition-colors shrink-0"
                      >
                        <span>詳細</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  {(taskProject || (isOverdue && !task.is_completed && !isCompleting) || task.progress_updated_at) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {taskProject && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-muted text-muted-foreground font-medium border-0 px-2 py-0.5"
                        >
                          案件: {taskProject.name}
                        </Badge>
                      )}
                      {isOverdue && !task.is_completed && !isCompleting && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider"
                        >
                          期限切れ
                        </Badge>
                      )}
                      {task.progress_updated_at && (
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 進捗更新: {task.progress_updated_at}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tightened Progress Bar */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground w-12 shrink-0">
                      進捗 {task.progress_percent ?? (task.is_completed ? 100 : 0)}%
                    </span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          task.is_completed ||
                            (task.progress_percent ?? 0) === 100
                            ? "bg-emerald-500"
                            : "bg-primary",
                        )}
                        style={{
                          width: `${task.progress_percent ?? (task.is_completed ? 100 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}

            {tasks.length === 0 && (
              <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-8">
                <p className="text-sm font-bold text-foreground/70 mb-1">
                  該当するタスクはありません
                </p>
                <p className="text-xs text-muted-foreground">
                  この条件に一致するタスクは存在しません。
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        {/* 顧客ヘッダー */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 md:py-5 shrink-0 shadow-sm z-20 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground h-9 w-9 rounded-full bg-muted/40 hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 pt-0.5 flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    {customer.name}
                  </h1>
                  <RankBadge rank={customer.rank} size="lg" />
                  <Badge
                    variant="secondary"
                    className="font-medium text-secondary-foreground text-xs px-2.5 py-1"
                  >
                    {customer.industry}
                  </Badge>
                  {customer.is_pinned && (
                    <Badge
                      variant="default"
                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium text-xs px-2.5 py-1 shadow-2xs"
                    >
                      📌 ピン留め済み
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-medium">
                  {owner && (
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      <User className="w-3.5 h-3.5 text-primary" /> 担当:{" "}
                      <span className="font-bold text-foreground">
                        {owner.name}
                      </span>
                    </span>
                  )}
                  <span className="hidden sm:inline text-border">|</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />{" "}
                    最終アクセス: {formatDate(customer.last_accessed_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 hidden md:flex items-center gap-2.5 pt-1">
              <Button
                variant="secondary"
                size="md"
                onClick={handleOpenEditCustomerDialog}
                className="gap-1.5 font-bold shadow-sm"
              >
                <Edit className="w-4.5 h-4.5" /> 編集
              </Button>
              <Button
                variant="primary"
                size="md"
                className="gap-1.5 font-bold shadow-sm"
              >
                <Plus className="w-4.5 h-4.5" /> 活動を記録
              </Button>
            </div>
          </div>

          {/* モバイル用アクションボタン */}
          <div className="flex md:hidden items-center gap-2 mt-4 pt-4 border-t border-border/60 justify-end relative z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenEditCustomerDialog}
              className="flex-1 gap-1.5 font-bold shadow-2xs justify-center"
            >
              <Edit className="w-4 h-4" /> 編集
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1 gap-1.5 font-bold shadow-2xs justify-center"
            >
              <Plus className="w-4 h-4" /> 活動を記録
            </Button>
          </div>
        </div>

        {/* モバイルタブバー */}
        <div className="md:hidden flex border-b border-border bg-muted/5 shrink-0 px-2 overflow-x-auto scrollbar-none z-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-w-[80px] py-3.5 text-xs font-bold tracking-wider transition-colors truncate px-2 text-center border-b-2",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* モバイル：タブに対応した単一カラム */}
        <div className="md:hidden flex-1 overflow-y-auto bg-background/50">
          {activeTab === "projects" && ProjectsContent}
          {activeTab === "details" && ProjectDetailsContent}
          {activeTab === "profile" && ProfileContent}
        </div>

        {/* デスクトップ：3カラムレイアウト */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-muted/10 dark:bg-background">
          <div className="min-w-0 flex-[0.9_1_18rem] lg:flex-[0.95_1_20rem] border-r border-border overflow-y-auto bg-muted/5 dark:bg-muted/5">
            {ProjectsContent}
          </div>
          <div className="min-w-0 flex-[1.1_1_20rem] lg:flex-[1.15_1_28rem] overflow-y-auto border-r border-border bg-background">
            {ProjectDetailsContent}
          </div>
          <div
            className={cn(
              "shrink-0 bg-card border-l border-border overflow-hidden shadow-sm z-10 transition-[width] duration-200",
              isProfilePanelOpen ? "w-72" : "w-13",
            )}
          >
            {isProfilePanelOpen ? (
              <div className="h-full overflow-y-auto bg-card">
                {renderProfileContent(
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsProfilePanelOpen(false)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                    title="企業概要を閉じる"
                    aria-label="企業概要を閉じる"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>,
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center bg-card py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfilePanelOpen(true)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted shadow-2xs border border-border/50"
                  title="企業概要を開く"
                  aria-label="企業概要を開く"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
                <span className="mt-6 [writing-mode:vertical-rl] text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  企業概要
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
