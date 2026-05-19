import { useMemo, useState, type FormEvent } from "react";
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
  Building2,
  ChevronRight,
  Filter,
  Info,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useDataStore } from "../context/DataStoreContext";
import type { Project, ProjectStatus } from "../types";
import { StatusBadge } from "../components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  ListPagination,
  SortableListTableHead,
  type ListSortOrder,
  type ListTableColumn,
} from "@/components/ui/list-table";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

type SortKey =
  | "updated_at"
  | "name"
  | "customer"
  | "status"
  | "priority"
  | "amount"
  | "owner"
  | "next_action_date"
  | "source"
  | "note";

interface FilterRule {
  id: string;
  field: string;
  value: string;
}

const DEFAULT_COLUMNS: ListTableColumn[] = [
  { id: "name", label: "案件名", width: "w-80" },
  { id: "customer", label: "顧客名", width: "w-72" },
  { id: "status", label: "ステータス", width: "w-36" },
  { id: "priority", label: "優先度", width: "w-28" },
  { id: "amount", label: "金額", width: "w-36" },
  { id: "owner", label: "担当者", width: "w-36" },
  { id: "next_action_date", label: "次回アクション", width: "w-40" },
  { id: "updated_at", label: "最終更新", width: "w-32" },
  { id: "source", label: "登録元", width: "w-32" },
  { id: "note", label: "メモ", width: "w-80" },
];

const statusLabel: Record<ProjectStatus, string> = {
  lead: "リード",
  proposing: "提案中",
  negotiating: "交渉中",
  closed: "成約",
};

const sourceLabel: Record<"recording" | "manual", string> = {
  recording: "音声録音",
  manual: "手動登録",
};

const priorityLabel: Record<Project["priority"], string> = {
  1: "高",
  2: "中",
  3: "低",
};

const priorityColor: Record<Project["priority"], string> = {
  1: "bg-destructive/10 text-destructive",
  2: "bg-yellow-500/10 text-yellow-600",
  3: "bg-muted text-muted-foreground",
};

const sourceColor: Record<"recording" | "manual", string> = {
  recording: "bg-primary/10 text-primary",
  manual: "bg-emerald-500/10 text-emerald-600",
};

const statusOptions = [
  { label: "リード", value: "lead" },
  { label: "提案中", value: "proposing" },
  { label: "交渉中", value: "negotiating" },
  { label: "成約", value: "closed" },
];

const priorityOptions = [
  { label: "優先度 高", value: "1" },
  { label: "優先度 中", value: "2" },
  { label: "優先度 低", value: "3" },
];

const sourceOptions = [
  { label: "音声録音", value: "recording" },
  { label: "手動登録", value: "manual" },
];

const linkOptions = [
  { label: "企業紐付け済み", value: "linked" },
  { label: "未紐付け", value: "unlinked" },
];

const dateOptions = [
  { label: "今日", value: "today" },
  { label: "過去7日間", value: "7days" },
  { label: "過去30日間", value: "30days" },
];

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value.includes("T") ? value : `${value}T00:00:00`)
    .toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
}

function formatAmount(value: number) {
  if (!value) return "未設定";
  return `${(value / 10000).toLocaleString()}万円`;
}

function compareValue(a: string | number | undefined, b: string | number | undefined) {
  const left = a ?? "";
  const right = b ?? "";
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "ja");
}

function projectDateMatches(value: string | undefined, option: string) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  if (option === "today") return date.toDateString() === now.toDateString();
  if (option === "7days") {
    return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }
  if (option === "30days") {
    return now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }
  return true;
}

export default function ProjectList() {
  const { currentUser } = useAuth();
  const { projects, customers, profiles, addProject } = useDataStore();
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortOrder, setSortOrder] = useState<ListSortOrder>("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [columns, setColumns] = useState<ListTableColumn[]>(DEFAULT_COLUMNS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    customer_id: "",
    status: "lead" as ProjectStatus,
    priority: 2 as Project["priority"],
    amount: "",
    close_date: "",
    note: "",
  });
  const itemsPerPage = 8;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const customerOptions = useMemo(
    () =>
      customers
        .map((customer) => ({ label: customer.name, value: customer.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [customers],
  );

  const ownerOptions = useMemo(
    () =>
      profiles
        .map((profile) => ({ label: profile.name, value: profile.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [profiles],
  );

  const handleSort = (key: string) => {
    const typedKey = key as SortKey;
    if (sortKey === typedKey) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(typedKey);
    setSortOrder(typedKey === "name" ? "asc" : "desc");
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

  const addFilter = () => {
    setFilters((current) => [
      ...current,
      {
        id: Math.random().toString(36).slice(2, 11),
        field: "status",
        value: "",
      },
    ]);
    setCurrentPage(1);
    setIsFilterOpen(true);
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters((current) =>
      current.map((filter) =>
        filter.id === id ? { ...filter, ...updates } : filter,
      ),
    );
    setCurrentPage(1);
  };

  const removeFilter = (id: string) => {
    setFilters((current) => current.filter((filter) => filter.id !== id));
    setCurrentPage(1);
  };

  const filteredProjects = useMemo(() => {
    const query = normalizeSearch(search);
    const list = projects.filter((project) => {
      if (!project.customer_id && (project.source ?? "manual") === "recording") {
        return false;
      }

      const customer = project.customer_id
        ? customers.find((item) => item.id === project.customer_id)
        : null;
      const owner = profiles.find((profile) => profile.id === project.user_id);
      const source = project.source ?? "manual";

      const searchable = normalizeSearch(
        [
          project.name,
          customer?.name ?? "未紐付け",
          customer?.industry ?? "",
          project.labels?.join(" ") ?? "",
          project.note ?? "",
          statusLabel[project.status],
          priorityLabel[project.priority],
          sourceLabel[source],
          owner?.name ?? "",
          String(project.amount),
        ].join(" "),
      );

      if (query && !searchable.includes(query)) return false;

      return filters.every((filter) => {
        if (!filter.value) return true;
        if (filter.field === "status") return project.status === filter.value;
        if (filter.field === "priority") return String(project.priority) === filter.value;
        if (filter.field === "source") return source === filter.value;
        if (filter.field === "link") {
          return filter.value === "linked"
            ? Boolean(project.customer_id)
            : !project.customer_id;
        }
        if (filter.field === "customer") return project.customer_id === filter.value;
        if (filter.field === "owner") return project.user_id === filter.value;
        if (filter.field === "date") return projectDateMatches(project.updated_at, filter.value);
        return true;
      });
    });

    list.sort((a, b) => {
      const customerA = a.customer_id
        ? customers.find((item) => item.id === a.customer_id)?.name
        : "未紐付け";
      const customerB = b.customer_id
        ? customers.find((item) => item.id === b.customer_id)?.name
        : "未紐付け";
      const ownerA = profiles.find((profile) => profile.id === a.user_id)?.name;
      const ownerB = profiles.find((profile) => profile.id === b.user_id)?.name;
      const sourceA = a.source ?? "manual";
      const sourceB = b.source ?? "manual";
      const values: Record<SortKey, [string | number | undefined, string | number | undefined]> = {
        updated_at: [a.updated_at, b.updated_at],
        name: [a.name, b.name],
        customer: [customerA, customerB],
        status: [statusLabel[a.status], statusLabel[b.status]],
        priority: [a.priority, b.priority],
        amount: [a.amount, b.amount],
        owner: [ownerA, ownerB],
        next_action_date: [a.next_action_date, b.next_action_date],
        source: [sourceLabel[sourceA], sourceLabel[sourceB]],
        note: [a.note, b.note],
      };
      const comparison = compareValue(...values[sortKey]);
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return list;
  }, [customers, filters, profiles, projects, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [currentPage, filteredProjects]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName || !currentUser) return;

    addProject({
      customer_id: form.customer_id || null,
      name: trimmedName,
      status: form.status,
      priority: form.priority,
      amount: Number(form.amount) || 0,
      user_id: currentUser.id,
      close_date: form.close_date || undefined,
      source: "manual",
      note: form.note.trim() || undefined,
    });

    setForm({
      name: "",
      customer_id: "",
      status: "lead",
      priority: 2,
      amount: "",
      close_date: "",
      note: "",
    });
    setIsFormOpen(false);
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="custom-scrollbar flex-1 overflow-auto bg-muted/5">
          <div className="bg-background/95 backdrop-blur-md">
            <div className="px-4 pb-4 pt-6 md:px-6">
              <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
                <div className="flex shrink-0 items-center gap-2 py-1">
                  <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                    案件一覧
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
                        <p>企業ごとの案件状況と次回アクションを管理します</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center xl:flex-initial xl:justify-end">
                  <div className="flex flex-1 flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center sm:gap-2 xl:flex-initial">
                    <div
                      className={cn(
                        "max-w-full shrink-0 transition-all duration-300 ease-in-out",
                        isSearchFocused || search.trim() !== ""
                          ? "w-full sm:w-72 md:w-80"
                          : "w-full sm:w-44 md:w-48",
                      )}
                    >
                      <SearchBar
                        placeholder="案件名・企業名で検索"
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

                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={
                              isFilterOpen
                                ? "ghost"
                                : filters.length > 0
                                  ? "secondary"
                                  : "ghost"
                            }
                            size="md"
                            onClick={() => setIsFilterOpen((current) => !current)}
                            className={cn(
                              "h-10 justify-center border border-border/50 shadow-sm transition-all sm:flex-initial",
                              filters.length === 0
                                ? "px-3 md:w-10 md:px-0"
                                : "gap-2 px-3 md:px-2.5",
                              isFilterOpen
                                ? "border-primary bg-primary/10 text-primary"
                                : filters.length > 0
                                  ? "border-border bg-secondary text-foreground"
                                  : "bg-card",
                            )}
                          >
                            <Filter className="h-4 w-4" />
                            <span className="text-sm md:hidden">フィルター</span>
                            {filters.length > 0 && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {filters.length}
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
                            {filters.length > 0 ? ` (${filters.length})` : ""}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsFormOpen((current) => !current)}
                    className="h-10 w-full shrink-0 justify-center gap-2 px-4 shadow-md sm:w-auto"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold">案件を登録</span>
                  </Button>
                </div>
              </div>

              {isFilterOpen && (
                <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 md:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-background shadow-sm">
                        <Filter className="h-3.5 w-3.5 text-primary" />
                      </div>

                      {filters.map((filter) => (
                        <div
                          key={filter.id}
                          className="flex min-w-[260px] flex-1 animate-in items-center gap-2 rounded-xl border border-border/60 bg-background p-1.5 shadow-sm zoom-in-95 duration-200 sm:min-w-0 sm:flex-initial"
                        >
                          <Select
                            value={filter.field}
                            onValueChange={(value) =>
                              updateFilter(filter.id, { field: value, value: "" })
                            }
                          >
                            <SelectTrigger className="h-8 flex-1 border-none bg-muted/30 text-xs font-bold shadow-none sm:w-32">
                              <SelectValue placeholder="項目" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="status">ステータス</SelectItem>
                              <SelectItem value="priority">優先度</SelectItem>
                              <SelectItem value="source">登録元</SelectItem>
                              <SelectItem value="link">紐付け状態</SelectItem>
                              <SelectItem value="customer">顧客</SelectItem>
                              <SelectItem value="owner">担当者</SelectItem>
                              <SelectItem value="date">最終更新</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="mx-1 h-4 w-px shrink-0 bg-border/60" />

                          <FilterValueControl
                            filter={filter}
                            customerOptions={customerOptions}
                            ownerOptions={ownerOptions}
                            onChange={(value) => updateFilter(filter.id, { value })}
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter(filter.id)}
                            className="ml-1 h-8 w-8 shrink-0 rounded-lg text-muted-foreground/30 hover:bg-destructive/5 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addFilter}
                        className="h-10 shrink-0 rounded-md border border-dashed border-border px-4 text-xs font-bold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        条件追加
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilters([]);
                        setIsFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className="ml-auto h-8 shrink-0 gap-1.5 px-3 text-[10px] font-bold uppercase text-muted-foreground transition-colors hover:text-destructive sm:ml-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                      条件クリア
                    </Button>
                  </div>
                </div>
              )}

              {isFormOpen && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-3 rounded-xl border border-border/80 bg-muted/30 p-3 shadow-sm md:p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_220px_140px_120px_140px_150px]">
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="案件名"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                      required
                    />
                    <select
                      value={form.customer_id}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customer_id: event.target.value,
                        }))
                      }
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">企業未紐付け</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as ProjectStatus,
                        }))
                      }
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.priority}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          priority: Number(event.target.value) as Project["priority"],
                        }))
                      }
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={form.amount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      inputMode="numeric"
                      placeholder="金額"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                    />
                    <input
                      type="date"
                      value={form.close_date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          close_date: event.target.value,
                        }))
                      }
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                    <input
                      value={form.note}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, note: event.target.value }))
                      }
                      placeholder="メモ"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsFormOpen(false)}
                        className="h-10 px-4"
                      >
                        キャンセル
                      </Button>
                      <Button type="submit" variant="primary" className="h-10 px-6">
                        登録
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="m-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card py-20 text-muted-foreground md:m-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm font-medium">条件に一致する案件がありません</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilters([]);
                  setCurrentPage(1);
                }}
              >
                すべてのフィルターをクリア
              </Button>
            </div>
          ) : (
            <div className="mt-4 px-4 pb-6 md:px-6 lg:pb-10">
              <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="min-w-[1480px] bg-card">
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-b border-border hover:bg-transparent">
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
                        <TableHead className="w-12 px-3 py-3" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProjects.map((project) => {
                        const source = project.source ?? "manual";
                        const customer = project.customer_id
                          ? customers.find((item) => item.id === project.customer_id)
                          : null;
                        const owner = profiles.find(
                          (profile) => profile.id === project.user_id,
                        );
                        const isUnlinked = !project.customer_id;

                        return (
                          <TableRow
                            key={project.id}
                            className={cn(
                              "group border-b border-border/70 bg-card transition-colors duration-200 last:border-b-0 hover:bg-muted/40",
                              isUnlinked && "bg-destructive/[0.035] hover:bg-destructive/[0.06]",
                            )}
                          >
                            {columns.map((column) => {
                              switch (column.id) {
                                case "name":
                                  return (
                                    <TableCell key={column.id} className="px-4 py-3.5">
                                      <div className="flex min-w-0 flex-col gap-0.5">
                                        <div className="flex min-w-0 items-center gap-2">
                                          {isUnlinked && (
                                            <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                                              要紐付け
                                            </span>
                                          )}
                                          <span className="max-w-[18rem] truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                                            {project.name || "録音メモ（案件名未設定）"}
                                          </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {project.labels?.join("、") || "ラベルなし"}
                                        </span>
                                      </div>
                                    </TableCell>
                                  );
                                case "customer":
                                  return (
                                    <TableCell key={column.id} className="px-4 py-3.5">
                                      {customer ? (
                                        <div className="flex min-w-0 flex-col gap-0.5">
                                          <span className="truncate text-sm font-bold text-foreground">
                                            {customer.name}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {customer.industry}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
                                          <Building2 className="h-3.5 w-3.5" />
                                          企業未紐付け
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                case "status":
                                  return (
                                    <TableCell key={column.id} className="px-4 py-3.5">
                                      <StatusBadge status={project.status} />
                                    </TableCell>
                                  );
                                case "priority":
                                  return (
                                    <TableCell key={column.id} className="px-4 py-3.5">
                                      <span
                                        className={cn(
                                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                          priorityColor[project.priority],
                                        )}
                                      >
                                        {priorityLabel[project.priority]}
                                      </span>
                                    </TableCell>
                                  );
                                case "amount":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-foreground/90"
                                    >
                                      {formatAmount(project.amount)}
                                    </TableCell>
                                  );
                                case "owner":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-foreground/80"
                                    >
                                      {owner?.name ?? "未担当"}
                                    </TableCell>
                                  );
                                case "next_action_date":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-muted-foreground"
                                    >
                                      {formatDate(project.next_action_date)}
                                    </TableCell>
                                  );
                                case "updated_at":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-muted-foreground"
                                    >
                                      {formatDate(project.updated_at)}
                                    </TableCell>
                                  );
                                case "source":
                                  return (
                                    <TableCell key={column.id} className="px-4 py-3.5">
                                      <span
                                        className={cn(
                                          "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
                                          sourceColor[source],
                                        )}
                                      >
                                        {sourceLabel[source]}
                                      </span>
                                    </TableCell>
                                  );
                                case "note":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs font-medium text-muted-foreground"
                                    >
                                      <span className="block max-w-[20rem] truncate">
                                        {project.note ?? "-"}
                                      </span>
                                    </TableCell>
                                  );
                                default:
                                  return null;
                              }
                            })}
                            <TableCell className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end pr-4">
                                <ChevronRight className="h-5 w-5 -translate-x-2 text-muted-foreground opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </DndContext>
              </div>

              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProjects.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

interface FilterValueControlProps {
  filter: FilterRule;
  customerOptions: { label: string; value: string }[];
  ownerOptions: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function FilterValueControl({
  filter,
  customerOptions,
  ownerOptions,
  onChange,
}: FilterValueControlProps) {
  const optionMap: Record<string, { label: string; value: string }[]> = {
    status: statusOptions,
    priority: priorityOptions,
    source: sourceOptions,
    link: linkOptions,
    customer: customerOptions,
    owner: ownerOptions,
    date: dateOptions,
  };

  return (
    <Combobox
      options={optionMap[filter.field] ?? []}
      value={filter.value}
      onValueChange={onChange}
      placeholder="値を選択"
      className="h-8 flex-1 text-xs font-medium sm:w-36"
    />
  );
}
