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
import {
  activeFilterComboboxClassName,
  FilterPill,
  filterComboboxClassName,
  filterPriceInputClassName,
  FilterRangeSeparator,
  formatPriceInputValue,
  parsePriceInputValue,
} from "@/components/ui/filter-pill";
import { cn } from "@/lib/utils";

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
  ListTableSurface,
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
import {
  Filter,
  Plus,
  ChevronRight,
  Search,
  RotateCcw,
  Info,
  AlertCircle,
  Pin,
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
import type { Customer } from "../../types";

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
  { id: "pin", label: "", width: "w-12", sortable: false, draggable: false },
  { id: "rank", label: "ランク", width: "w-16", align: "center" },
  { id: "company_code", label: "企業コード", width: "w-24" },
  { id: "name", label: "顧客名", width: "w-64" },
  { id: "phone", label: "電話番号", width: "w-32" },
  { id: "email", label: "メール", width: "w-40" },
  { id: "status", label: "フェーズ", width: "w-24" },
  { id: "labels", label: "ラベル", width: "w-40" },
  { id: "acquisition_source", label: "流入経路", width: "w-32" },
  { id: "amount", label: "案件金額", width: "w-32" },
  { id: "projects", label: "進行中の案件数", width: "w-36" },
  { id: "accessed", label: "最終更新", width: "w-28" },
];

function getAcquisitionSource(customer: Customer) {
  return customer.acquisition_source?.trim() || "手動登録";
}

function hasIncompleteDetails(customer: Customer) {
  return (
    !customer.phone &&
    !customer.email &&
    !customer.company_code &&
    (!customer.labels || customer.labels.length === 0) &&
    !customer.address &&
    !customer.website &&
    !customer.employee_count
  );
}

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const CUSTOMER_FILTER_FIELDS = [
  "rank",
  "status",
  "labels",
  "acquisition_source",
  "amount",
];

export default function CustomerList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { customers, projects, addCustomer, updateCustomer } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollRight = target.scrollWidth - target.scrollLeft - target.clientWidth;
    setShowLeftIndicator(target.scrollLeft > 5);
    setShowRightIndicator(scrollRight > 5);
  };
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
    return CUSTOMER_FILTER_FIELDS.map((field) => ({
      id: Math.random().toString(36).substr(2, 9),
      field,
      operator: "contains",
      value: searchParams.get(field) ?? "",
    }));
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
  const activeFilterCount = filters.filter((filter) => filter.value).length;

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

  const allAcquisitionSources = useMemo(() => {
    const sources = new Set<string>();
    customers.forEach((c) => {
      sources.add(getAcquisitionSource(c));
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
          getAcquisitionSource(c).toLowerCase().includes(q),
      );
    }

    // Advanced filters
    filters.forEach((filter) => {
        if (!filter.value) return;

      list = list.filter((c) => {
        const val = filter.value;
        switch (filter.field) {
          case "rank":
            return c.rank === val;
          case "status":
            return c.status === val;
          case "labels":
            return (c.labels?.join("、") ?? "").includes(val);
          case "acquisition_source":
            return getAcquisitionSource(c).toLowerCase().includes(val.toLowerCase());
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
      const incompleteA = hasIncompleteDetails(a);
      const incompleteB = hasIncompleteDetails(b);
      if (incompleteA !== incompleteB) {
        return incompleteA ? -1 : 1;
      }

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
          return getAcquisitionSource(a).localeCompare(getAcquisitionSource(b));
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
        <div className="flex-1 overflow-auto bg-muted/5 custom-scrollbar pb-28 md:pb-0">
          {/* ヘッダー＆操作バー */}
          <div className="bg-background/95 backdrop-blur-md">
            <div className="px-4 md:px-6 pt-6 pb-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* 左側: タイトル＆ツールチップ */}
                <div className="flex w-full items-center gap-2 shrink-0 py-1 md:w-auto">
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
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleOpenAddCustomerDialog}
                    className="ml-auto h-9 w-9 shrink-0 rounded-full shadow-md md:hidden"
                    aria-label="顧客を登録"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </Button>
                </div>

                {/* 右側: 検索バー (コンパクト＆クリック拡張機能付き) ＆ 各種操作ボタン */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 md:flex-initial md:justify-end">
                  <div className="flex flex-1 flex-row items-center justify-end gap-2 md:flex-initial">
                    {/* 検索バー: 非フォーカス時はコンパクト、クリック・フォーカス時または検索文字列あり時にスムーズに拡張 */}
                    <div
                      className={cn(
                        "min-w-0 flex-1 transition-all duration-300 ease-in-out sm:flex-initial sm:shrink-0",
                        isSearchFocused || search.trim() !== ""
                          ? "sm:w-72 md:w-80"
                          : "sm:w-44 md:w-48",
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
                                  ? "bg-primary/10 text-primary border-primary shadow-sm"
                                  : activeFilterCount > 0
                                    ? "bg-secondary text-foreground border-border"
                                    : "bg-card",
                              )}
                            >
                              <Filter className="w-4 h-4" />
                              {activeFilterCount > 0 && (
                                <span
                                  className={cn(
                                    "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                                    isFilterOpen
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-primary text-primary-foreground",
                                  )}
                                >
                                  {activeFilterCount}
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
                              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
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
                    className="hidden gap-2 shadow-md h-10 px-4 shrink-0 w-full sm:w-auto justify-center md:inline-flex"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span className="text-sm font-bold">顧客を登録</span>
                  </Button>
                </div>
              </div>

              {/* 詳細フィルターエリア */}
              {isFilterOpen && (
                <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {filters.map((filter) => {
                      const labelMap: Record<string, string> = {
                        rank: "ランク",
                        status: "フェーズ",
                        labels: "ラベル",
                        acquisition_source: "流入経路",
                        amount: "金額",
                      };
                      
                      const hasValue = !!filter.value;
                      const isAmount = filter.field === "amount";

                      return (
                        <div key={filter.id} className="flex min-w-0">
                          {isAmount ? (
                            <FilterPill
                              label={labelMap[filter.field]}
                              active={hasValue}
                              className="sm:min-w-[320px]"
                              onClear={
                                hasValue
                                  ? () => updateFilter(filter.id, { value: "" })
                                  : undefined
                              }
                            >
                              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatPriceInputValue(
                                    filter.value.split(",")[0] || "",
                                  )}
                                  onChange={(e) => {
                                    const parts = filter.value.split(",");
                                    const nextMin = parsePriceInputValue(
                                      e.target.value,
                                    );
                                    const nextMax = parts[1] || "";
                                    updateFilter(filter.id, {
                                      value:
                                        nextMin || nextMax
                                          ? `${nextMin},${nextMax}`
                                          : "",
                                    });
                                  }}
                                  placeholder="下限"
                                  className={filterPriceInputClassName}
                                />
                                <FilterRangeSeparator />
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatPriceInputValue(
                                    filter.value.split(",")[1] || "",
                                  )}
                                  onChange={(e) => {
                                    const parts = filter.value.split(",");
                                    const nextMin = parts[0] || "";
                                    const nextMax = parsePriceInputValue(
                                      e.target.value,
                                    );
                                    updateFilter(filter.id, {
                                      value:
                                        nextMin || nextMax
                                          ? `${nextMin},${nextMax}`
                                          : "",
                                    });
                                  }}
                                  placeholder="上限"
                                  className={filterPriceInputClassName}
                                />
                              </div>
                            </FilterPill>
                          ) : (
                            <Combobox
                              options={
                                filter.field === "rank"
                                  ? rankOptions
                                  : filter.field === "status"
                                    ? statusOptions
                                    : filter.field === "labels"
                                      ? allLabels
                                      : allAcquisitionSources
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
                        <RotateCcw className="w-3 h-3" />
                        すべてクリア
                      </Button>
                    )}
                  </div>
                </div>
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
            <div className="px-4 md:px-6 pb-6 lg:pb-10 mt-4">
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
                  <Table className="min-w-[600px] bg-transparent text-xs text-foreground sm:min-w-[920px]">
                    <TableHeader className="bg-transparent">
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <SortableContext
                          items={columns
                            .filter((c) => c.draggable !== false)
                            .map((column) => column.id)}
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
                      {paginatedCustomers.map((customer) => {
                        const activeProjects = projects.filter(
                          (p) =>
                            p.customer_id === customer.id &&
                            p.status !== "closed",
                        );

                        const isMinimalCustomer = hasIncompleteDetails(customer);

                        return (
                          <TableRow
                            key={customer.id}
                            onClick={() =>
                              navigate(`/customers/${customer.id}`)
                            }
                            className={cn(
                              "group cursor-pointer border-b border-border/50 bg-transparent transition-all duration-200 hover:bg-muted",
                              isMinimalCustomer &&
                                "bg-destructive/[0.02] hover:bg-destructive/[0.06]",
                            )}
                          >
                            {columns.map((column) => {
                              switch (column.id) {
                                case "pin": {
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4 text-xs font-semibold text-muted-foreground/60 text-center"
                                    >
                                      <div className="flex items-center justify-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCustomer(customer.id, {
                                              is_pinned: !customer.is_pinned,
                                            });
                                          }}
                                          className={cn(
                                            "flex h-7 w-7 items-center justify-center rounded-md transition-all outline-none",
                                            customer.is_pinned
                                              ? "text-blue-500 bg-blue-500/10"
                                              : "text-muted-foreground/30 hover:text-blue-500 hover:bg-blue-500/5 hover:scale-110",
                                          )}
                                        >
                                          <Pin
                                            className={cn(
                                              "w-4 h-4 transition-transform duration-200",
                                              customer.is_pinned
                                                ? "fill-blue-500 stroke-blue-600 rotate-45"
                                                : "stroke-current"
                                            )}
                                          />
                                        </button>
                                      </div>
                                    </TableCell>
                                  );
                                }
                                case "rank":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-2 py-4 text-center"
                                    >
                                      <div className="flex justify-center">
                                        <RankBadge
                                          rank={customer.rank}
                                          size="sm"
                                        />
                                      </div>
                                    </TableCell>
                                  );
                                case "company_code":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4 text-xs font-mono font-bold text-foreground"
                                    >
                                      {customer.company_code || "-"}
                                    </TableCell>
                                  );
                                case "name":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                             <span className="truncate text-xs font-bold text-foreground">
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
                                          <span className="text-xs text-muted-foreground truncate max-w-[12rem]">
                                            {customer.industry?.join("、") || "未設定"}
                                          </span>
                                        </div>
                                      </div>
                                    </TableCell>
                                  );
                                case "phone":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4 text-xs text-foreground font-medium"
                                    >
                                      {customer.phone || "-"}
                                    </TableCell>
                                  );
                                case "email":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4 text-xs text-foreground truncate max-w-[12rem]"
                                    >
                                      {customer.email || "-"}
                                    </TableCell>
                                  );
                                case "status":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4"
                                    >
                                      {customer.status ? (
                                        <StatusBadge status={customer.status} />
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                  );
                                case "labels":
                                  return (
                                    <TableCell
                                      key={column.id}
                                      className="px-3 py-4"
                                    >
                                      <div className="flex flex-wrap gap-1 max-w-[12rem]">
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
                                      className="px-3 py-4 text-xs text-foreground font-medium truncate max-w-[8rem]"
                                    >
                                      {getAcquisitionSource(customer)}
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
                                      className="px-3 py-4 text-xs font-bold text-foreground"
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
                                      className="px-3 py-4"
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
                                              <span className="text-xs font-bold text-foreground group-hover/num:text-primary transition-colors">
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
                                                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/40 group-hover/item:text-primary transition-colors" />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <span className="text-xs font-bold text-muted-foreground/40">
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
                                      className="px-3 py-4 text-xs font-semibold text-foreground"
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
                            <TableCell className="sticky right-0 z-10 bg-gradient-to-l from-background to-transparent group-hover:from-muted group-hover:to-transparent transition-all duration-200 px-3 py-4 text-right">
                              <div className="flex items-center justify-end">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground border border-border/50 shadow-2xs opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
