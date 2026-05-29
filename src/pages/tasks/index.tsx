import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, WheelEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NumberFlow from "@number-flow/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  Filter,
  ChevronDown,
  Info,
  Plus,
  RotateCcw,
  Search,
  ChevronRight,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import TaskDialogForm from "@/components/tasks/TaskDialogForm";
import type { Task } from "../../types";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  activeFilterComboboxClassName,
  filterComboboxClassName,
  filterDateButtonClassName,
  FilterPill,
  filterRangeInputClassName,
  FilterRangeSeparator,
} from "@/components/ui/filter-pill";
import {
  ListPagination,
  ListTableSurface,
  SortableListTableHead,
  type ListSortOrder,
  type ListTableColumn,
} from "@/components/ui/list-table";
import { SearchBar } from "@/components/ui/search-bar";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TaskStatus = "not_started" | "in_progress" | "completed" | "overdue";
type Priority = "High" | "Middle" | "Low";

interface TaskView {
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

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const DEFAULT_COLUMNS: ListTableColumn[] = [
  { id: "status", label: "フェーズ", width: "w-32" },
  { id: "title", label: "タスク名", width: "w-72" },
  { id: "due_date", label: "期限", width: "w-36" },
  { id: "customer", label: "企業", width: "w-56" },
  { id: "project", label: "案件", width: "w-64" },
  { id: "progress", label: "進捗率", width: "w-32" },
  { id: "priority", label: "確度", width: "w-28" },
  { id: "owner", label: "担当者", width: "w-36" },
  { id: "updated", label: "最終更新日", width: "w-36" },
];

const statusOptions = [
  { label: "未処理", value: "not_started" },
  { label: "実行中", value: "in_progress" },
  { label: "完了", value: "completed" },
  { label: "期限超過", value: "overdue" },
];

const priorityOptions = [
  { label: "高", value: "High" },
  { label: "中", value: "Middle" },
  { label: "低", value: "Low" },
];

const progressOptions = Array.from({ length: 21 }, (_, index) => index * 5);

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

function normalizeProgressInput(value: string) {
  if (value.trim() === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(clampProgress(Math.round(parsed)));
}

function nearestProgressOption(value: number) {
  return clampProgress(Math.round(value / 5) * 5);
}

const TASK_FILTER_FIELDS = ["status", "date", "progress", "priority", "owner"];

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTimeMinute(date?: string) {
  if (!date) return "-";
  const normalized = date.includes("T") ? date : `${date}T00:00:00`;
  const parsed = new Date(normalized);
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mi = String(parsed.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

function statusLabel(status: TaskStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusTone(status: TaskStatus) {
  return cn(
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs whitespace-nowrap",
    status === "completed" &&
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    status === "in_progress" &&
      "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    status === "overdue" &&
      "bg-destructive/10 text-destructive border-destructive/20",
    status === "not_started" && "bg-muted text-muted-foreground border-border",
  );
}

const priorityPillColor: Record<Priority, string> = {
  High:
    "border-orange-800/25 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/45",
  Middle:
    "border-yellow-500/25 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-400/30 dark:bg-yellow-950/30 dark:text-yellow-300 dark:hover:bg-yellow-950/45",
  Low:
    "border-slate-500/20 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-400/25 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800",
};

const priorityDotColor: Record<Priority, string> = {
  High: "bg-orange-800 dark:bg-orange-400",
  Middle: "bg-yellow-500 dark:bg-yellow-300",
  Low: "bg-slate-700 dark:bg-slate-300",
};

function priorityLabel(priority: Priority) {
  return priorityOptions.find((option) => option.value === priority)?.label ?? priority;
}

function renderPriorityOption(priority: Priority) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("size-2 rounded-full", priorityDotColor[priority])}
        aria-hidden="true"
      />
      <span>{priorityLabel(priority)}</span>
    </span>
  );
}

function ProgressPercentControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const centeredOption = nearestProgressOption(value);

  useEffect(() => {
    if (!open) setDraft(String(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      selectedOptionRef.current?.scrollIntoView({ block: "center" });
    });
  }, [centeredOption, open]);

  const commitValue = (nextValue: number) => {
    const normalized = clampProgress(Math.round(nextValue));
    setDraft(String(normalized));
    if (normalized !== value) onChange(normalized);
  };

  const commitDraft = () => {
    const normalized = normalizeProgressInput(draft);
    if (normalized === "") {
      setDraft(String(value));
      return;
    }
    commitValue(Number(normalized));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitDraft();
      setOpen(false);
      return;
    }

    if (event.key === "Escape") {
      setDraft(String(value));
      setOpen(false);
    }
  };

  const handlePickerWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    pickerRef.current?.scrollBy({
      top: event.deltaY > 0 ? 40 : -40,
      behavior: "smooth",
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraft(String(value));
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-24 items-center justify-between gap-2 rounded-full border border-border/80 bg-background px-3 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/60 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <NumberFlow
            value={value}
            suffix="%"
            willChange
            className="tabular-nums"
          />
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-52 gap-3 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={5}
            value={draft}
            aria-label="進捗率"
            autoFocus
            onFocus={(event) => event.currentTarget.select()}
            onBlur={commitDraft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onWheel={(event) => event.preventDefault()}
            className="h-7 min-w-0 flex-1 bg-transparent text-center text-sm font-semibold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs font-semibold text-muted-foreground">%</span>
        </div>
        <div className="relative">
          <div
            ref={pickerRef}
            onWheel={handlePickerWheel}
            className="h-40 overflow-y-auto scroll-smooth [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.35)_transparent] [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            <div className="flex flex-col items-stretch">
              {progressOptions.map((option) => {
                const isSelected = option === centeredOption;

                return (
                  <button
                    key={option}
                    ref={isSelected ? selectedOptionRef : undefined}
                    type="button"
                    onClick={() => {
                      commitValue(option);
                      setOpen(false);
                    }}
                    className={cn(
                      "mr-3 h-10 shrink-0 rounded-md text-center text-sm font-semibold tabular-nums text-muted-foreground transition-colors [scroll-snap-align:start]",
                      "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      isSelected && "bg-primary/10 text-primary font-bold",
                    )}
                  >
                    {option}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
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

function priorityToProjectPriority(priority: Priority): 1 | 2 | 3 {
  if (priority === "High") return 1;
  if (priority === "Low") return 3;
  return 2;
}

export default function TaskBoard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { tasks, customers, projects, profiles, addTask, updateTask, updateProject } =
    useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollRight = target.scrollWidth - target.scrollLeft - target.clientWidth;
    setShowLeftIndicator(target.scrollLeft > 5);
    setShowRightIndicator(scrollRight > 5);
  };
  const [sortKey, setSortKey] = useState<string>(
    () => searchParams.get("sort") || "due_date",
  );
  const [sortOrder, setSortOrder] = useState<ListSortOrder>(
    () => (searchParams.get("order") as ListSortOrder) || "asc",
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    return TASK_FILTER_FIELDS.map((field) => ({
      id: Math.random().toString(36).slice(2, 11),
      field,
      operator: "contains",
      value: searchParams.get(field) ?? "",
    }));
  });
  const [isFilterOpen, setIsFilterOpen] = useState(() =>
    TASK_FILTER_FIELDS.some((field) => searchParams.has(field)),
  );
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [columns, setColumns] = useState<ListTableColumn[]>(DEFAULT_COLUMNS);
  const itemsPerPage = 8;
  const activeFilterCount = filters.filter((filter) => filter.value).length;

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (sortKey !== "due_date") params.set("sort", sortKey);
    if (sortOrder !== "asc") params.set("order", sortOrder);
    if (currentPage > 1) params.set("page", currentPage.toString());

    filters.forEach((filter) => {
      if (filter.value) params.append(filter.field, filter.value);
    });

    setSearchParams(params, { replace: true });
  }, [search, sortKey, sortOrder, currentPage, filters, setSearchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ownerOptions = useMemo(
    () =>
      profiles
        .map((profile) => ({ label: profile.name, value: profile.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [profiles],
  );

  const taskViews = useMemo<TaskView[]>(
    () =>
      tasks.map((task) => {
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
      }),
    [customers, profiles, projects, tasks],
  );

  const handleOpenAddTaskDialog = () => {
    const formId = "task-add-form";

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
            user_id: currentUser?.id ?? profiles[0]?.id ?? "user-001",
          }}
          onSubmit={(values) => {
            addTask(values);
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

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters((current) =>
      current.map((filter) =>
        filter.id === id ? { ...filter, ...updates } : filter,
      ),
    );
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder(key === "due_date" ? "asc" : "desc");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumns((current) => {
      const oldIndex = current.findIndex((column) => column.id === active.id);
      const newIndex = current.findIndex((column) => column.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleProgressChange = (taskId: string, value: number) => {
    updateTask(taskId, {
      progress_percent: value,
      is_completed: value === 100,
    } satisfies Partial<Task>);
  };

  const handlePriorityChange = (task: TaskView, value: Priority) => {
    if (!task.projectId) return;
    updateProject(task.projectId, {
      priority: priorityToProjectPriority(value),
    });
  };

  const filtered = useMemo(() => {
    let list = [...taskViews];

    if (!showCompletedTasks) {
      list = list.filter((task) => !task.isCompleted);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.customer.toLowerCase().includes(query) ||
          task.project.toLowerCase().includes(query) ||
          task.owner.toLowerCase().includes(query),
      );
    }

    filters.forEach((filter) => {
      if (!filter.value) return;

      list = list.filter((task) => {
        const value = filter.value;
        switch (filter.field) {
          case "status":
            return task.status === value;
          case "priority":
            return task.priority === value;
          case "owner":
            return task.ownerId === value;
          case "progress": {
            if (value === ",") return true;
            const [from = "", until = ""] = value.split(",");
            const fromValue = from.trim() ? Number(from) : 0;
            const untilValue = until.trim() ? Number(until) : 100;
            return task.progressPercent >= fromValue && task.progressPercent <= untilValue;
          }
          case "date": {
            if (value === ",") return true;
            const [from = "", until = ""] = value.split(",");
            const dueTime = new Date(`${task.dueDate}T00:00:00`).getTime();
            const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : 0;
            const untilTime = until
              ? new Date(`${until}T23:59:59`).getTime()
              : Infinity;
            return dueTime >= fromTime && dueTime <= untilTime;
          }
          default:
            return true;
        }
      });
    });

    list.sort((a, b) => {
      const comparison = (() => {
        if (sortKey === "title") return a.title.localeCompare(b.title, "ja");
        if (sortKey === "customer") return a.customer.localeCompare(b.customer, "ja");
        if (sortKey === "project") return a.project.localeCompare(b.project, "ja");
        if (sortKey === "status") return a.status.localeCompare(b.status);
        if (sortKey === "priority") {
          const score = { High: 3, Middle: 2, Low: 1 };
          return score[a.priority] - score[b.priority];
        }
        if (sortKey === "owner") return a.owner.localeCompare(b.owner, "ja");
        if (sortKey === "progress") return a.progressPercent - b.progressPercent;
        if (sortKey === "updated") {
          return (a.progressUpdatedAt ?? "").localeCompare(b.progressUpdatedAt ?? "");
        }
        if (sortKey === "due_date") {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })();
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return list;
  }, [filters, search, showCompletedTasks, sortKey, sortOrder, taskViews]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [currentPage, filtered, itemsPerPage]);



  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-auto bg-muted/5 custom-scrollbar pb-28 md:pb-0">
          <div className="bg-background/95 backdrop-blur-md">
            <div className="px-4 pb-4 pt-6 md:px-6">
              <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                <div className="flex w-full shrink-0 items-center gap-2 py-1 md:w-auto">
                  <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                    タスク一覧
                  </h1>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="cursor-help text-muted-foreground outline-none transition-colors hover:text-foreground"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="border border-border bg-popover text-popover-foreground shadow-md"
                      >
                        <p>AIが抽出したタスクの期限、担当、進捗を管理します</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleOpenAddTaskDialog}
                    className="ml-auto h-9 w-9 shrink-0 rounded-full shadow-md md:hidden"
                    aria-label="タスクを追加"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center md:flex-initial md:justify-end">
                  <div className="flex flex-1 flex-row items-center justify-end gap-2 md:flex-initial">
                    <div
                      className={cn(
                        "min-w-0 flex-1 transition-all duration-300 ease-in-out sm:flex-initial sm:shrink-0",
                        isSearchFocused || search.trim() !== ""
                          ? "sm:w-72 md:w-80"
                          : "sm:w-44 md:w-48",
                      )}
                    >
                      <SearchBar
                        placeholder="タスク名・企業・案件・担当者で検索"
                        value={search}
                        onSearchChange={(value) => {
                          setSearch(value);
                          setCurrentPage(1);
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        showKbd={false}
                      />
                    </div>

                    <div className="flex shrink-0 items-center justify-center">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                isFilterOpen
                                  ? "ghost"
                                  : activeFilterCount > 0
                                    ? "secondary"
                                    : "ghost"
                              }
                              size="md"
                              onClick={() => setIsFilterOpen(!isFilterOpen)}
                              className={cn(
                                "relative h-10 w-10 justify-center border border-border/50 p-0 shadow-sm transition-all",
                                isFilterOpen
                                  ? "border-primary bg-primary/10 text-primary"
                                  : activeFilterCount > 0
                                    ? "border-border bg-secondary text-foreground"
                                    : "bg-card",
                              )}
                            >
                              <Filter className="h-4 w-4" />
                              {activeFilterCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                  {activeFilterCount}
                                </span>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="hidden border border-border bg-popover text-popover-foreground shadow-md md:block"
                          >
                            <p>
                              フィルター
                              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <Button
                    variant={showCompletedTasks ? "secondary" : "ghost"}
                    size="md"
                    onClick={() => {
                      setShowCompletedTasks((current) => !current);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "h-10 w-full shrink-0 justify-center gap-2 border border-border/50 px-4 text-sm font-bold shadow-sm sm:w-auto",
                      showCompletedTasks
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    完了タスクを表示
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleOpenAddTaskDialog}
                    className="hidden h-10 w-full shrink-0 justify-center gap-2 px-4 shadow-md sm:w-auto md:inline-flex"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold">タスクを追加</span>
                  </Button>
                </div>
              </div>

              {isFilterOpen && (
                <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {filters.map((filter) => {
                      const labelMap: Record<string, string> = {
                        status: "フェーズ",
                        date: "期限",
                        progress: "進捗",
                        priority: "確度",
                        owner: "担当者",
                      };

                      const hasValue = !!filter.value;
                      const isDate = filter.field === "date";
                      const isProgress = filter.field === "progress";

                      return (
                        <div key={filter.id} className="flex min-w-0">
                          {isDate ? (
                            <FilterPill
                              label={labelMap[filter.field]}
                              active={hasValue}
                              className="sm:min-w-[300px]"
                              onClear={
                                hasValue
                                  ? () => updateFilter(filter.id, { value: "" })
                                  : undefined
                              }
                            >
                              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                                <DatePicker
                                  value={filter.value.split(",")[0] || ""}
                                  onChange={(value) => {
                                    const parts = filter.value.split(",");
                                    updateFilter(filter.id, {
                                      value: `${value},${parts[1] || ""}`,
                                    });
                                  }}
                                  size="sm"
                                  className="w-full sm:w-24"
                                  buttonClassName={filterDateButtonClassName}
                                  clearable={false}
                                  placeholder="開始"
                                />
                                <FilterRangeSeparator />
                                <DatePicker
                                  value={filter.value.split(",")[1] || ""}
                                  onChange={(value) => {
                                    const parts = filter.value.split(",");
                                    updateFilter(filter.id, {
                                      value: `${parts[0] || ""},${value}`,
                                    });
                                  }}
                                  size="sm"
                                  className="w-full sm:w-24"
                                  buttonClassName={filterDateButtonClassName}
                                  clearable={false}
                                  placeholder="終了"
                                />
                              </div>
                            </FilterPill>
                          ) : isProgress ? (
                            <FilterPill
                              label={labelMap[filter.field]}
                              active={hasValue}
                              className="sm:min-w-[250px]"
                              onClear={
                                hasValue
                                  ? () => updateFilter(filter.id, { value: "" })
                                  : undefined
                              }
                            >
                              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={filter.value.split(",")[0] || ""}
                                  onChange={(event) => {
                                    const parts = filter.value.split(",");
                                    const nextMin = event.target.value;
                                    const nextMax = parts[1] || "";
                                    updateFilter(filter.id, {
                                      value:
                                        nextMin || nextMax
                                          ? `${nextMin},${nextMax}`
                                          : "",
                                    });
                                  }}
                                  placeholder="下限"
                                  className={filterRangeInputClassName}
                                />
                                <FilterRangeSeparator />
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={filter.value.split(",")[1] || ""}
                                  onChange={(event) => {
                                    const parts = filter.value.split(",");
                                    const nextMin = parts[0] || "";
                                    const nextMax = event.target.value;
                                    updateFilter(filter.id, {
                                      value:
                                        nextMin || nextMax
                                          ? `${nextMin},${nextMax}`
                                          : "",
                                    });
                                  }}
                                  placeholder="上限"
                                  className={filterRangeInputClassName}
                                />
                              </div>
                            </FilterPill>
                          ) : (
                            <Combobox
                              options={
                                filter.field === "status"
                                  ? statusOptions
                                  : filter.field === "priority"
                                    ? priorityOptions
                                    : ownerOptions
                              }
                              value={filter.value}
                              onValueChange={(val) =>
                                updateFilter(filter.id, { value: val })
                              }
                              placeholder="選択"
                              labelPrefix={labelMap[filter.field]}
                              className={cn(
                                filterComboboxClassName,
                                hasValue && activeFilterComboboxClassName,
                              )}
                            />
                          )}
                        </div>
                      );
                    })}

                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilters((current) =>
                            current.map((filter) => ({ ...filter, value: "" })),
                          );
                          setCurrentPage(1);
                        }}
                        className="ml-auto h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-destructive font-medium transition-colors shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                        すべてクリア
                      </Button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="m-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card py-20 text-muted-foreground md:m-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm font-medium">
                条件に一致するタスクがありません
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilters((current) =>
                    current.map((filter) => ({ ...filter, value: "" })),
                  );
                  setCurrentPage(1);
                }}
              >
                すべてのフィルターをクリア
              </Button>
            </div>
          ) : (
            <>
            <div className="mt-4 px-4 pb-6 md:px-6 lg:pb-10">
              <ListTableSurface>
                {/* Left Scroll Indicator */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-background to-transparent z-10 transition-opacity duration-300",
                    showLeftIndicator ? "opacity-100" : "opacity-0"
                  )}
                />
                {/* Right Scroll Indicator */}
                <div
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-background to-transparent z-10 transition-opacity duration-300",
                    showRightIndicator ? "opacity-100" : "opacity-0"
                  )}
                />
                <div
                  className="overflow-x-auto bg-background custom-horizontal-scrollbar"
                  onScroll={handleScroll}
                >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="min-w-[600px] bg-transparent text-xs text-foreground sm:min-w-[1280px]">
                    <TableHeader className="bg-transparent">
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <SortableContext
                          items={columns.map((column) => column.id)}
                          strategy={horizontalListSortingStrategy}
                        >
                          {columns.map((column) => (
                            <SortableListTableHead
                              key={column.id}
                              column={column}
                              sortKey={sortKey}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                          ))}
                        </SortableContext>
                        <TableHead className="sticky right-0 z-20 w-12 bg-gradient-to-l from-background to-transparent px-3 py-3" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className={cn(
                            "group cursor-pointer border-b border-border/50 bg-transparent transition-all duration-200 hover:bg-muted",
                            task.isCompleted &&
                              "bg-muted/10 text-muted-foreground/80 hover:bg-muted/25",
                          )}
                        >
                          {columns.map((column) => {
                            switch (column.id) {

                              case "status":
                                return (
                                  <TableCell key={column.id} className="px-4 py-4">
                                    <span className={statusTone(task.status)}>
                                      {statusLabel(task.status)}
                                    </span>
                                  </TableCell>
                                );
                              case "title":
                                return (
                                  <TableCell key={column.id} className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="max-w-[18rem] truncate text-xs font-bold text-foreground">
                                          {task.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(task.dueDate)} 期限
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                              case "customer":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-4 text-xs font-medium text-foreground"
                                  >
                                    <span className="block max-w-[14rem] truncate">
                                      {task.customer}
                                    </span>
                                  </TableCell>
                                );
                              case "project":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-4 text-xs font-medium text-foreground"
                                  >
                                    <span className="block max-w-[16rem] truncate">
                                      {task.project}
                                    </span>
                                  </TableCell>
                                );
                              case "priority":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-4"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <Select
                                      value={task.priority}
                                      onValueChange={(value) =>
                                        handlePriorityChange(task, value as Priority)
                                      }
                                      disabled={!task.projectId}
                                    >
                                      <SelectTrigger
                                        className={cn(
                                          "h-8 w-24 rounded-full border px-3 text-xs font-semibold shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:size-3.5 [&>svg]:text-current [&>svg]:opacity-70",
                                          priorityPillColor[task.priority],
                                        )}
                                      >
                                        {renderPriorityOption(task.priority)}
                                      </SelectTrigger>
                                      <SelectContent className="min-w-28">
                                        {priorityOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {renderPriorityOption(option.value as Priority)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                );
                              case "owner":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-4 text-xs font-semibold text-foreground"
                                  >
                                    {task.owner}
                                  </TableCell>
                                );
                              case "progress":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-4"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ProgressPercentControl
                                      value={task.progressPercent}
                                      onChange={(value) =>
                                        handleProgressChange(task.id, value)
                                      }
                                    />
                                  </TableCell>
                                );
                              case "updated":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-foreground"
                                  >
                                    {task.progressUpdatedAt
                                      ? formatDateTimeMinute(task.progressUpdatedAt)
                                      : "-"}
                                  </TableCell>
                                );
                              case "due_date":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className={cn(
                                      "whitespace-nowrap px-4 py-4 text-xs font-bold",
                                      task.status === "overdue"
                                        ? "text-destructive"
                                        : "text-foreground",
                                    )}
                                  >
                                    {formatDate(task.dueDate)}
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                          <TableCell className="sticky right-0 z-10 bg-gradient-to-l from-background to-transparent group-hover:from-muted group-hover:to-transparent transition-all duration-200 px-3 py-4 text-right">
                             <div className="flex items-center justify-end pr-4">
                               <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground border border-border/50 shadow-2xs opacity-0 group-hover:opacity-100 transition-all duration-200">
                                 <ChevronRight className="h-4 w-4" />
                               </div>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DndContext>
                </div>
              </ListTableSurface>
            </div>

              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
