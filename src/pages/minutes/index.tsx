import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  Filter,
  Info,
  Plus,
  RotateCcw,
  Search,
  SquareArrowOutUpRight,
  X,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import CustomerDialogForm from "@/components/customers/CustomerDialogForm";
import ProjectDialogForm from "@/components/projects/ProjectDialogForm";
import { mockAudioMinutes } from "../../data/mock";
import type { AudioMinute } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  generatedDocuments: GeneratedDocumentView[];
  summary: string;
  checklistDone: number;
  checklistTotal: number;
  isUnlinked: boolean;
}

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface GeneratedDocumentView {
  id: string;
  type: string;
  generatedDate: string;
}

interface MinuteLinkOverrides {
  customerId?: string;
  projectId?: string;
}

const MINUTE_FILTER_FIELDS = ["owner", "date"];

interface FileAnalysisFormValues {
  fileType: "audio" | "text";
  title: string;
  customerId: string;
  projectId: string;
  fileName: string;
}

const DEFAULT_COLUMNS: ListTableColumn[] = [
  { id: "title", label: "議事録名", width: "w-72" },
  { id: "customer", label: "企業名", width: "w-56" },
  { id: "project", label: "案件名", width: "w-64" },
  { id: "owner", label: "担当者", width: "w-36" },
  { id: "generated_documents", label: "生成ドキュメント", width: "w-40" },
  { id: "start_time", label: "開始時刻", width: "w-28" },
  { id: "end_time", label: "終了時刻", width: "w-28" },
  { id: "created_at", label: "作成日時", width: "w-40" },
  { id: "updated_at", label: "最終更新日", width: "w-40" },
];

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

function buildGeneratedDocuments(minute: AudioMinute): GeneratedDocumentView[] {
  if (!minute.project_id && !minute.customer_id) return [];

  const baseDate = formatDate(minute.recording_date);
  const documents: GeneratedDocumentView[] = [
    {
      id: `${minute.id}-estimate`,
      type: "見積書",
      generatedDate: baseDate,
    },
  ];

  if (minute.project_id) {
    documents.push({
      id: `${minute.id}-contract`,
      type: "契約書",
      generatedDate: baseDate,
    });
  }

  if (minute.checklist.some((item) => item.checked)) {
    documents.push({
      id: `${minute.id}-invoice`,
      type: "請求書",
      generatedDate: baseDate,
    });
  }

  return documents;
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

function FileAnalysisForm({
  formId,
  onSubmit,
}: {
  formId: string;
  onSubmit: (values: FileAnalysisFormValues) => void;
}) {
  const { customers, projects, addCustomer, addProject } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();
  const [values, setValues] = useState<FileAnalysisFormValues>({
    fileType: "audio",
    title: "",
    customerId: "",
    projectId: "",
    fileName: "",
  });

  const customerOptions = useMemo(
    () =>
      customers
        .map((customer) => ({ label: customer.name, value: customer.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [customers],
  );

  const projectOptions = useMemo(() => {
    const visibleProjects = values.customerId
      ? projects.filter((project) => project.customer_id === values.customerId)
      : projects;

    return visibleProjects
      .map((project) => ({ label: project.name, value: project.id }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja"));
  }, [projects, values.customerId]);

  const updateValue = <K extends keyof FileAnalysisFormValues>(
    key: K,
    value: FileAnalysisFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleCreateCustomerQuick = (name: string) => {
    const newCustomer = addCustomer({
      name,
      industry: ["未設定"],
      rank: "B",
      status: "lead",
      is_pinned: false,
      created_by: "user-001",
    });
    updateValue("customerId", newCustomer.id);
    updateValue("projectId", "");
  };

  const handleCreateCustomerDetail = (name: string) => {
    const nestedFormId = "add-customer-from-minute-form";
    openDialog({
      mode: "add",
      eyebrow: "顧客",
      breadcrumbs: ["新規作成"],
      title: "顧客を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <CustomerDialogForm
          formId={nestedFormId}
          submitLabel="顧客を追加"
          initialValues={{ name }}
          onSubmit={(customerValues) => {
            const newCustomer = addCustomer({
              ...customerValues,
              created_by: "user-001",
            });
            updateValue("customerId", newCustomer.id);
            updateValue("projectId", "");
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={nestedFormId} variant="primary">
            顧客を追加
          </Button>
        </>
      ),
    });
  };

  const handleCreateProjectQuick = (name: string) => {
    const newProject = addProject({
      name,
      customer_id: values.customerId || null,
      status: "lead",
      priority: 2,
      amount: 0,
      user_id: "user-001",
      source: "manual",
    });
    updateValue("projectId", newProject.id);
  };

  const handleCreateProjectDetail = (name: string) => {
    const nestedFormId = "add-project-from-minute-form";
    openDialog({
      mode: "add",
      eyebrow: "案件",
      breadcrumbs: ["新規作成"],
      title: "案件を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <ProjectDialogForm
          formId={nestedFormId}
          submitLabel="案件を追加"
          initialValues={{
            name,
            customer_id: values.customerId || null,
            user_id: "user-001",
            source: "manual",
          }}
          onSubmit={(projectValues) => {
            const newProject = addProject(projectValues);
            updateValue("projectId", newProject.id);
            if (projectValues.customer_id) {
              updateValue("customerId", projectValues.customer_id);
            }
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={nestedFormId} variant="primary">
            案件を追加
          </Button>
        </>
      ),
    });
  };

  const fileAccept =
    values.fileType === "audio"
      ? "audio/*,.m4a,.mp3,.wav,.aac"
      : "text/plain,.txt,.md,.csv,.json,.doc,.docx";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      ...values,
      title: values.title.trim() || values.fileName.replace(/\.[^.]+$/, "") || "新規議事録",
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { value: "audio" as const, label: "音声ファイル", note: "mp3 / wav / m4a など" },
          { value: "text" as const, label: "テキストファイル", note: "txt / md / doc など" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              updateValue("fileType", option.value);
              updateValue("fileName", "");
            }}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              values.fileType === option.value
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            <span className="block text-sm font-bold">{option.label}</span>
            <span className="mt-1 block text-xs font-medium text-muted-foreground">
              {option.note}
            </span>
          </button>
        ))}
      </div>

      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition hover:border-primary/50 hover:bg-primary/5">
        <input
          type="file"
          accept={fileAccept}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            updateValue("fileName", file?.name ?? "");
            if (file?.name && !values.title.trim()) {
              updateValue("title", file.name.replace(/\.[^.]+$/, ""));
            }
          }}
        />
        <Plus className="mb-3 h-6 w-6 text-primary" />
        <span className="text-sm font-bold text-foreground">
          {values.fileName || "解析するファイルを選択"}
        </span>
        <span className="mt-1 text-xs font-medium text-muted-foreground">
          {values.fileType === "audio"
            ? "音声ファイルをアップロードして文字起こしから議事録化します"
            : "テキストファイルをアップロードして要約と議事録化を行います"}
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="minute-upload-title" className="text-xs font-bold text-muted-foreground">
            議事録タイトル
          </label>
          <input
            id="minute-upload-title"
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="議事録タイトルを入力"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">顧客名</label>
          <Combobox
            options={customerOptions}
            value={values.customerId}
            onValueChange={(value) => {
              updateValue("customerId", value);
              const nextProject = projects.find((project) => project.customer_id === value);
              updateValue("projectId", nextProject?.id ?? "");
            }}
            onCreateOptionQuick={handleCreateCustomerQuick}
            onCreateOptionDetail={handleCreateCustomerDetail}
            placeholder="顧客名を選択"
            className="h-11 rounded-xl border border-input bg-background text-sm font-medium shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">案件名</label>
          <Combobox
            options={[{ label: "未設定", value: "" }, ...projectOptions]}
            value={values.projectId}
            onValueChange={(value) => {
              updateValue("projectId", value);
              const selectedProject = projects.find((project) => project.id === value);
              if (selectedProject?.customer_id) {
                updateValue("customerId", selectedProject.customer_id);
              }
            }}
            onCreateOptionQuick={handleCreateProjectQuick}
            onCreateOptionDetail={handleCreateProjectDetail}
            placeholder="案件名を選択"
            className="h-11 rounded-xl border border-input bg-background text-sm font-medium shadow-sm"
          />
        </div>
      </div>
    </form>
  );
}

export default function AudioMinuteList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, projects, profiles, addCustomer, addProject } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

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
    return MINUTE_FILTER_FIELDS.map((field) => ({
      id: Math.random().toString(36).slice(2, 11),
      field,
      operator: "contains",
      value: searchParams.get(field) ?? "",
    }));
  });
  const [isFilterOpen, setIsFilterOpen] = useState(() =>
    MINUTE_FILTER_FIELDS.some((field) => searchParams.has(field)),
  );
  const [columns, setColumns] = useState<ListTableColumn[]>(DEFAULT_COLUMNS);
  const [openDocumentPopoverId, setOpenDocumentPopoverId] = useState<string | null>(null);
  const [minuteLinkOverrides, setMinuteLinkOverrides] = useState<
    Record<string, MinuteLinkOverrides>
  >({});
  const itemsPerPage = 8;
  const activeFilterCount = filters.filter((filter) => filter.value).length;

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
        const override = minuteLinkOverrides[minute.id];
        const customerId = override?.customerId ?? minute.customer_id;
        const projectId = override?.projectId ?? minute.project_id;
        const customer = customerId
          ? customers.find((item) => item.id === customerId)
          : null;
        const project = projectId
          ? projects.find((item) => item.id === projectId)
          : null;
        const owner = profiles.find((profile) => profile.id === minute.user_id);
        const checklistDone = minute.checklist.filter((item) => item.checked).length;
        const timestamps = minute as AudioMinute & { updated_at?: string };

        return {
          id: minute.id,
          title: minute.title.trim() || "-",
          customerId,
          customer: customer?.name ?? "未紐づけ",
          customerIndustry: customer?.industry?.join("、"),
          projectId,
          project: project?.name ?? "未紐づけ",
          ownerId: minute.user_id,
          owner: owner?.name ?? "未担当",
          recordingDate: minute.recording_date,
          startTime: minute.start_time,
          endTime: minute.end_time,
          createdAt: minute.created_at,
          updatedAt: timestamps.updated_at ?? minute.created_at,
          generatedDocuments: buildGeneratedDocuments(minute),
          summary: minute.summary.replace(/\s+/g, " ").slice(0, 160),
          checklistDone,
          checklistTotal: minute.checklist.length,
          isUnlinked: !customer || !project,
        };
      }),
    [customers, minuteLinkOverrides, profiles, projects],
  );

  const updateMinuteLink = (
    minuteId: string,
    field: keyof MinuteLinkOverrides,
    value: string,
  ) => {
    setMinuteLinkOverrides((current) => ({
      ...current,
      [minuteId]: { ...current[minuteId], [field]: value },
    }));
  };

  const handleSelectMinuteProject = (minuteId: string, projectId: string) => {
    updateMinuteLink(minuteId, "projectId", projectId);
    const project = projects.find((item) => item.id === projectId);
    if (project?.customer_id) {
      updateMinuteLink(minuteId, "customerId", project.customer_id);
    }
  };

  const handleCreateMinuteCustomerQuick = (minuteId: string, name: string) => {
    const customer = addCustomer({
      name,
      industry: ["未設定"],
      rank: "B",
      status: "lead",
      is_pinned: false,
      created_by: "user-001",
    });
    updateMinuteLink(minuteId, "customerId", customer.id);
  };

  const handleCreateMinuteCustomerDetail = (minuteId: string, name: string) => {
    const formId = `add-customer-from-minute-row-${minuteId}`;
    openDialog({
      mode: "add",
      eyebrow: "顧客",
      breadcrumbs: ["新規作成"],
      title: "顧客を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <CustomerDialogForm
          formId={formId}
          submitLabel="顧客を追加"
          initialValues={{ name }}
          onSubmit={(values) => {
            const customer = addCustomer({
              ...values,
              created_by: "user-001",
            });
            updateMinuteLink(minuteId, "customerId", customer.id);
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
            顧客を追加
          </Button>
        </>
      ),
    });
  };

  const handleCreateMinuteProjectQuick = (minute: MinuteView, name: string) => {
    const project = addProject({
      name,
      customer_id: minute.customerId,
      status: "lead",
      priority: 2,
      amount: 0,
      user_id: minute.ownerId || "user-001",
      source: "manual",
    });
    updateMinuteLink(minute.id, "projectId", project.id);
  };

  const handleCreateMinuteProjectDetail = (minute: MinuteView, name: string) => {
    const formId = `add-project-from-minute-row-${minute.id}`;
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
            name,
            customer_id: minute.customerId,
            user_id: minute.ownerId || "user-001",
            source: "manual",
          }}
          onSubmit={(values) => {
            const project = addProject(values);
            updateMinuteLink(minute.id, "projectId", project.id);
            if (project.customer_id) {
              updateMinuteLink(minute.id, "customerId", project.customer_id);
            }
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

  const handleOpenFileAnalysisDialog = () => {
    const formId = "minute-file-analysis-form";
    openDialog({
      mode: "add",
      eyebrow: "議事録",
      breadcrumbs: ["ファイル解析"],
      title: "ファイル解析",
      description: "音声またはテキストファイルから議事録を作成します。",
      size: "lg",
      content: (
        <FileAnalysisForm
          formId={formId}
          onSubmit={() => {
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
            解析を開始
          </Button>
        </>
      ),
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
        if (sortKey === "generated_documents") {
          return a.generatedDocuments.length - b.generatedDocuments.length;
        }
        if (sortKey === "recording_date") {
          return new Date(a.recordingDate).getTime() - new Date(b.recordingDate).getTime();
        }
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
                <div className="flex w-full shrink-0 items-center gap-2 py-1 md:w-auto">
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
                  <Button
                    type="button"
                    variant="primary"
                    size="icon"
                    onClick={handleOpenFileAnalysisDialog}
                    className="ml-auto h-9 w-9 shrink-0 rounded-full shadow-md md:hidden"
                    aria-label="ファイル解析"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
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
                              : activeFilterCount > 0
                                ? "secondary"
                                : "ghost"
                          }
                          size="md"
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className={cn(
                            "h-10 justify-center border border-border/50 shadow-sm transition-all",
                            activeFilterCount === 0
                              ? "gap-2 px-3 md:w-10 md:px-0 md:gap-0"
                              : "gap-2 px-3 md:gap-1.5 md:px-2.5",
                            isFilterOpen
                              ? "border-primary bg-primary/10 text-primary"
                              : activeFilterCount > 0
                                ? "border-border bg-secondary text-foreground"
                                : "bg-card",
                          )}
                        >
                          <Filter className="h-4 w-4" />
                          <span className="text-sm md:hidden">フィルター</span>
                          {activeFilterCount > 0 && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
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

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleOpenFileAnalysisDialog}
                    className="hidden h-10 gap-2 px-3 shadow-sm md:inline-flex"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">ファイル解析</span>
                  </Button>
                </div>
              </div>

              {isFilterOpen && (
                <>
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
                            <SelectItem value="owner">担当者</SelectItem>
                            <SelectItem value="date">作成日時</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="order-3 mx-1 hidden h-4 w-px shrink-0 bg-border/60 sm:block" />

                        {filter.field === "owner" ? (
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
                            <DatePicker
                              value={filter.value.split(",")[0] || ""}
                              onChange={(value) => {
                                const parts = filter.value.split(",");
                                updateFilter(filter.id, {
                                  value: `${value},${parts[1] || ""}`,
                                });
                              }}
                              size="sm"
                              className="min-w-0 flex-1 sm:w-32 sm:flex-initial"
                              buttonClassName="text-xs"
                            />
                            <span className="shrink-0 text-xs font-bold text-muted-foreground">
                              -
                            </span>
                            <DatePicker
                              value={filter.value.split(",")[1] || ""}
                              onChange={(value) => {
                                const parts = filter.value.split(",");
                                updateFilter(filter.id, {
                                  value: `${parts[0] || ""},${value}`,
                                });
                              }}
                              size="sm"
                              className="min-w-0 flex-1 sm:w-32 sm:flex-initial"
                              buttonClassName="text-xs"
                            />
                          </div>
                        ) : null}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateFilter(filter.id, { value: "" })}
                          className="order-2 ml-auto h-8 w-8 shrink-0 rounded-lg text-muted-foreground/30 hover:bg-destructive/5 hover:text-destructive sm:order-4 sm:ml-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="col-span-2 flex w-full min-w-0 items-center justify-end gap-3 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => undefined}
                        className="hidden"
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        条件追加
                      </Button>

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
                          className="h-9 shrink-0 gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
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
            <div className="mt-4 px-4 pb-6 md:px-6 lg:pb-10">
              <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="min-w-[1460px] bg-card text-xs text-foreground">
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
                                        <span className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                          {minute.title}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                              case "customer":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5"
                                    onClick={(event) => {
                                      if (!minute.customerId) event.stopPropagation();
                                    }}
                                  >
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
                                      <Combobox
                                        options={customerOptions}
                                        onValueChange={(value) =>
                                          updateMinuteLink(minute.id, "customerId", value)
                                        }
                                        onCreateOptionQuick={(name) =>
                                          handleCreateMinuteCustomerQuick(minute.id, name)
                                        }
                                        onCreateOptionDetail={(name) =>
                                          handleCreateMinuteCustomerDetail(minute.id, name)
                                        }
                                        placeholder="企業を紐づけ"
                                        className="h-8 w-48 rounded-full border border-destructive/30 bg-destructive/5 px-3 text-xs font-medium text-destructive shadow-2xs transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50"
                                      />
                                    )}
                                  </TableCell>
                                );
                              case "project":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5"
                                    onClick={(event) => {
                                      if (!minute.projectId) event.stopPropagation();
                                    }}
                                  >
                                    {minute.projectId ? (
                                      <span className="block max-w-[16rem] truncate text-xs font-semibold text-foreground">
                                        {minute.project}
                                      </span>
                                    ) : (
                                      <Combobox
                                        options={
                                          minute.customerId
                                            ? projectOptions.filter((option) =>
                                                projects.some(
                                                  (project) =>
                                                    project.id === option.value &&
                                                    project.customer_id === minute.customerId,
                                                ),
                                              )
                                            : projectOptions
                                        }
                                        onValueChange={(value) =>
                                          handleSelectMinuteProject(minute.id, value)
                                        }
                                        onCreateOptionQuick={(name) =>
                                          handleCreateMinuteProjectQuick(minute, name)
                                        }
                                        onCreateOptionDetail={(name) =>
                                          handleCreateMinuteProjectDetail(minute, name)
                                        }
                                        placeholder="案件を紐づけ"
                                        className="h-8 w-56 rounded-full border border-destructive/30 bg-destructive/5 px-3 text-xs font-medium text-destructive shadow-2xs transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50"
                                      />
                                    )}
                                  </TableCell>
                                );
                              case "owner":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-foreground"
                                  >
                                    {minute.owner}
                                  </TableCell>
                                );
                              case "generated_documents":
                                return (
                                  <TableCell key={column.id} className="px-4 py-3.5">
                                    {minute.generatedDocuments.length > 0 ? (
                                      <Popover open={openDocumentPopoverId === minute.id}>
                                        <PopoverTrigger asChild>
                                          <div
                                            className="-m-1 inline-flex cursor-help items-center gap-1 rounded-md px-2 py-1 transition-all hover:bg-primary/10 hover:text-primary group/num"
                                            onMouseEnter={() => setOpenDocumentPopoverId(minute.id)}
                                            onMouseLeave={() => setOpenDocumentPopoverId(null)}
                                            onClick={(event) => event.stopPropagation()}
                                          >
                                            <span className="text-xs font-bold text-foreground transition-colors group-hover/num:text-primary">
                                              {minute.generatedDocuments.length}
                                            </span>
                                            <span className="text-xs font-medium text-muted-foreground transition-colors group-hover/num:text-primary">
                                              件
                                            </span>
                                          </div>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-80 overflow-hidden border-border/40 bg-background/95 p-0 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
                                          onMouseEnter={() => setOpenDocumentPopoverId(minute.id)}
                                          onMouseLeave={() => setOpenDocumentPopoverId(null)}
                                        >
                                          <div className="border-b border-border/40 bg-primary/5 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                                生成ドキュメント
                                              </h4>
                                              <span className="text-[10px] font-bold text-muted-foreground/60">
                                                {minute.generatedDocuments.length}件
                                              </span>
                                            </div>
                                          </div>
                                          <div className="p-2">
                                            {minute.generatedDocuments.map((document) => (
                                              <div
                                                key={document.id}
                                                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-primary/5 group/item"
                                                onClick={(event) => event.stopPropagation()}
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <p className="truncate text-xs font-bold text-foreground group-hover/item:text-primary">
                                                    {document.type}
                                                  </p>
                                                  <p className="text-[10px] font-medium text-muted-foreground">
                                                    生成日: {document.generatedDate}
                                                  </p>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    setOpenDocumentPopoverId(null);
                                                    window.location.href =
                                                      `/minutes/${minute.id}/documents/${document.id}/edit?type=${encodeURIComponent(document.type)}&date=${encodeURIComponent(document.generatedDate)}`;
                                                  }}
                                                  className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold text-primary transition-colors hover:bg-primary/10"
                                                >
                                                  表示
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    ) : (
                                      <span className="text-xs font-bold text-muted-foreground/40">
                                        0 <span className="text-xs font-medium">件</span>
                                      </span>
                                    )}
                                  </TableCell>
                                );
                              case "recording_date":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 text-xs font-bold text-foreground"
                                  >
                                    {formatDate(minute.recordingDate)}
                                  </TableCell>
                                );
                              case "start_time":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 font-mono text-xs text-foreground"
                                  >
                                    {minute.startTime}
                                  </TableCell>
                                );
                              case "end_time":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 font-mono text-xs text-foreground"
                                  >
                                    {minute.endTime}
                                  </TableCell>
                                );
                              case "created_at":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-foreground"
                                  >
                                    {formatDateTime(minute.createdAt)}
                                  </TableCell>
                                );
                              case "updated_at":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-foreground"
                                  >
                                    {formatDateTime(minute.updatedAt)}
                                  </TableCell>
                                );
                              case "checklist":
                                return (
                                  <TableCell key={column.id} className="px-4 py-3.5">
                                    <Badge
                                      variant="outline"
                                      className="border-border px-2 py-0.5 text-[10px] font-bold"
                                    >
                                      {minute.checklistDone}/{minute.checklistTotal}
                                    </Badge>
                                  </TableCell>
                                );
                              case "summary":
                                return (
                                  <TableCell
                                    key={column.id}
                                    className="px-4 py-3.5 text-xs text-muted-foreground"
                                  >
                                    <span className="line-clamp-2 max-w-[20rem]">
                                      {minute.summary}
                                    </span>
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                          <TableCell className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end pr-4">
                              <SquareArrowOutUpRight className="h-4.5 w-4.5 -translate-x-2 text-muted-foreground opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
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
