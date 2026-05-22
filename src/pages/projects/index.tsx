import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
<<<<<<< HEAD
  ChevronRight,
=======
>>>>>>> ad7912f9c0ebf86067f25abd270dacdfc10f91dd
  Filter,
  Info,
  Plus,
  RotateCcw,
  Search,
  SquareArrowOutUpRight,
  ChevronRight,
  X,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import ProjectDialogForm from "@/components/projects/ProjectDialogForm";
import type { Project, ProjectStatus } from "../../types";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  ListPagination,
  SortableListTableHead,
  type ListSortOrder,
  type ListTableColumn,
} from "@/components/ui/list-table";
import { SearchBar } from "@/components/ui/search-bar";
import { DatePicker } from "@/components/ui/date-picker";
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
  { id: "status", label: "フェーズ", width: "w-36" },
  { id: "priority", label: "確度", width: "w-28" },
  { id: "amount", label: "金額", width: "w-36" },
  { id: "owner", label: "担当者", width: "w-36" },
  { id: "next_action_date", label: "次回アクション", width: "w-40" },
  { id: "note", label: "メモ", width: "w-80" },
  { id: "updated_at", label: "最終更新", width: "w-32" },
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

const statusOptions = [
  { label: "リード", value: "lead" },
  { label: "提案中", value: "proposing" },
  { label: "交渉中", value: "negotiating" },
  { label: "成約", value: "closed" },
];

const priorityOptions = [
  { label: "高", value: "1" },
  { label: "中", value: "2" },
  { label: "低", value: "3" },
];



function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(
    value.includes("T") ? value : `${value}T00:00:00`,
  );
  if (isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function formatAmount(value: number) {
  if (!value) return "未設定";
  return `${(value / 10000).toLocaleString()}万円`;
}

function compareValue(
  a: string | number | undefined,
  b: string | number | undefined,
) {
  const left = a ?? "";
  const right = b ?? "";
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  return String(left).localeCompare(String(right), "ja");
}

export default function ProjectList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { projects, customers, profiles, addProject, updateProject } =
    useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(
    () => (searchParams.get("sort") as SortKey) || "updated_at",
  );
  const [sortOrder, setSortOrder] = useState<ListSortOrder>(
    () => (searchParams.get("order") as ListSortOrder) || "desc",
  );
  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    const filterFields = [
      "customer",
      "status",
      "priority",
      "amount",
      "owner",
      "next_action_date",
      "updated_at",
    ];
    return filterFields.some((field) => searchParams.has(field));
  });
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    const initialFilters: FilterRule[] = [];
    const filterFields = [
      "customer",
      "status",
      "priority",
      "amount",
      "owner",
      "next_action_date",
      "updated_at",
    ];

    filterFields.forEach((field) => {
      const values = searchParams.getAll(field);
      values.forEach((value) => {
        if (value) {
          initialFilters.push({
            id: Math.random().toString(36).substr(2, 9),
            field,
            value,
          });
        }
      });
    });

    return initialFilters;
  });
  const [columns, setColumns] = useState<ListTableColumn[]>(DEFAULT_COLUMNS);
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });
  const itemsPerPage = 8;

  // URLSearchParams の同期
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (sortKey !== "updated_at") params.set("sort", sortKey);
    if (sortOrder !== "desc") params.set("order", sortOrder);
    if (currentPage > 1) params.set("page", currentPage.toString());

    filters.forEach((filter) => {
      if (filter.value) {
        params.append(filter.field, filter.value);
      }
    });

    setSearchParams(params, { replace: true });
  }, [search, sortKey, sortOrder, currentPage, filters, setSearchParams]);

  const handleOpenAddProjectDialog = () => {
    const formId = "add-project-form";
    openDialog({
      mode: "add",
      eyebrow: "案件",
      breadcrumbs: ["新規作成"],
      title: "案件を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <ProjectDialogForm
          formId={formId}
          submitLabel="案件を追加"
          initialValues={{
            user_id: currentUser?.id ?? "user-001",
            source: "manual",
          }}
          onSubmit={(values) => {
            addProject(values);
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
            案件を追加
          </Button>
        </>
      ),
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
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
        field: "customer",
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
      if (
        !project.customer_id &&
        (project.source ?? "manual") === "recording"
      ) {
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
          customer?.industry?.join("、") ?? "",
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
        if (filter.field === "customer")
          return project.customer_id === filter.value;
        if (filter.field === "status") return project.status === filter.value;
        if (filter.field === "priority")
          return String(project.priority) === filter.value;
        if (filter.field === "amount") {
          if (!filter.value || filter.value === ",") return true;
          const parts = filter.value.split(",");
          const fromStr = parts[0] || "";
          const untilStr = parts[1] || "";
          const fromVal = fromStr.trim() ? Number(fromStr) : 0;
          const untilVal = untilStr.trim() ? Number(untilStr) : Infinity;
          return project.amount >= fromVal && project.amount <= untilVal;
        }
        if (filter.field === "owner") return project.user_id === filter.value;
        if (filter.field === "next_action_date") {
          if (!filter.value || filter.value === ",") return true;
          if (!project.next_action_date) return false;
          const dateTime = new Date(
            project.next_action_date.includes("T")
              ? project.next_action_date
              : `${project.next_action_date}T00:00:00`,
          ).getTime();
          const parts = filter.value.split(",");
          const fromStr = parts[0] || "";
          const untilStr = parts[1] || "";
          const fromTime = fromStr ? new Date(fromStr.replace(/\//g, "-")).getTime() : 0;
          const untilTime = untilStr
            ? new Date(untilStr.replace(/\//g, "-")).getTime() + 24 * 60 * 60 * 1000 - 1
            : Infinity;
          return dateTime >= fromTime && dateTime <= untilTime;
        }
        if (filter.field === "updated_at") {
          if (!filter.value || filter.value === ",") return true;
          const dateTime = new Date(project.updated_at).getTime();
          const parts = filter.value.split(",");
          const fromStr = parts[0] || "";
          const untilStr = parts[1] || "";
          const fromTime = fromStr ? new Date(fromStr.replace(/\//g, "-")).getTime() : 0;
          const untilTime = untilStr
            ? new Date(untilStr.replace(/\//g, "-")).getTime() + 24 * 60 * 60 * 1000 - 1
            : Infinity;
          return dateTime >= fromTime && dateTime <= untilTime;
        }
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
      const values: Record<
        SortKey,
        [string | number | undefined, string | number | undefined]
      > = {
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

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="custom-scrollbar flex-1 overflow-auto bg-muted/5">
          <div className="bg-background/95 backdrop-blur-md">
            <div className="px-4 pb-4 pt-6 md:px-6">
              <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                <div className="flex w-full shrink-0 items-center gap-2 py-1 md:w-auto">
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
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleOpenAddProjectDialog}
                    className="ml-auto h-9 w-9 shrink-0 rounded-full shadow-md md:hidden"
                    aria-label="案件を登録"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center md:flex-initial md:justify-end">
                  <div className="flex flex-1 flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center sm:gap-2 md:flex-initial">
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
                            onClick={() =>
                              setIsFilterOpen((current) => !current)
                            }
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
                            <span className="text-sm md:hidden">
                              フィルター
                            </span>
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
                    onClick={handleOpenAddProjectDialog}
                    className="hidden h-10 w-full shrink-0 justify-center gap-2 px-4 shadow-md sm:w-auto md:inline-flex"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span className="text-sm font-bold">案件を登録</span>
                  </Button>
                </div>
              </div>

              {isFilterOpen && (
                <>
                  <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 md:p-4">
                    <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full min-w-0">
                    {filters.map((filter) => (
                      <div
                        key={filter.id}
                        className={cn(
                          "flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 sm:p-1.5 bg-background border border-border/60 rounded-xl shadow-sm animate-in zoom-in-95 duration-200 w-full sm:w-auto min-w-0 overflow-hidden",
                          filter.field === "amount" || filter.field === "date"
                            ? "col-span-2"
                            : "col-span-1",
                        )}
                      >
                        <Select
                          value={filter.field}
                          onValueChange={(value) =>
                            updateFilter(filter.id, { field: value, value: "" })
                          }
                        >
                          <SelectTrigger className="order-1 h-8 flex-1 sm:flex-initial sm:w-28 bg-muted/30 border-none shadow-none text-xs font-bold truncate min-w-[80px] sm:min-w-[120px]">
                            <SelectValue placeholder="項目" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">顧客名</SelectItem>
                            <SelectItem value="status">フェーズ</SelectItem>
                            <SelectItem value="priority">確度</SelectItem>
                            <SelectItem value="amount">金額</SelectItem>
                            <SelectItem value="owner">担当者</SelectItem>
                            <SelectItem value="next_action_date">次回アクション</SelectItem>
                            <SelectItem value="updated_at">最終更新</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="order-3 w-px h-4 bg-border/60 mx-1 shrink-0 hidden sm:block" />

                        <FilterValueControl
                          filter={filter}
                          customerOptions={customerOptions}
                          ownerOptions={ownerOptions}
                          onChange={(value) =>
                            updateFilter(filter.id, { value })
                          }
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilter(filter.id)}
                          className="order-2 sm:order-4 w-8 h-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 rounded-lg ml-auto sm:ml-1 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="col-span-2 flex items-center justify-between gap-3 pt-1 w-full min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addFilter}
                        className="h-9 px-3 border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 rounded-md text-xs font-bold transition-all shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        条件追加
                      </Button>

                      {filters.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFilters([]);
                            setIsFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className="h-9 px-3 text-muted-foreground hover:text-destructive gap-1.5 rounded-md text-xs font-bold transition-all shrink-0 ml-auto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          条件クリア
                        </Button>
                      )}
                    </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="m-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card py-20 text-muted-foreground md:m-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm font-medium">
                条件に一致する案件がありません
              </p>
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
                <Table className="min-w-[1480px] bg-card">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
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
                  </DndContext>
                  <TableBody>
                    {paginatedProjects.map((project) => {
                      const customer = project.customer_id
                        ? customers.find(
                            (item) => item.id === project.customer_id,
                          )
                        : null;
                      const owner = profiles.find(
                        (profile) => profile.id === project.user_id,
                      );
                      const isUnlinked = !project.customer_id;

                      return (
                        <TableRow
                          key={project.id}
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className={cn(
                            "group cursor-pointer border-b border-border/70 bg-card transition-colors duration-200 last:border-b-0 hover:bg-muted/40",
                            isUnlinked &&
                              "bg-destructive/[0.035] hover:bg-destructive/6",
                          )}
                        >
                          {columns.map((column) => {
                            switch (column.id) {
                              case "name":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5"
                                  >
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                      <div className="flex min-w-0 items-center gap-2">
                                        {isUnlinked && (
                                          <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                                            要紐付け
                                          </span>
                                        )}
                                        <span className="max-w-[18rem] truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                                          {project.name ||
                                            "録音メモ（案件名未設定）"}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {project.labels?.join("、") ||
                                          "ラベルなし"}
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              case "customer":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5"
                                  >
                                    {customer ? (
                                      <div className="flex min-w-0 flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="truncate text-sm font-bold text-foreground">
                                            {customer.name}
                                          </span>
<<<<<<< HEAD
=======
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/customers/${customer.id}`);
                                            }}
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/20"
                                            title="顧客詳細を表示"
                                          >
                                            <SquareArrowOutUpRight className="h-3 w-3" />
                                          </button>
>>>>>>> ad7912f9c0ebf86067f25abd270dacdfc10f91dd
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate">
                                          {customer.industry?.join("、")}
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
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <select
                                      value={project.status}
                                      onChange={(event) =>
                                        updateProject(project.id, {
                                          status: event.target.value as ProjectStatus,
                                        })
                                      }
                                      className="h-8 w-28 rounded-md border border-input bg-background px-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                                    >
                                      {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </TableCell>
                                );
                              case "priority":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <select
                                      value={String(project.priority)}
                                      onChange={(event) =>
                                        updateProject(project.id, {
                                          priority: Number(event.target.value) as Project["priority"],
                                        })
                                      }
                                      className={cn(
                                        "h-8 w-20 rounded-md border border-input bg-background px-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                                        priorityColor[project.priority],
                                      )}
                                    >
                                      {priorityOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
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
                                    {formatDateTime(project.updated_at)}
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
                              <ChevronRight className="h-4.5 w-4.5 -translate-x-2 text-muted-foreground opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
    customer: customerOptions,
    owner: ownerOptions,
  };

  if (filter.field === "updated_at" || filter.field === "next_action_date") {
    return (
      <div className="order-4 sm:order-3 flex items-center gap-1 w-full sm:w-auto min-w-0">
        <DatePicker
          value={(filter.value.split(",")[0] || "").replace(/\//g, "-")}
          onChange={(value) => {
            const parts = filter.value.split(",");
            const dateVal = value ? value.replace(/-/g, "/") : "";
            onChange(`${dateVal},${parts[1] || ""}`);
          }}
          size="sm"
          className="min-w-0 flex-1 sm:w-32 sm:flex-initial"
          buttonClassName="text-xs"
        />
        <span className="text-xs text-muted-foreground font-bold shrink-0">
          〜
        </span>
        <DatePicker
          value={(filter.value.split(",")[1] || "").replace(/\//g, "-")}
          onChange={(value) => {
            const parts = filter.value.split(",");
            const dateVal = value ? value.replace(/-/g, "/") : "";
            onChange(`${parts[0] || ""},${dateVal}`);
          }}
          size="sm"
          className="min-w-0 flex-1 sm:w-32 sm:flex-initial"
          buttonClassName="text-xs"
        />
      </div>
    );
  }

  if (filter.field === "amount") {
    return (
      <div className="order-4 sm:order-3 flex items-center gap-1 w-full sm:w-auto min-w-0">
        <input
          type="number"
          value={filter.value.split(",")[0] || ""}
          onChange={(e) => {
            const parts = filter.value.split(",");
            onChange(`${e.target.value},${parts[1] || ""}`);
          }}
          placeholder="下限"
          className="h-8 flex-1 sm:flex-initial sm:w-28 rounded-lg border border-border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-w-0"
        />
        <span className="text-xs text-muted-foreground font-bold shrink-0">
          〜
        </span>
        <input
          type="number"
          value={filter.value.split(",")[1] || ""}
          onChange={(e) => {
            const parts = filter.value.split(",");
            onChange(`${parts[0] || ""},${e.target.value}`);
          }}
          placeholder="上限"
          className="h-8 flex-1 sm:flex-initial sm:w-28 rounded-lg border border-border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-w-0"
        />
      </div>
    );
  }

  return (
    <Combobox
      options={optionMap[filter.field] ?? []}
      value={filter.value}
      onValueChange={onChange}
      placeholder="値を選択"
      className="order-4 sm:order-3 w-full sm:w-48 h-8 text-xs font-medium min-w-0"
    />
  );
}
