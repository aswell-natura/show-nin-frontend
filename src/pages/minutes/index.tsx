import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import { useDataStore } from "../../context/DataStoreContext";
import { mockAudioMinutes } from "../../data/mock";
import type { AudioMinute } from "../../types";
import { Badge } from "@/components/ui/badge";
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

interface MinuteView {
  id: string;
  title: string;
  customerId: string | null;
  customer: string;
  customerIndustry?: string;
  projectId: string | null;
  project: string;
  ownerId: string;
  owner: string;
  recordingDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  isUnlinked: boolean;
}

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const DEFAULT_COLUMNS: ListTableColumn[] = [
  { id: "title", label: "議事録名", width: "w-72" },
  { id: "customer", label: "企業名", width: "w-56" },
  { id: "project", label: "案件名", width: "w-64" },
  { id: "owner", label: "担当者", width: "w-36" },
  { id: "start_time", label: "開始時刻", width: "w-28" },
  { id: "end_time", label: "終了時刻", width: "w-28" },
  { id: "created_at", label: "作成日時", width: "w-40" },
  { id: "updated_at", label: "最終更新日", width: "w-40" },
];

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function AudioMinuteList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, projects, profiles } = useDataStore();

  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortKey, setSortKey] = useState<string>(
    () => {
      const key = searchParams.get("sort");
      return key && key !== "recording_date" ? key : "updated_at";
    },
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
    ["link", "customer", "project", "owner", "date"].forEach((field) => {
      searchParams.getAll(field).forEach((value) => {
        if (value) {
          initialFilters.push({
            id: Math.random().toString(36).slice(2, 11),
            field,
            operator: "contains",
            value,
          });
        }
      });
    });
    return initialFilters;
  });
  const [isFilterOpen, setIsFilterOpen] = useState(() =>
    ["link", "customer", "project", "owner", "date"].some((field) =>
      searchParams.has(field),
    ),
  );
  const [columns, setColumns] = useState<ListTableColumn[]>(DEFAULT_COLUMNS);
  const itemsPerPage = 8;

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (sortKey !== "updated_at") params.set("sort", sortKey);
    if (sortOrder !== "desc") params.set("order", sortOrder);
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

  const minuteViews = useMemo<MinuteView[]>(
    () =>
      mockAudioMinutes.map((minute: AudioMinute) => {
        const customer = minute.customer_id
          ? customers.find((item) => item.id === minute.customer_id)
          : null;
        const project = minute.project_id
          ? projects.find((item) => item.id === minute.project_id)
          : null;
        const owner = profiles.find((profile) => profile.id === minute.user_id);
        const timestamps = minute as AudioMinute & { updated_at?: string };
        const isUnlinked = !customer || !project;

        return {
          id: minute.id,
          title: minute.title.trim() || "-",
          customerId: minute.customer_id,
          customer: customer?.name ?? "未紐づけ",
          customerIndustry: customer?.industry?.join("、"),
          projectId: minute.project_id,
          project: project?.name ?? "未紐づけ",
          ownerId: minute.user_id,
          owner: owner?.name ?? "未担当",
          recordingDate: minute.recording_date,
          startTime: minute.start_time,
          endTime: minute.end_time,
          createdAt: minute.created_at,
          updatedAt: timestamps.updated_at ?? minute.created_at,
          summary: minute.summary.replace(/\s+/g, " ").slice(0, 160),
          isUnlinked,
        };
      }),
    [customers, profiles, projects],
  );

  const customerOptions = useMemo(
    () =>
      customers
        .map((customer) => ({ label: customer.name, value: customer.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [customers],
  );

  const projectOptions = useMemo(
    () =>
      projects
        .map((project) => ({ label: project.name, value: project.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [projects],
  );

  const ownerOptions = useMemo(
    () =>
      profiles
        .map((profile) => ({ label: profile.name, value: profile.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [profiles],
  );

  const linkOptions = [
    { label: "すべて", value: "all" },
    { label: "紐づけ済み", value: "linked" },
    { label: "未紐づけ", value: "unlinked" },
  ];

  const addFilter = () => {
    setFilters((current) => [
      ...current,
      {
        id: Math.random().toString(36).slice(2, 11),
        field: "link",
        operator: "contains",
        value: "",
      },
    ]);
    setCurrentPage(1);
    setIsFilterOpen(true);
  };

  const removeFilter = (id: string) => {
    setFilters((current) => current.filter((filter) => filter.id !== id));
    setCurrentPage(1);
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
    let list = [...minuteViews];

    if (search.trim()) {
      const query = normalizeSearch(search);
      list = list.filter((minute) =>
        normalizeSearch(
          [
            minute.title,
            minute.customer,
            minute.project,
            minute.owner,
            minute.recordingDate,
            minute.summary,
          ].join(" "),
        ).includes(query),
      );
    }

    filters.forEach((filter) => {
      if (!filter.value) return;
      list = list.filter((minute) => {
        const value = filter.value;
        switch (filter.field) {
          case "link":
            return (
              value === "all" ||
              (value === "linked" && !minute.isUnlinked) ||
              (value === "unlinked" && minute.isUnlinked)
            );
          case "customer":
            return minute.customerId === value;
          case "project":
            return minute.projectId === value;
          case "owner":
            return minute.ownerId === value;
          case "date": {
            if (value === ",") return true;
            const [from = "", until = ""] = value.split(",");
            const target = new Date(`${minute.recordingDate}T00:00:00`).getTime();
            const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : 0;
            const untilTime = until
              ? new Date(`${until}T23:59:59`).getTime()
              : Infinity;
            return target >= fromTime && target <= untilTime;
          }
          default:
            return true;
        }
      });
    });

    list.sort((a, b) => {
      if (a.isUnlinked !== b.isUnlinked) return a.isUnlinked ? -1 : 1;

      const comparison = (() => {
        if (sortKey === "title") return a.title.localeCompare(b.title, "ja");
        if (sortKey === "customer") return a.customer.localeCompare(b.customer, "ja");
        if (sortKey === "project") return a.project.localeCompare(b.project, "ja");
        if (sortKey === "owner") return a.owner.localeCompare(b.owner, "ja");
        if (sortKey === "start_time") return a.startTime.localeCompare(b.startTime);
        if (sortKey === "end_time") return a.endTime.localeCompare(b.endTime);
        if (sortKey === "created_at") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortKey === "updated_at") {
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        return 0;
      })();

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return list;
  }, [filters, minuteViews, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedMinutes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [currentPage, filtered, itemsPerPage]);

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-auto bg-muted/5 custom-scrollbar">
          <div className="bg-background/95 backdrop-blur-md">
            <div className="px-4 pb-4 pt-6 md:px-6">
              <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                <div className="flex shrink-0 items-center gap-2 py-1">
                  <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                    議事録一覧
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
                        <p>録音から生成された議事録を、企業・案件への紐づけ状態ごとに確認します</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center md:flex-initial md:justify-end">
                  <div
                    className={cn(
                      "max-w-full shrink-0 transition-all duration-300 ease-in-out",
                      isSearchFocused || search.trim() !== ""
                        ? "w-full sm:w-72 md:w-80"
                        : "w-full sm:w-44 md:w-48",
                    )}
                  >
                    <SearchBar
                      placeholder="議事録名・企業・案件・担当者で検索"
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
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className={cn(
                            "h-10 justify-center border border-border/50 shadow-sm transition-all",
                            filters.length === 0
                              ? "gap-2 px-3 md:w-10 md:px-0 md:gap-0"
                              : "gap-2 px-3 md:gap-1.5 md:px-2.5",
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
              </div>

              {isFilterOpen && (
                <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 md:p-4">
                  <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
                    {filters.map((filter) => (
                      <div
                        key={filter.id}
                        className={cn(
                          "flex w-full min-w-0 flex-wrap items-center gap-2 overflow-hidden rounded-xl border border-border/60 bg-background p-2 shadow-sm animate-in zoom-in-95 duration-200 sm:w-auto sm:flex-nowrap sm:p-1.5",
                          filter.field === "date" ? "col-span-2" : "col-span-1",
                        )}
                      >
                        <Select
                          value={filter.field}
                          onValueChange={(value) =>
                            updateFilter(filter.id, { field: value, value: "" })
                          }
                        >
                          <SelectTrigger className="order-1 h-8 min-w-[80px] flex-1 truncate border-none bg-muted/30 text-xs font-bold shadow-none sm:w-32 sm:flex-initial">
                            <SelectValue placeholder="項目" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">紐づけ状態</SelectItem>
                            <SelectItem value="customer">企業</SelectItem>
                            <SelectItem value="project">案件</SelectItem>
                            <SelectItem value="owner">担当者</SelectItem>
                            <SelectItem value="date">取得日</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="order-3 mx-1 hidden h-4 w-px shrink-0 bg-border/60 sm:block" />

                        {filter.field === "link" ? (
                          <Combobox
                            options={linkOptions}
                            value={filter.value}
                            onValueChange={(value) =>
                              updateFilter(filter.id, { value })
                            }
                            placeholder="状態を選択"
                            className="order-4 h-8 w-full min-w-0 text-xs font-medium sm:order-3 sm:w-48"
                          />
                        ) : filter.field === "customer" ? (
                          <Combobox
                            options={customerOptions}
                            value={filter.value}
                            onValueChange={(value) =>
                              updateFilter(filter.id, { value })
                            }
                            placeholder="企業を選択"
                            className="order-4 h-8 w-full min-w-0 text-xs font-medium sm:order-3 sm:w-56"
                          />
                        ) : filter.field === "project" ? (
                          <Combobox
                            options={projectOptions}
                            value={filter.value}
                            onValueChange={(value) =>
                              updateFilter(filter.id, { value })
                            }
                            placeholder="案件を選択"
                            className="order-4 h-8 w-full min-w-0 text-xs font-medium sm:order-3 sm:w-56"
                          />
                        ) : filter.field === "owner" ? (
                          <Combobox
                            options={ownerOptions}
                            value={filter.value}
                            onValueChange={(value) =>
                              updateFilter(filter.id, { value })
                            }
                            placeholder="担当者を選択"
                            className="order-4 h-8 w-full min-w-0 text-xs font-medium sm:order-3 sm:w-48"
                          />
                        ) : filter.field === "date" ? (
                          <div className="order-4 flex w-full min-w-0 items-center gap-1 sm:order-3 sm:w-auto">
                            <input
                              type="date"
                              value={filter.value.split(",")[0] || ""}
                              onChange={(event) => {
                                const parts = filter.value.split(",");
                                updateFilter(filter.id, {
                                  value: `${event.target.value},${parts[1] || ""}`,
                                });
                              }}
                              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/10 sm:w-32 sm:flex-initial"
                            />
                            <span className="shrink-0 text-xs font-bold text-muted-foreground">
                              -
                            </span>
                            <input
                              type="date"
                              value={filter.value.split(",")[1] || ""}
                              onChange={(event) => {
                                const parts = filter.value.split(",");
                                updateFilter(filter.id, {
                                  value: `${parts[0] || ""},${event.target.value}`,
                                });
                              }}
                              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/10 sm:w-32 sm:flex-initial"
                            />
                          </div>
                        ) : null}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilter(filter.id)}
                          className="order-2 ml-auto h-8 w-8 shrink-0 rounded-lg text-muted-foreground/30 hover:bg-destructive/5 hover:text-destructive sm:order-4 sm:ml-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="col-span-2 flex w-full min-w-0 items-center justify-between gap-3 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addFilter}
                        className="h-9 shrink-0 rounded-md border border-dashed border-border px-3 text-xs font-bold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
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
                          className="h-9 shrink-0 gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          条件クリア
                        </Button>
                      )}
                    </div>
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
                条件に一致する議事録がありません
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="min-w-[1460px] bg-card">
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
                      {paginatedMinutes.map((minute) => (
                        <TableRow
                          key={minute.id}
                          onClick={() => openDetailWindow(minute.id)}
                          className={cn(
                            "group cursor-pointer border-b border-border/70 bg-card transition-colors duration-200 last:border-b-0 hover:bg-muted/40",
                            minute.isUnlinked &&
                              "bg-destructive/5 hover:bg-destructive/10",
                          )}
                        >
                          {columns.map((column) => {
                            switch (column.id) {
                              case "title":
                                return (
                                  <TableCell key={column.id} className="px-4 py-3.5">
                                    <div className="flex min-w-0 flex-col gap-1">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                                          {minute.title}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                              case "customer":
                                return (
                                  <TableCell key={column.id} className="px-4 py-3.5">
                                    {minute.customerId ? (
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-foreground">
                                          {minute.customer}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                          {minute.customerIndustry ?? "-"}
                                        </p>
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="destructive"
                                        className="border-0 px-2.5 py-1 text-xs font-bold"
                                      >
                                        未紐づけ
                                      </Badge>
                                    )}
                                  </TableCell>
                                );
                              case "project":
                                return (
                                  <TableCell key={column.id} className="px-4 py-3.5">
                                    {minute.projectId ? (
                                      <span className="block max-w-[16rem] truncate text-xs font-semibold text-foreground">
                                        {minute.project}
                                      </span>
                                    ) : (
                                      <Badge
                                        variant="destructive"
                                        className="border-0 px-2.5 py-1 text-xs font-bold"
                                      >
                                        未紐づけ
                                      </Badge>
                                    )}
                                  </TableCell>
                                );
                              case "owner":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 text-xs font-semibold text-muted-foreground"
                                  >
                                    {minute.owner}
                                  </TableCell>
                                );
                              case "start_time":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 font-mono text-xs text-muted-foreground"
                                  >
                                    {minute.startTime}
                                  </TableCell>
                                );
                              case "end_time":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 font-mono text-xs text-muted-foreground"
                                  >
                                    {minute.endTime}
                                  </TableCell>
                                );
                              case "created_at":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 text-xs font-semibold text-muted-foreground"
                                  >
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatDateTime(minute.createdAt)}
                                    </span>
                                  </TableCell>
                                );
                              case "updated_at":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 text-xs font-semibold text-muted-foreground"
                                  >
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatDateTime(minute.updatedAt)}
                                    </span>
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                          <TableCell className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end pr-4">
                              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:text-primary group-hover:opacity-100" />
                              <ChevronRight className="ml-1 h-5 w-5 -translate-x-2 text-muted-foreground opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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
