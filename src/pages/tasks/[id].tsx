import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Flag,
  Hash,
  Plus,
  Trash2,
  User,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import TaskDialogForm from "@/components/tasks/TaskDialogForm";
import type { Task } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsContents,
} from "@/components/ui/motion-tabs";
import { cn } from "@/lib/utils";

type TaskStatus = "not_started" | "in_progress" | "completed" | "overdue";
type Priority = "High" | "Middle" | "Low";
type MobileTab = "record" | "related";

interface TaskDetailView {
  id: string;
  title: string;
  customerId: string | null;
  customer: string;
  projectId: string | null;
  project: string;
  status: TaskStatus;
  priority: Priority;
  ownerId: string;
  owner: string;
  dueDate: string;
  isCompleted: boolean;
  progressPercent: number;
  progressUpdatedAt?: string;
}

const progressOptions = Array.from({ length: 11 }, (_, index) => index * 10);

const mobileTabs: { id: MobileTab; label: string }[] = [
  { id: "record", label: "詳細" },
  { id: "related", label: "関連" },
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDueDateWithRemaining(date: string) {
  const today = new Date(`${todayString()}T00:00:00`).getTime();
  const due = new Date(`${date}T00:00:00`).getTime();
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays === 0) return `${formatDate(date)}（本日まで）`;
  if (diffDays > 0) return `${formatDate(date)}（残り${diffDays}日）`;
  return `${formatDate(date)}（期限超過${Math.abs(diffDays)}日）`;
}

function daysUntilDue(date: string) {
  const today = new Date(`${todayString()}T00:00:00`).getTime();
  const due = new Date(`${date}T00:00:00`).getTime();
  return Math.round((due - today) / 86400000);
}

function dueDateTone(date: string, status: TaskStatus) {
  const diffDays = daysUntilDue(date);
  return status === "overdue" || (status === "in_progress" && diffDays <= 5)
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-primary/30 bg-primary/10 text-primary";
}

function buildTaskDescription(task: TaskDetailView) {
  return `${task.customer}の${task.project}に関するタスクです。${task.owner}が担当し、${formatDueDateWithRemaining(task.dueDate)}を期限として進捗を管理します。`;
}

function deriveStatus(task: Task, progress: number): TaskStatus {
  if (task.is_completed || progress === 100) return "completed";
  if (task.due_date < todayString()) return "overdue";
  if (progress > 0) return "in_progress";
  return "not_started";
}

function derivePriority(projectPriority?: number): Priority {
  if (projectPriority === 1) return "High";
  if (projectPriority === 3) return "Low";
  return "Middle";
}

function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    High: "高",
    high: "高",
    higt: "高",
    Middle: "中",
    middle: "中",
    Medium: "中",
    medium: "中",
    Low: "低",
    low: "低",
  };

  return labels[priority] ?? priority;
}

function statusLabel(status: TaskStatus, dueDate?: string) {
  if (status === "in_progress" && dueDate) {
    const diffDays = daysUntilDue(dueDate);
    return diffDays >= 0
      ? `実行中（残り${diffDays}日）`
      : `実行中（期限超過${Math.abs(diffDays)}日）`;
  }

  return {
    not_started: "未処理",
    in_progress: "実行中",
    completed: "完了",
    overdue: "期限超過",
  }[status];
}

function statusTone(status: TaskStatus, dueDate?: string) {
  const isInProgressDueSoon =
    status === "in_progress" && dueDate !== undefined && daysUntilDue(dueDate) <= 5;

  return cn(
    "border px-2.5 py-1 text-xs font-bold shadow-2xs",
    status === "completed" &&
      "border-primary/20 bg-primary/10 text-primary",
    status === "overdue" || isInProgressDueSoon
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : "",
    (status === "not_started" || (status === "in_progress" && !isInProgressDueSoon)) &&
      "border-border bg-background text-foreground",
  );
}

function priorityTone(priority: Priority) {
  return cn(
    "border-0 px-2.5 py-0.5 text-[11px] font-bold",
    priority === "High" && "bg-destructive/10 text-destructive",
    priority === "Middle" && "bg-amber-500/10 text-amber-600",
    priority === "Low" && "bg-muted text-muted-foreground",
  );
}

function buildTaskView(
  task: Task,
  customers: ReturnType<typeof useDataStore>["customers"],
  projects: ReturnType<typeof useDataStore>["projects"],
  profiles: ReturnType<typeof useDataStore>["profiles"],
): TaskDetailView {
  const customer = customers.find((item) => item.id === task.customer_id);
  const project =
    projects.find((item) => item.id === task.project_id) ??
    projects.find((item) => item.customer_id === task.customer_id);
  const owner = profiles.find((profile) => profile.id === task.user_id);
  const progressPercent = task.progress_percent ?? (task.is_completed ? 100 : 0);

  return {
    id: task.id,
    title: task.title.replace(/^.+?：/, ""),
    customerId: task.customer_id,
    customer: customer?.name ?? "未設定",
    projectId: project?.id ?? null,
    project: project?.name ?? "未設定",
    status: deriveStatus(task, progressPercent),
    priority: derivePriority(project?.priority),
    ownerId: task.user_id,
    owner: owner?.name ?? "未担当",
    dueDate: task.due_date,
    isCompleted: task.is_completed || progressPercent === 100,
    progressPercent,
    progressUpdatedAt: task.progress_updated_at,
  };
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background px-3 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
        <div className="mt-1 min-w-0 text-sm font-semibold text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, customers, projects, profiles, addTask, updateTask, deleteTask } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();
  const [activeTab, setActiveTab] = useState<MobileTab>("record");
  const [isMobileHeaderCompact, setIsMobileHeaderCompact] = useState(false);
  const [selection, setSelection] = useState(() => ({
    baseId: id ?? "",
    selectedId: id ?? "",
  }));
  const taskTabSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const task = tasks.find((item) => item.id === id);
  const selectedTaskId = selection.baseId === (id ?? "") ? selection.selectedId : (id ?? "");
  const selectedTask = tasks.find((item) => item.id === selectedTaskId) ?? task;

  const handleSelectRelatedTask = (taskId: string) => {
    setSelection({ baseId: id ?? "", selectedId: taskId });

    if (taskTabSwitchTimeoutRef.current) {
      clearTimeout(taskTabSwitchTimeoutRef.current);
    }

    taskTabSwitchTimeoutRef.current = setTimeout(() => {
      setActiveTab("record");
      taskTabSwitchTimeoutRef.current = null;
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (taskTabSwitchTimeoutRef.current) {
        clearTimeout(taskTabSwitchTimeoutRef.current);
      }
    };
  }, []);

  const handleMobileContentScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollElement = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollableDistance = scrollHeight - clientHeight;

    setIsMobileHeaderCompact((current) => {
      if (current) return scrollTop > 8;
      if (scrollableDistance < 160) return false;
      return scrollTop > 64;
    });
  };

  const taskView = useMemo(() => {
    if (!selectedTask) return null;
    return buildTaskView(selectedTask, customers, projects, profiles);
  }, [customers, profiles, projects, selectedTask]);

  const relatedTasks = useMemo(() => {
    if (!task) return [];
    const related = tasks
      .filter(
        (item) =>
          item.id === task.id ||
          (item.id !== task.id &&
            (item.customer_id === task.customer_id ||
            (task.project_id && item.project_id === task.project_id))),
      )
      .map((item) => buildTaskView(item, customers, projects, profiles))
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 8);
    return related;
  }, [customers, profiles, projects, task, tasks]);

  if (!task || !selectedTask || !taskView) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center bg-background text-muted-foreground">
          <Card className="mx-auto max-w-md border-border p-8 text-center shadow-sm">
            <p className="mb-2 text-base font-bold text-foreground">
              タスクが見つかりません
            </p>
            <p className="mb-6 text-xs text-muted-foreground">
              指定されたIDのタスクデータが存在しないか、削除されています。
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate("/tasks")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              タスク一覧へ戻る
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isOverdue = taskView.status === "overdue";
  const progressTone = taskView.isCompleted
    ? "bg-emerald-500"
    : isOverdue
      ? "bg-destructive"
      : "bg-primary";

  const handleProgressChange = (value: number) => {
    updateTask(taskView.id, {
      progress_percent: value,
      is_completed: value === 100,
    } satisfies Partial<Task>);
  };

  const handleOpenAddTaskDialog = () => {
    const formId = "task-detail-add-form";

    openDialog({
      mode: "add",
      eyebrow: "タスク",
      breadcrumbs: ["新規作成"],
      title: "タスクを追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <TaskDialogForm
          formId={formId}
          submitLabel="タスクを追加"
          initialValues={{
            customer_id: taskView.customerId ?? undefined,
            project_id: taskView.projectId,
            user_id: taskView.ownerId,
            due_date: todayString(),
          }}
          onSubmit={(values) => {
            const newTask = addTask(values);
            setSelection({ baseId: id ?? "", selectedId: newTask.id });
            setActiveTab("record");
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
            タスクを追加
          </Button>
        </>
      ),
    });
  };

  const handleOpenEditTaskDialog = () => {
    const formId = "task-detail-edit-form";

    openDialog({
      mode: "edit",
      eyebrow: "タスク",
      breadcrumbs: ["編集"],
      title: "タスクを編集",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <TaskDialogForm
          formId={formId}
          submitLabel="変更を保存"
          initialValues={{
            title: taskView.title,
            customer_id: taskView.customerId ?? "",
            project_id: taskView.projectId,
            user_id: taskView.ownerId,
            due_date: taskView.dueDate,
            is_completed: taskView.isCompleted,
            progress_percent: taskView.progressPercent,
            progress_updated_at: taskView.progressUpdatedAt ?? todayString(),
          }}
          onSubmit={(values) => {
            updateTask(taskView.id, values);
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

  const handleOpenDeleteTaskDialog = () => {
    openDialog({
      eyebrow: "タスク",
      breadcrumbs: ["削除"],
      title: "タスクを削除しますか？",
      description: "この操作は取り消せません。",
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      size: "md",
      content: (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-foreground">
          <p className="font-bold text-destructive">削除対象</p>
          <p className="mt-2 break-words font-semibold">{taskView.title}</p>
          <p className="mt-3 text-muted-foreground">
            OKすると、このタスクのレコードが削除されます。
          </p>
        </div>
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              deleteTask(taskView.id);
              closeDialog();
              navigate("/tasks");
            }}
          >
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
        </>
      ),
    });
  };

  const RelatedContent = (
    <div className="flex h-full flex-col bg-muted/5">
      <div className="border-b border-border/60 bg-card/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">タスク一覧</h2>
          </div>
          <Badge variant="secondary" className="border-0 bg-muted text-xs font-bold">
            {relatedTasks.length}
          </Badge>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenAddTaskDialog}
          className="mt-3 w-full justify-center gap-1.5 font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          タスクの追加
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {relatedTasks.map((related) => (
            <Card
              key={related.id}
              onClick={() => handleSelectRelatedTask(related.id)}
              className={cn(
                "cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md",
                selectedTaskId === related.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                  : related.status === "overdue"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {related.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {related.project}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline" className={statusTone(related.status, related.dueDate)}>
                    {statusLabel(related.status, related.dueDate)}
                  </Badge>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    期限: {formatDate(related.dueDate)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      related.isCompleted ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${related.progressPercent}%` }}
                  />
                </div>
                <span className="w-9 text-right text-[11px] font-bold text-muted-foreground">
                  {related.progressPercent}%
                </span>
              </div>
            </Card>
          ))}

          {relatedTasks.length === 0 && (
            <Card className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center shadow-none">
              <p className="text-sm font-bold text-foreground/70">
                関連タスクはありません
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const RecordContent = (
    <div className="min-h-full bg-background">
      <div className="space-y-5 p-4 md:p-5">
        <Card className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <h2 className="text-xl font-bold leading-snug text-foreground md:text-2xl">
                  {taskView.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold", dueDateTone(taskView.dueDate, taskView.status))}>
                    <Calendar className="h-3.5 w-3.5" />
                    期限: {formatDueDateWithRemaining(taskView.dueDate)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleOpenEditTaskDialog}
                  className="gap-1.5 font-bold shadow-sm"
                >
                  <Edit className="h-4 w-4" />
                  編集
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="md"
                  onClick={handleOpenDeleteTaskDialog}
                  className="gap-1.5 font-bold shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  削除
                </Button>
              </div>

              <div className="flex justify-end lg:col-start-2">
                <Select
                  value={String(taskView.progressPercent)}
                  onValueChange={(value) => handleProgressChange(Number(value))}
                >
                  <SelectTrigger className="h-10 w-32 border-border bg-background text-sm font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {progressOptions.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm leading-6 text-muted-foreground lg:col-span-2">
                {buildTaskDescription(taskView)}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-muted-foreground">
                  進捗率
                </span>
                <span className="text-sm font-bold text-foreground">
                  {taskView.progressPercent}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", progressTone)}
                  style={{ width: `${taskView.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="border-t border-border/70 pt-4">
              <div className="mb-4 flex items-center justify-between gap-3">
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow
                  icon={<Flag className="h-4 w-4" />}
                  label="ステータス"
                  value={
                    <Badge variant="outline" className={statusTone(taskView.status, taskView.dueDate)}>
                      {statusLabel(taskView.status, taskView.dueDate)}
                    </Badge>
                  }
                />
                <DetailRow
                  icon={<Hash className="h-4 w-4" />}
                  label="タスク名"
                  value={<span className="break-words">{taskView.title}</span>}
                />
                <DetailRow
                  icon={<Briefcase className="h-4 w-4" />}
                  label="案件"
                  value={<span className="break-words">{taskView.project}</span>}
                />
                <DetailRow
                  icon={<Flag className="h-4 w-4" />}
                  label="確度"
                  value={
                    <Badge variant="outline" className={priorityTone(taskView.priority)}>
                      {priorityLabel(taskView.priority)}
                    </Badge>
                  }
                />
                <DetailRow
                  icon={<User className="h-4 w-4" />}
                  label="担当者"
                  value={taskView.owner}
                />
                <DetailRow
                  icon={<Clock className="h-4 w-4" />}
                  label="進捗更新日"
                  value={taskView.progressUpdatedAt ? formatDate(taskView.progressUpdatedAt) : "-"}
                />
                <DetailRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="期限"
                  value={formatDate(taskView.dueDate)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="relative flex h-full flex-col overflow-hidden bg-background">
        <div
          className={cn(
            "relative z-20 shrink-0 overflow-hidden border-b border-border bg-card px-4 shadow-sm transition-all duration-200 md:px-6 md:py-5",
            isMobileHeaderCompact ? "py-2.5" : "py-4",
          )}
        >
          <div
            className={cn(
              "relative z-10 flex md:flex-row md:items-start md:justify-between md:gap-4",
              isMobileHeaderCompact
                ? "flex-col items-stretch gap-2.5"
                : "flex-row items-start justify-between gap-4",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-1 gap-3 md:items-start",
                isMobileHeaderCompact ? "items-center" : "items-start",
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className={cn(
                  "mt-0.5 h-9 w-9 shrink-0 rounded-full bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className={cn(
                  "min-w-0 flex-1 md:pt-0.5",
                  isMobileHeaderCompact ? "pt-0" : "pt-0.5",
                )}
              >
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 md:mb-2",
                    isMobileHeaderCompact ? "mb-0" : "mb-2",
                  )}
                >
                  {taskView.customerId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/customers/${taskView.customerId}`)}
                      className={cn(
                        "inline-flex min-w-0 items-center gap-1.5 text-left font-bold tracking-tight text-foreground transition-colors hover:text-primary md:text-xl",
                        isMobileHeaderCompact ? "text-base" : "text-lg",
                      )}
                    >
                      <span className="truncate">{taskView.customer}</span>
                      <ExternalLink
                        className={cn(
                          "h-4 w-4 shrink-0 text-primary",
                          isMobileHeaderCompact && "hidden md:block",
                        )}
                      />
                    </button>
                  ) : (
                    <h1
                      className={cn(
                        "font-bold tracking-tight text-foreground md:text-xl",
                        isMobileHeaderCompact ? "text-base" : "text-lg",
                      )}
                    >
                      {taskView.customer}
                    </h1>
                  )}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "shrink-0 grid grid-cols-2 gap-2 md:hidden",
                !isMobileHeaderCompact && "hidden",
              )}
            >
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleOpenEditTaskDialog}
                className="h-8 w-full justify-center gap-1.5 font-bold shadow-2xs"
              >
                <Edit className="h-4 w-4" />
                編集
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleOpenDeleteTaskDialog}
                className="h-8 w-full justify-center gap-1.5 font-bold shadow-2xs"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as MobileTab)}
          className="flex-1 min-h-0 gap-0 md:hidden"
        >
          <div className="flex shrink-0 overflow-x-auto border-b border-border bg-muted/5 px-2">
            {mobileTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-state={isActive ? "active" : "inactive"}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "min-w-[80px] flex-1 truncate border-b-2 px-2 py-3.5 text-center text-xs font-bold tracking-wider transition-colors",
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

          <TabsContents
            className="flex-1 min-h-0 bg-background/50"
            onScrollCapture={handleMobileContentScroll}
          >
            <TabsContent value="record" className="h-full overflow-y-auto">
              {RecordContent}
            </TabsContent>
            <TabsContent value="related" className="h-full overflow-y-auto">
              {RelatedContent}
            </TabsContent>
          </TabsContents>
        </Tabs>

        <div className="hidden flex-1 overflow-hidden bg-muted/10 md:flex dark:bg-background">
          <div className="min-w-0 flex-[0.85_1_18rem] overflow-y-auto border-r border-border bg-muted/5">
            {RelatedContent}
          </div>
          <div className="min-w-0 flex-[1.35_1_32rem] overflow-y-auto bg-background">
            {RecordContent}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
