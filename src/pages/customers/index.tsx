import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { useDataStore } from "../../context/DataStoreContext";
import { useAuth } from "../../context/AuthContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import CustomerDialogForm from "@/components/customers/CustomerDialogForm";
import {
  RankBadge,
  StatusBadge,
} from "../../components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { cn } from "@/lib/utils";
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
  ListPagination,
  SortableListTableHead,
  type ListSortOrder,
  type ListTableColumn,
} from "@/components/ui/list-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Filter,
  Plus,
  X,
  ChevronRight,
  Pin,
  PinOff,
  Search,
  RotateCcw,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

function formatDateTime(iso: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  } catch {
    return iso;
  }
}

const DEFAULT_COLUMNS: ListTableColumn[] = [
  { id: "pin", label: "ピン留め", width: "w-24" },
  { id: "rank", label: "ランク", width: "w-20" },
  { id: "company_code", label: "企業コード", width: "w-28" },
  { id: "name", label: "顧客名", width: "w-72" },
  { id: "phone", label: "電話番号", width: "w-36" },
  { id: "email", label: "メール", width: "w-48" },
  { id: "status", label: "フェーズ", width: "w-28" },
  { id: "labels", label: "ラベル", width: "w-48" },
  { id: "acquisition_source", label: "流入経路", width: "w-36" },
  { id: "amount", label: "案件金額", width: "w-36" },
  { id: "projects", label: "進行中の案件数", width: "w-40" },
  { id: "accessed", label: "最終更新", width: "w-32" },
];

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export default function CustomerList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { customers, projects, addCustomer, updateCustomer } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortKey, setSortKey] = useState<string>(
    () => searchParams.get("sort") || "accessed",
  );
  const [sortOrder, setSortOrder] = useState<ListSortOrder>(
    () => (searchParams.get("order") as ListSortOrder) || "desc",
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    const initialFilters: FilterRule[] = [];
    const filterFields = [
      "rank",
      "labels",
      "industry",
      "acquisition_source",
      "amount",
      "date",
    ];

    filterFields.forEach((field) => {
      const values = searchParams.getAll(field);
      values.forEach((value) => {
        if (value) {
          initialFilters.push({
            id: Math.random().toString(36).substr(2, 9),
            field,
            operator: "contains",
            value,
          });
        }
      });
    });

    return initialFilters;
  });
  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    const filterFields = [
      "rank",
      "labels",
      "industry",
      "acquisition_source",
      "amount",
      "date",
    ];
    return filterFields.some((field) => searchParams.has(field));
  });
  const [columns, setColumns] = useState<ListTableColumn[]>(DEFAULT_COLUMNS);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const itemsPerPage = 8;

  // URLSearchParams の同期
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (sortKey !== "accessed") params.set("sort", sortKey);
    if (sortOrder !== "desc") params.set("order", sortOrder);
    if (currentPage > 1) params.set("page", currentPage.toString());

    filters.forEach((filter) => {
      if (filter.value) {
        params.append(filter.field, filter.value);
      }
    });

    setSearchParams(params, { replace: true });
  }, [search, sortKey, sortOrder, currentPage, filters, setSearchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    customers.forEach((c) => c.labels?.forEach((l) => labels.add(l)));
    return Array.from(labels)
      .sort()
      .map((l) => ({ label: l, value: l }));
  }, [customers]);

  const allIndustries = useMemo(() => {
    const industries = new Set<string>();
    customers.forEach((c) => c.industry?.forEach((ind) => industries.add(ind)));
    return Array.from(industries)
      .sort()
      .map((i) => ({ label: i, value: i }));
  }, [customers]);

  const allAcquisitionSources = useMemo(() => {
    const sources = new Set<string>();
    customers.forEach((c) => {
      if (c.acquisition_source) sources.add(c.acquisition_source);
    });
    return Array.from(sources)
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [customers]);

  const rankOptions = [
    { label: "ランクA", value: "A" },
    { label: "ランクB", value: "B" },
    { label: "ランクC", value: "C" },
    { label: "ランクD", value: "D" },
  ];

  const statusOptions = [
    { label: "リード", value: "lead" },
    { label: "提案中", value: "proposing" },
    { label: "商談中", value: "negotiating" },
    { label: "既存顧客", value: "active" },
    { label: "休眠", value: "dormant" },
  ];

  const handleOpenAddCustomerDialog = () => {
    const formId = "customer-add-form";

    openDialog({
      mode: "add",
      eyebrow: "顧客",
      breadcrumbs: ["新規作成"],
      title: "顧客を登録",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <CustomerDialogForm
          formId={formId}
          submitLabel="顧客を登録"
          onSubmit={(values) => {
            const record = addCustomer({
              ...values,
              created_by: currentUser?.id ?? "user-001",
            });
            closeDialog();
            navigate(`/customers/${record.id}`);
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={formId} variant="primary">
            顧客を登録
          </Button>
        </>
      ),
    });
  };

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: Math.random().toString(36).substr(2, 9),
      field: "rank",
      operator: "contains",
      value: "",
    };
    setFilters([...filters, newFilter]);
    setCurrentPage(1);
    setIsFilterOpen(true);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
    setCurrentPage(1);
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
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

  const filtered = useMemo(() => {
    let list = [...customers];

    // Main search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company_code ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.industry?.join("、") ?? "").toLowerCase().includes(q) ||
          (c.labels?.join("、") ?? "").toLowerCase().includes(q) ||
          (c.acquisition_source ?? "").toLowerCase().includes(q),
      );
    }

    // Advanced filters
    filters.forEach((filter) => {
      if (!filter.value && filter.field !== "is_pinned") return;

      list = list.filter((c) => {
        const val = filter.value;
        switch (filter.field) {
          case "rank":
            return c.rank === val;
          case "labels":
            return (c.labels?.join("、") ?? "").includes(val);
          case "industry":
            return c.industry?.includes(val);
          case "acquisition_source":
            return (c.acquisition_source ?? "")
              .toLowerCase()
              .includes(val.toLowerCase());
          case "amount": {
            if (!val || val === ",") return true;
            const total = projects
              .filter((p) => p.customer_id === c.id && p.status !== "closed")
              .reduce((sum, p) => sum + p.amount, 0);
            const parts = val.split(",");
            const fromStr = parts[0] || "";
            const untilStr = parts[1] || "";
            const fromVal = fromStr.trim() ? Number(fromStr) : 0;
            const untilVal = untilStr.trim() ? Number(untilStr) : Infinity;
            return total >= fromVal && total <= untilVal;
          }
          case "date": {
            if (!val || val === ",") return true;
            const dateTime = new Date(c.last_accessed_at).getTime();
            const parts = val.split(",");
            const fromStr = parts[0] || "";
            const untilStr = parts[1] || "";
            const fromTime = fromStr
              ? new Date(fromStr.replace(/\//g, "-")).getTime()
              : 0;
            const untilTime = untilStr
              ? new Date(untilStr.replace(/\//g, "-")).getTime() +
                24 * 60 * 60 * 1000 -
                1
              : Infinity;
            return dateTime >= fromTime && dateTime <= untilTime;
          }
          default:
            return true;
        }
      });
    });

    list.sort((a, b) => {
      if (sortKey === "pin") {
        const pinA = a.is_pinned ? 1 : 0;
        const pinB = b.is_pinned ? 1 : 0;
        const comparison = pinA - pinB;
        return sortOrder === "desc" ? -comparison : comparison;
      }

      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }

      const comparison = (() => {
        if (sortKey === "accessed") {
          return (
            new Date(a.last_accessed_at).getTime() -
            new Date(b.last_accessed_at).getTime()
          );
        }
        if (sortKey === "name") {
          return a.name.localeCompare(b.name, "ja");
        }
        if (sortKey === "company_code") {
          return (a.company_code ?? "").localeCompare(b.company_code ?? "");
        }
        if (sortKey === "phone") {
          return (a.phone ?? "").localeCompare(b.phone ?? "");
        }
        if (sortKey === "email") {
          return (a.email ?? "").localeCompare(b.email ?? "");
        }
        if (sortKey === "acquisition_source") {
          return (a.acquisition_source ?? "").localeCompare(
            b.acquisition_source ?? "",
          );
        }
        if (sortKey === "amount") {
          const amountA = projects
            .filter((p) => p.customer_id === a.id && p.status !== "closed")
            .reduce((sum, p) => sum + p.amount, 0);
          const amountB = projects
            .filter((p) => p.customer_id === b.id && p.status !== "closed")
            .reduce((sum, p) => sum + p.amount, 0);
          return amountA - amountB;
        }
        if (sortKey === "rank") {
          return a.rank.localeCompare(b.rank);
        }
        if (sortKey === "projects") {
          const countA = projects.filter(
            (p) => p.customer_id === a.id && p.status !== "closed",
          ).length;
          const countB = projects.filter(
            (p) => p.customer_id === b.id && p.status !== "closed",
          ).length;
          return countA - countB;
        }
        return 0;
      })();
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return list;
  }, [search, filters, sortKey, sortOrder, customers, projects]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* 独立スクロールするメインコンテンツエリア */}
        <div className="flex-1 overflow-auto bg-muted/5 custom-scrollbar">
          {/* ヘッダー＆操作バー */}
          <div className="bg-background/95 backdrop-blur-md">
            <div className="px-4 md:px-6 pt-6 pb-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* 左側: タイトル＆ツールチップ */}
                <div className="flex items-center gap-2 shrink-0 py-1">
                  <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    顧客一覧
                  </h1>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors cursor-help outline-none"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-popover text-popover-foreground border border-border shadow-md"
                      >
                        <p>企業ごとの案件・活動状況を管理します</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* 右側: 検索バー (コンパクト＆クリック拡張機能付き) ＆ 各種操作ボタン */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 md:flex-initial md:justify-end">
                  <div className="flex-1 md:flex-initial flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center justify-end">
                    {/* 検索バー: 非フォーカス時はコンパクト、クリック・フォーカス時または検索文字列あり時にスムーズに拡張 */}
                    <div
                      className={cn(
                        "transition-all duration-300 ease-in-out max-w-full shrink-0",
                        isSearchFocused || search.trim() !== ""
                          ? "w-full sm:w-72 md:w-80"
                          : "w-full sm:w-44 md:w-48",
                      )}
                    >
                      <SearchBar
                        placeholder="顧客名・企業コード・電話番号・メール等で検索"
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

                    {/* フィルター ＆ ピン留めのみ */}
                    <div className="flex gap-2 items-center justify-between sm:justify-center shrink-0 w-full sm:w-auto">
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
                              onClick={() => setIsFilterOpen(!isFilterOpen)}
                              className={cn(
                                "h-10 border border-border/50 transition-all shadow-sm flex-1 sm:flex-initial justify-center",
                                filters.length === 0
                                  ? "px-3 md:w-10 md:px-0 gap-2 md:gap-0"
                                  : "px-3 md:px-2.5 gap-2 md:gap-1.5",
                                isFilterOpen
                                  ? "bg-primary/10 text-primary border-primary shadow-sm"
                                  : filters.length > 0
                                    ? "bg-secondary text-foreground border-border"
                                    : "bg-card",
                              )}
                            >
                              <Filter className="w-4 h-4" />
                              <span className="text-sm md:hidden">
                                フィルター
                              </span>
                              {filters.length > 0 && (
                                <span
                                  className={cn(
                                    "flex items-center justify-center text-[10px] font-bold rounded-full w-4 h-4",
                                    isFilterOpen
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-primary text-primary-foreground",
                                  )}
                                >
                                  {filters.length}
                                </span>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="hidden md:block bg-popover text-popover-foreground border border-border shadow-md"
                          >
                            <p>
                              フィルター
                              {filters.length > 0 ? ` (${filters.length})` : ""}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* 顧客を登録ボタン */}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleOpenAddCustomerDialog}
                    className={cn(
                      "gap-2 shadow-md h-10 px-4 shrink-0 w-full sm:w-auto justify-center",
                      isFilterOpen && "hidden sm:inline-flex",
                    )}
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span className="text-sm font-bold">顧客を登録</span>
                  </Button>
                </div>
              </div>

              {/* 詳細フィルターエリア (スティッキー内) */}
              {isFilterOpen && (
                <>
                  <div className="p-3 md:p-4 bg-muted/40 border border-border/80 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm mt-3">
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
                          onValueChange={(val) =>
                            updateFilter(filter.id, { field: val, value: "" })
                          }
                        >
                          <SelectTrigger className="order-1 h-8 flex-1 sm:flex-initial sm:w-28 bg-muted/30 border-none shadow-none text-xs font-bold truncate min-w-[80px] sm:min-w-[120px]">
                            <SelectValue placeholder="項目" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rank">ランク</SelectItem>
                            <SelectItem value="status">フェーズ</SelectItem>
                            <SelectItem value="labels">ラベル</SelectItem>
                            <SelectItem value="industry">業種</SelectItem>
                            <SelectItem value="acquisition_source">
                              流入経路
                            </SelectItem>
                            <SelectItem value="amount">案件金額</SelectItem>
                            <SelectItem value="date">最終更新</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="order-3 w-px h-4 bg-border/60 mx-1 shrink-0 hidden sm:block" />

                        {filter.field === "rank" ? (
                          <Combobox
                            options={rankOptions}
                            value={filter.value}
                            onValueChange={(val) =>
                              updateFilter(filter.id, { value: val })
                            }
                            placeholder="ランクを選択"
                            className="order-4 sm:order-3 w-full sm:w-48 h-8 text-xs font-medium min-w-0"
                          />
                        ) : filter.field === "status" ? (
                          <Combobox
                            options={statusOptions}
                            value={filter.value}
                            onValueChange={(val) =>
                              updateFilter(filter.id, { value: val })
                            }
                            placeholder="フェーズを選択"
                            className="order-4 sm:order-3 w-full sm:w-48 h-8 text-xs font-medium min-w-0"
                          />
                        ) : filter.field === "labels" ? (
                          <Combobox
                            options={allLabels}
                            value={filter.value}
                            onValueChange={(val) =>
                              updateFilter(filter.id, { value: val })
                            }
                            placeholder="ラベルを選択"
                            className="order-4 sm:order-3 w-full sm:w-48 h-8 text-xs font-medium min-w-0"
                          />
                        ) : filter.field === "industry" ? (
                          <Combobox
                            options={allIndustries}
                            value={filter.value}
                            onValueChange={(val) =>
                              updateFilter(filter.id, { value: val })
                            }
                            placeholder="業種を選択"
                            className="order-4 sm:order-3 w-full sm:w-48 h-8 text-xs font-medium min-w-0"
                          />
                        ) : filter.field === "acquisition_source" ? (
                          <Combobox
                            options={allAcquisitionSources}
                            value={filter.value}
                            onValueChange={(val) =>
                              updateFilter(filter.id, { value: val })
                            }
                            placeholder="流入経路を選択"
                            className="order-4 sm:order-3 w-full sm:w-48 h-8 text-xs font-medium min-w-0"
                          />
                        ) : filter.field === "date" ? (
                          <div className="order-4 sm:order-3 flex items-center gap-1 w-full sm:w-auto min-w-0">
                            <DatePicker
                              value={(filter.value.split(",")[0] || "").replace(
                                /\//g,
                                "-",
                              )}
                              onChange={(value) => {
                                const parts = filter.value.split(",");
                                const dateVal = value ? value.replace(/-/g, "/") : "";
                                updateFilter(filter.id, {
                                  value: `${dateVal},${parts[1] || ""}`,
                                });
                              }}
                              size="sm"
                              className="min-w-0 flex-1 sm:w-32 sm:flex-initial"
                              buttonClassName="text-xs"
                            />
                            <span className="text-xs text-muted-foreground font-bold shrink-0">
                              〜
                            </span>
                            <DatePicker
                              value={(filter.value.split(",")[1] || "").replace(
                                /\//g,
                                "-",
                              )}
                              onChange={(value) => {
                                const parts = filter.value.split(",");
                                const dateVal = value ? value.replace(/-/g, "/") : "";
                                updateFilter(filter.id, {
                                  value: `${parts[0] || ""},${dateVal}`,
                                });
                              }}
                              size="sm"
                              className="min-w-0 flex-1 sm:w-32 sm:flex-initial"
                              buttonClassName="text-xs"
                            />
                          </div>
                        ) : filter.field === "amount" ? (
                          <div className="order-4 sm:order-3 flex items-center gap-1 w-full sm:w-auto min-w-0">
                            <input
                              type="number"
                              value={filter.value.split(",")[0] || ""}
                              onChange={(e) => {
                                const parts = filter.value.split(",");
                                updateFilter(filter.id, {
                                  value: `${e.target.value},${parts[1] || ""}`,
                                });
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
                                updateFilter(filter.id, {
                                  value: `${parts[0] || ""},${e.target.value}`,
                                });
                              }}
                              placeholder="上限"
                              className="h-8 flex-1 sm:flex-initial sm:w-28 rounded-lg border border-border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-w-0"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) =>
                              updateFilter(filter.id, {
                                value: e.target.value,
                              })
                            }
                            placeholder="値を入力"
                            className="order-4 sm:order-3 h-8 w-full sm:w-48 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-w-0"
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilter(filter.id)}
                          className="order-2 sm:order-4 w-8 h-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 rounded-lg ml-auto sm:ml-1 shrink-0"
                        >
                          <X className="w-4 h-4" />
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
                          className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-destructive font-medium transition-colors shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          条件クリア
                        </Button>
                      )}
                    </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleOpenAddCustomerDialog}
                    className="mt-3 h-10 w-full justify-center gap-2 px-4 shadow-md sm:hidden"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span className="text-sm font-bold">鬘ｧ螳｢繧定ｿｽ蜉</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 bg-card rounded-2xl border border-border/50 border-dashed m-4 md:m-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-sm font-medium">
                条件に一致する顧客がありません
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
            <div className="px-4 md:px-6 pb-6 lg:pb-10 mt-4">
              <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="min-w-[600px] sm:min-w-[1000px] bg-card">
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
                      {paginatedCustomers.map((customer) => {
                        const activeProjects = projects.filter(
                          (p) =>
                            p.customer_id === customer.id &&
                            p.status !== "closed",
                        );

                        const isMinimalCustomer =
                          !customer.phone &&
                          !customer.email &&
                          !customer.company_code &&
                          !customer.acquisition_source &&
                          (!customer.labels || customer.labels.length === 0) &&
                          !customer.address &&
                          !customer.website &&
                          !customer.employee_count;

                        return (
                          <TableRow
                            key={customer.id}
                            onClick={() =>
                              navigate(`/customers/${customer.id}`)
                            }
                            className={cn(
                              "group cursor-pointer border-b border-border/70 bg-card transition-colors duration-200 last:border-b-0 hover:bg-muted/40",
                              customer.is_pinned &&
                                "bg-primary/[0.035] hover:bg-primary/[0.07]",
                            )}
                          >
                            {columns.map((column) => {
                              switch (column.id) {
                                case "pin":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className={cn(
                                        "border-r border-border/60 px-3 py-3.5",
                                        customer.is_pinned &&
                                          "bg-primary/[0.035]",
                                      )}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateCustomer(customer.id, {
                                            is_pinned: !customer.is_pinned,
                                          });
                                        }}
                                        className={cn(
                                          "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                                          customer.is_pinned
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted",
                                        )}
                                      >
                                        {customer.is_pinned ? (
                                          <Pin className="w-3.5 h-3.5 fill-current" />
                                        ) : (
                                          <PinOff className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </TableCell>
                                  );
                                case "rank":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5"
                                    >
                                      <RankBadge
                                        rank={customer.rank}
                                        size="lg"
                                      />
                                    </TableCell>
                                  );
                                case "company_code":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs font-mono font-bold text-muted-foreground"
                                    >
                                      {customer.company_code || "-"}
                                    </TableCell>
                                  );
                                case "name":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="max-w-[18rem] truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                                            {customer.name}
                                          </span>
                                          {isMinimalCustomer && (
                                            <TooltipProvider
                                              delayDuration={100}
                                            >
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span
                                                    className="inline-flex items-center text-amber-500 cursor-help"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                    }}
                                                  >
                                                    <AlertCircle className="w-4 h-4 animate-pulse" />
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                  side="top"
                                                  className="bg-popover text-popover-foreground border border-border shadow-md"
                                                >
                                                  <p>
                                                    詳細情報が不足しています
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {customer.industry?.join("、")}
                                        </span>
                                      </div>
                                    </TableCell>
                                  );
                                case "phone":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs text-foreground font-medium"
                                    >
                                      {customer.phone || "-"}
                                    </TableCell>
                                  );
                                case "email":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs text-muted-foreground truncate max-w-[14rem]"
                                    >
                                      {customer.email || "-"}
                                    </TableCell>
                                  );
                                case "labels":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5"
                                    >
                                      <div className="flex flex-wrap gap-1 max-w-[16rem]">
                                        {customer.labels &&
                                        customer.labels.length > 0 ? (
                                          customer.labels.map((lbl, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-0.5 rounded bg-muted text-foreground text-[10px] font-medium truncate max-w-[8rem]"
                                            >
                                              {lbl}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-muted-foreground/40">
                                            -
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                  );
                                case "acquisition_source":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs text-foreground font-medium truncate max-w-[10rem]"
                                    >
                                      {customer.acquisition_source || "-"}
                                    </TableCell>
                                  );
                                case "amount": {
                                  const totalAmount = activeProjects.reduce(
                                    (sum, p) => sum + p.amount,
                                    0,
                                  );
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs font-bold text-foreground"
                                    >
                                      {totalAmount > 0
                                        ? `¥${totalAmount.toLocaleString()}`
                                        : "-"}
                                    </TableCell>
                                  );
                                }
                                case "projects":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5"
                                    >
                                      {activeProjects.length > 0 ? (
                                        <Popover
                                          open={openPopoverId === customer.id}
                                        >
                                          <PopoverTrigger asChild>
                                            <div
                                              className="-m-1 inline-flex cursor-help items-center gap-1 rounded-md px-2 py-1 transition-all hover:bg-primary/10 hover:text-primary group/num"
                                              onMouseEnter={() =>
                                                setOpenPopoverId(customer.id)
                                              }
                                              onMouseLeave={() =>
                                                setOpenPopoverId(null)
                                              }
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <span className="text-sm font-bold text-foreground group-hover/num:text-primary transition-colors">
                                                {activeProjects.length}
                                              </span>
                                              <span className="text-xs text-muted-foreground font-medium group-hover/num:text-primary transition-colors">
                                                件
                                              </span>
                                            </div>
                                          </PopoverTrigger>
                                          <PopoverContent
                                            className="w-72 p-0 overflow-hidden backdrop-blur-xl bg-background/80 border-border/40 shadow-2xl animate-in zoom-in-95 duration-200 z-50"
                                            onMouseEnter={() =>
                                              setOpenPopoverId(customer.id)
                                            }
                                            onMouseLeave={() =>
                                              setOpenPopoverId(null)
                                            }
                                          >
                                            <div className="bg-primary/5 px-4 py-3 border-b border-border/40">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                                  進行中の案件一覧
                                                </h4>
                                                <span className="text-[10px] font-bold text-muted-foreground/60">
                                                  {activeProjects.length}件
                                                </span>
                                              </div>
                                            </div>
                                            <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar bg-background/40">
                                              <div className="flex flex-col gap-1">
                                                {activeProjects.map((p) => (
                                                  <div
                                                    key={p.id}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenPopoverId(null);
                                                      navigate(
                                                        `/projects/${p.id}?from=/customers`,
                                                      );
                                                    }}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group/item cursor-pointer"
                                                  >
                                                    <StatusBadge
                                                      status={p.status}
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                      <span className="text-xs font-bold text-foreground truncate group-hover/item:text-primary transition-colors">
                                                        {p.name}
                                                      </span>
                                                      <span className="text-[10px] text-muted-foreground font-medium">
                                                        最終更新:{" "}
                                                        {formatDateTime(
                                                          p.updated_at ||
                                                            p.created_at,
                                                        )}
                                                      </span>
                                                    </div>
                                                    <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/30 group-hover/item:text-primary transition-colors" />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <span className="text-sm font-bold text-muted-foreground/40">
                                          0{" "}
                                          <span className="text-xs font-medium">
                                            件
                                          </span>
                                        </span>
                                      )}
                                    </TableCell>
                                  );
                                case "accessed":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-4 py-3.5 text-xs font-semibold text-muted-foreground"
                                    >
                                      {formatDateTime(
                                        customer.last_accessed_at,
                                      )}
                                    </TableCell>
                                  );
                                default:
                                  return null;
                              }
                            })}
                            <TableCell className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end pr-4">
                                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
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
                totalItems={filtered.length}
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
