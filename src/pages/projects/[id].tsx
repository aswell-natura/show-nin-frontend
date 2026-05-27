import { useState, useRef, type ReactNode, type UIEvent } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Building,
  User,
  Calendar,
  FileText,
  Clock,
  Edit,
  Briefcase,
  Mic,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  ArrowLeft,
  ExternalLink,
  Folder,
  Trash2,
  Download,
  Upload,
  FileCode,
  Brain,
  Check,
  Loader2,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import { useAuth } from "../../context/AuthContext";
import ProjectDialogForm from "@/components/projects/ProjectDialogForm";
import TaskDialogForm from "@/components/tasks/TaskDialogForm";
import { StatusBadge } from "../../components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { mockAudioMinutes } from "../../data/mock";
import type { ProjectDocument } from "../../types";

type MobileSection = "activities" | "tasks" | "documents" | "context";
type CenterTab = "activities" | "tasks" | "documents";
type DocumentActionMode = "menu" | "upload" | "memo" | null;

const priorityLabel: Record<number, string> = {
  1: "高",
  2: "中",
  3: "低",
};

const priorityColor: Record<number, string> = {
  1: "bg-destructive/10 text-destructive border-destructive/20",
  2: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  3: "bg-muted text-muted-foreground border-border",
};

function formatDate(iso?: string) {
  if (!iso) return "-";
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

function formatSimpleDate(dateStr?: string) {
  if (!dateStr) return "-";
  return dateStr;
}

function getTimeLeftInfo(closeDateStr: string) {
  if (!closeDateStr) return null;
  const parts = closeDateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;

  const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
  targetDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `期限超過 ${Math.abs(diffDays)}日`,
      variant: "expired" as const,
    };
  } else if (diffDays === 0) {
    return {
      text: "今日",
      variant: "today" as const,
    };
  } else if (diffDays === 1) {
    return {
      text: "明日 (残り 1 日)",
      variant: "tomorrow" as const,
    };
  } else {
    return {
      text: `残り ${diffDays}日`,
      variant: "future" as const,
    };
  }
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function openPopupWindow(url: string, name: string) {
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
  const popup = window.open(url, name, features);
  if (popup) popup.focus();
  else window.open(url, "_blank");
}

function openDetailWindow(id: string) {
  openPopupWindow(`/minutes/${id}`, `minute_${id}`);
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const { currentUser } = useAuth();
  const {
    projects: allProjects,
    customers,
    tasks: allTasks,
    profiles,
    activities,
    documents,
    memos: allMemos,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    addProjectDocument,
    updateProjectDocument,
    deleteProjectDocument,
    addProjectMemo,
    updateProjectMemo,
    deleteProjectMemo,
  } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [mobileSection, setMobileSection] = useState<MobileSection>("context");
  const [centerTab, setCenterTab] = useState<CenterTab>("activities");

  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);
  const [isMobileHeaderCompact, setIsMobileHeaderCompact] = useState(false);

  // Document states
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [documentActionMode, setDocumentActionMode] =
    useState<DocumentActionMode>(null);

  const project = allProjects.find((p) => p.id === id);
  const projectMemos = allMemos.filter((m) => m.project_id === id);

  // Memo states
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");
  const [memoUseForAi, setMemoUseForAi] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [expandedMemoIds, setExpandedMemoIds] = useState<
    Record<string, boolean>
  >({});

  const [nextActionText, setNextActionText] = useState(() => project?.next_action || "");
  const [nextActionSaveStatus, setNextActionSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const nextActionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMemoExpand = (memoId: string) => {
    setExpandedMemoIds((prev) => ({
      ...prev,
      [memoId]: !prev[memoId],
    }));
  };

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setEditingMemoId(null);
    setMemoText("");
    setMemoUseForAi(false);
    setSaveStatus("idle");
    setDocumentActionMode(null);
    setExpandedMemoIds({});
    setNextActionText(project?.next_action || "");
    setNextActionSaveStatus("idle");
  }

  const startEditingMemo = (memoId: string) => {
    const memo = projectMemos.find((m) => m.id === memoId);
    if (memo) {
      setEditingMemoId(memoId);
      setMemoText(memo.content);
      setMemoUseForAi(memo.use_for_ai || false);
      setSaveStatus("idle");
      setDocumentActionMode("memo");
    }
  };

  const startNewMemo = () => {
    setEditingMemoId(null);
    setMemoText("");
    setMemoUseForAi(false);
    setSaveStatus("idle");
    setDocumentActionMode("memo");
  };

  const saveMemo = async () => {
    if (!project || !memoText.trim()) return;
    setIsSavingMemo(true);
    setSaveStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (editingMemoId) {
      updateProjectMemo(editingMemoId, {
        content: memoText,
        use_for_ai: memoUseForAi,
      });
    } else {
      addProjectMemo(project.id, memoText, memoUseForAi);
      setMemoText("");
      setMemoUseForAi(false);
    }
    setIsSavingMemo(false);
    setSaveStatus("saved");
  };

  // Redirect if not found
  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            案件が見つかりません
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            指定された案件は存在しないか、削除された可能性があります。
          </p>
          <Button variant="primary" onClick={() => navigate("/projects")}>
            案件一覧に戻る
          </Button>
        </div>
      </AppLayout>
    );
  }

  const customer = project.customer_id
    ? customers.find((c) => c.id === project.customer_id)
    : null;

  const owner = profiles.find((p) => p.id === project.user_id);

  // Activities related to this project
  const projectActivities = activities
    .filter((a) => a.project_id === project.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  // Audio minutes related to this project
  const projectMinutes = mockAudioMinutes
    .filter((m) => m.project_id === project.id)
    .sort(
      (a, b) =>
        new Date(b.recording_date).getTime() -
        new Date(a.recording_date).getTime(),
    );

  // Tasks related to this project
  const projectTasks = allTasks.filter((t) => t.project_id === project.id);

  // Documents related to this project
  const projectDocuments = documents.filter((d) => d.project_id === project.id);

  const mobileSections: {
    id: MobileSection;
    label: string;
    count: number;
    icon: ReactNode;
  }[] = [
    {
      id: "context",
      label: "案件概要",
      count: 0,
      icon: <Folder className="h-3.5 w-3.5" />,
    },
    {
      id: "activities",
      label: "議事録",
      count: projectMinutes.length + projectActivities.length,
      icon: <Mic className="h-3.5 w-3.5" />,
    },
    {
      id: "tasks",
      label: "タスク",
      count: projectTasks.length,
      icon: <CheckSquare className="h-3.5 w-3.5" />,
    },
    {
      id: "documents",
      label: "添付ファイル",
      count: projectMemos.length + projectDocuments.length,
      icon: <FileText className="h-3.5 w-3.5" />,
    },
  ];

  const centerSections = mobileSections.filter(
    (
      section,
    ): section is {
      id: CenterTab;
      label: string;
      count: number;
      icon: ReactNode;
    } => section.id !== "context",
  );

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

  const handleOpenEditProjectDialog = () => {
    const formId = "project-edit-form";
    openDialog({
      mode: "edit",
      eyebrow: "案件",
      breadcrumbs: ["編集"],
      title: "案件を編集",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <ProjectDialogForm
          formId={formId}
          submitLabel="変更を保存"
          initialValues={{
            name: project.name,
            customer_id: project.customer_id,
            status: project.status,
            priority: project.priority,
            amount: project.amount,
            close_date: project.close_date || "",
            note: project.note || "",
            labels: project.labels || [],
            user_id: project.user_id,
            source: project.source || "manual",
            next_action_date: project.next_action_date || "",
          }}
          onSubmit={(values) => {
            updateProject(project.id, values);
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

  const handleOpenDeleteProjectDialog = () => {
    openDialog({
      eyebrow: "案件",
      breadcrumbs: ["削除"],
      title: "案件を削除しますか？",
      description: "この操作は取り消せません。",
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      size: "md",
      content: (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-foreground">
          <p className="font-bold text-destructive">削除対象</p>
          <p className="mt-2 break-words font-semibold">{project.name}</p>
          <p className="mt-3 text-muted-foreground">
            OKすると、この案件のレコードが削除されます。
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
              deleteProject(project.id);
              closeDialog();
              navigate("/projects");
            }}
          >
            <Trash2 className="w-4 h-4" />
            削除
          </Button>
        </>
      ),
    });
  };

  const handleOpenAddTaskDialog = () => {
    const formId = "project-task-add-form";

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
            customer_id: project.customer_id ?? customers[0]?.id ?? "",
            project_id: project.id,
            user_id: project.user_id || profiles[0]?.id || "user-001",
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

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFiles(e.target.files);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    setUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // simulate delay
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addProjectDocument({
        project_id: project.id,
        name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: currentUser?.id || "user-001",
        use_for_ai: false,
      });
    }
    setUploading(false);
  };

  const handleDownload = (doc: ProjectDocument) => {
    const uploader =
      profiles.find((p) => p.id === doc.uploaded_by)?.name || "システム担当";
    const textContent = `
========================================
案件関連ドキュメントの模擬ダウンロード
========================================
ファイル名 : ${doc.name}
ファイル種別 : ${doc.file_type}
ファイルサイズ : ${formatSize(doc.file_size)}
アップロード日時 : ${formatDate(doc.uploaded_at)}
アップロード者 : ${uploader}
案件名 : ${project.name}
----------------------------------------
※このファイルはプロトタイプ内の模擬ダウンロードデータです。
`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      doc.name.endsWith(".txt") ? doc.name : `${doc.name}.txt`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="w-8 h-8 text-rose-500" />;
    }
    if (
      fileType.includes("sheet") ||
      fileType.includes("excel") ||
      fileType.includes("csv")
    ) {
      return <FileCode className="w-8 h-8 text-emerald-600" />;
    }
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
      return <FileCode className="w-8 h-8 text-orange-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  const DocumentUploadContent = (
    <Card
      className={cn(
        "border border-primary/25 bg-card p-4 shadow-xs transition-all duration-300",
        documentActionMode === "upload"
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-2 scale-95",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Upload className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">
            ファイルをアップロード
          </span>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full border-0 bg-primary/10 px-2 py-0 text-[9px] font-bold text-primary"
        >
          追加フォーム
        </Badge>
      </div>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 relative flex flex-col items-center justify-center min-h-[150px]",
          dragActive
            ? "border-primary bg-primary/5 scale-[0.99] dark:bg-primary/10"
            : "border-border bg-muted/10 hover:bg-muted/20 dark:bg-muted/5",
          uploading && "opacity-75 pointer-events-none",
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
          title=""
          aria-label="ファイルをアップロード"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-primary">
              ファイルをアップロード中...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
            <div className="p-3 rounded-full bg-primary/10 text-primary dark:bg-primary/20 mb-1">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-foreground">
              ファイルをドラッグ＆ドロップするか、
              <br />
              クリックしてアップロード
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              PDF, Word, Excel, PowerPoint, 画像など (模擬保存)
            </p>
          </div>
        )}
      </div>
    </Card>
  );

  const DocumentMemoContent = (
    <Card
      className={cn(
        "border border-primary/25 bg-card p-4 shadow-xs transition-all duration-300",
        documentActionMode === "memo"
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-2 scale-95",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">
            {editingMemoId ? "メモを編集" : "メモを追加"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full border-0 bg-primary/10 px-2 py-0 text-[9px] font-bold text-primary"
          >
            追加フォーム
          </Badge>
          {editingMemoId && (
            <button
              type="button"
              onClick={() => startNewMemo()}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              新規追加に戻る
            </button>
          )}
        </div>
      </div>
      <textarea
        value={memoText}
        onChange={(e) => {
          setMemoText(e.target.value);
          if (saveStatus === "saved") setSaveStatus("idle");
        }}
        placeholder="案件のメモや、AIの学習用知識を入力してください..."
        className="w-full min-h-[120px] resize-none rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-medium"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 select-none">
          <Brain
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              memoUseForAi
                ? "text-primary animate-pulse"
                : "text-muted-foreground/60",
            )}
          />
          <span className="text-[10px] font-bold text-muted-foreground">
            AIナレッジとして使用
          </span>
          <button
            type="button"
            onClick={() => setMemoUseForAi(!memoUseForAi)}
            className={cn(
              "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              memoUseForAi ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                memoUseForAi ? "translate-x-3" : "translate-x-0",
              )}
            />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className="text-[9px] text-muted-foreground/60 font-semibold">
            {memoText.length}/2000 文字
          </span>
          {saveStatus === "saved" && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 animate-in fade-in duration-200">
              <Check className="w-3 h-3" /> 保存しました
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={saveMemo}
            disabled={isSavingMemo || !memoText.trim()}
            className="h-7 px-3 font-bold text-[10px] gap-1 shadow-2xs"
          >
            {isSavingMemo ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <span>{editingMemoId ? "保存" : "追加"}</span>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );

  // 2. Center Column Details
  const renderProjectDetailsContent = (visibleCenterTab: CenterTab) => (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Activities and AudioMinutes Tab */}
        {visibleCenterTab === "activities" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">

            {/* Mobile recording CTA row */}
            <div className="relative flex md:hidden items-center justify-end gap-3 mb-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => openPopupWindow("/recording", "recording")}
                className="h-9 w-9 rounded-full px-0 shadow-sm"
                aria-label="この案件で録音を開始"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            {/* Audio Minutes section */}
            {projectMinutes.map((m) => {
              const doneCount = m.checklist.filter((c) => c.checked).length;
              return (
                <Card
                  key={m.id}
                  onClick={() => openDetailWindow(m.id)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 shrink-0">
                          <Mic className="w-4 h-4 text-primary" />
                        </span>
                        <h4 className="text-sm font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                          {m.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground">
                        <span className="text-[10px] font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{" "}
                          {m.recording_date}
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </div>
                    {m.checklist.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="gap-1 text-[9px] font-medium border-border px-1.5 py-0.2"
                        >
                          <CheckSquare className="w-2.5 h-2.5 text-primary" />
                          チェックリスト {doneCount}/{m.checklist.length} 完了
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {/* Activities section */}
            {projectActivities.map((a) => (
              <Card
                key={a.id}
                onClick={() => openDetailWindow(a.id)}
                className="w-full p-4 rounded-xl border border-border bg-card shadow-xs transition-all duration-200 cursor-pointer group hover:shadow-md hover:border-primary/20"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 shrink-0">
                        <FileText className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                        {a.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground">
                      <span className="text-[10px] font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />{" "}
                        {formatDate(a.created_at)}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </div>
                  {a.content_json?.summary && (
                    <p className="text-xs leading-relaxed text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/40 font-medium max-w-xl">
                      {a.content_json.summary}
                    </p>
                  )}
                </div>
              </Card>
            ))}

            {projectMinutes.length === 0 && projectActivities.length === 0 && (
              <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-12">
                <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold text-foreground/70 mb-1">
                  議事録はありません
                </p>
                <p className="text-xs text-muted-foreground">
                  この案件に対する会議、議事録、活動記録はまだありません。
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {visibleCenterTab === "tasks" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            <div className="relative flex md:hidden items-center justify-end gap-3 mb-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddTaskDialog}
                className="h-9 w-9 rounded-full px-0 shadow-sm"
                aria-label="タスクを追加"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {projectTasks.map((task) => {
              const isOverdue =
                task.due_date &&
                !task.is_completed &&
                new Date(task.due_date).getTime() <
                  new Date().setHours(0, 0, 0, 0);

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "p-4 rounded-xl border bg-card shadow-xs transition-all duration-300 flex flex-col gap-2.5",
                    isOverdue
                      ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
                      : "border-border hover:shadow-md hover:border-primary/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold",
                          task.is_completed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-primary/20 bg-primary/10 text-primary",
                        )}
                      >
                        {task.progress_percent ?? (task.is_completed ? 100 : 0)}
                        %
                      </span>
                      <p
                        className={cn(
                          "text-sm font-bold text-foreground leading-tight truncate",
                          task.is_completed &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </p>
                    </div>
                    {task.due_date && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold flex items-center gap-1.5 shrink-0",
                          isOverdue
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        <Calendar className="w-3.5 h-3.5" /> 期限:{" "}
                        {task.due_date}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-2 min-w-0 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-200",
                            task.is_completed ? "bg-emerald-500" : "bg-primary",
                          )}
                          style={{
                            width: `${task.progress_percent ?? (task.is_completed ? 100 : 0)}%`,
                          }}
                        />
                      </div>
                      <Select
                        value={String(task.progress_percent ?? (task.is_completed ? 100 : 0))}
                        onValueChange={(val) => {
                          const progress = Number(val);
                          updateTask(task.id, {
                            progress_percent: progress,
                            is_completed: progress === 100,
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 bg-background border-border text-xs font-bold text-foreground w-[90px]">
                          <SelectValue placeholder="進捗率" />
                        </SelectTrigger>
                        <SelectContent className="min-w-[90px]">
                          {Array.from(
                            { length: 11 },
                            (_, index) => index * 10,
                          ).map((progress) => (
                            <SelectItem key={progress} value={String(progress)}>
                              {progress}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isOverdue && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded border-0"
                        >
                          期限切れ
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded border-0",
                          task.is_completed
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-blue-500/10 text-blue-600",
                        )}
                      >
                        {task.is_completed ? "完了" : "進行中"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}

            {projectTasks.length === 0 && (
              <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-12">
                <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold text-foreground/70 mb-1">
                  タスクはありません
                </p>
                <p className="text-xs text-muted-foreground">
                  この案件に関連付けられたタスクはまだ登録されていません。
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Documents Tab (The Document Upload Section!) */}
        {visibleCenterTab === "documents" && (
          <div className="flex flex-col animate-in fade-in duration-200">
            {/* Mobile-only header with upload action button */}
            <div className="relative flex md:hidden items-center justify-end gap-3 mb-4">
              <div className="relative shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setDocumentActionMode((mode) => (mode ? null : "menu"))
                  }
                  className={cn(
                    "h-9 w-9 rounded-full px-0 shadow-sm transition-all",
                    documentActionMode &&
                      "ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                  )}
                  title="添付ファイルを追加"
                  aria-label="添付ファイルを追加"
                  aria-expanded={documentActionMode === "menu"}
                >
                  <Plus
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      documentActionMode && "rotate-45",
                    )}
                  />
                </Button>
                {documentActionMode === "menu" && (
                  <div
                    className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
                    role="menu"
                  >
                    <button
                      type="button"
                      onClick={() => setDocumentActionMode("upload")}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-muted"
                      role="menuitem"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      <span>ファイルをアップロード</span>
                    </button>
                    <button
                      type="button"
                      onClick={startNewMemo}
                      className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-muted"
                      role="menuitem"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span>新しいメモを書く</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out",
                documentActionMode === "upload"
                  ? "grid-rows-[1fr] opacity-100 mb-4"
                  : "grid-rows-[0fr] opacity-0 mb-0 pointer-events-none",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                {DocumentUploadContent}
              </div>
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out",
                documentActionMode === "memo"
                  ? "grid-rows-[1fr] opacity-100 mb-4"
                  : "grid-rows-[0fr] opacity-0 mb-0 pointer-events-none",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                {DocumentMemoContent}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Memo Items */}
              {projectMemos.map((memo) => {
                const uploader = profiles.find((p) => p.id === memo.created_by);
                const isEditing = editingMemoId === memo.id;
                const isExpanded = !!expandedMemoIds[memo.id];
                return (
                  <Card
                    key={memo.id}
                    onClick={() => toggleMemoExpand(memo.id)}
                    className={cn(
                      "p-3.5 border bg-card flex flex-col gap-2.5 hover:border-primary/20 hover:shadow-xs transition-all duration-200 group cursor-pointer",
                      isEditing
                        ? "border-primary ring-2 ring-primary/10"
                        : "border-border",
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      {/* Left Side: Icon + Title + Badges */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "shrink-0 p-1.5 rounded-lg",
                            memo.content.includes("議事録")
                              ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                              : memo.content.includes("タスク")
                                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-primary/10 text-primary dark:bg-primary/20",
                          )}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {memo.content.includes("議事録") ? (
                            <Badge className="text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 dark:border-blue-500/25 px-2 py-0.5 rounded-md leading-none shadow-3xs">
                              議事録
                            </Badge>
                          ) : memo.content.includes("タスク") ? (
                            <Badge className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/25 px-2 py-0.5 rounded-md leading-none shadow-3xs">
                              タスク
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] font-bold bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-md leading-none shadow-3xs">
                              メモ
                            </Badge>
                          )}
                          <span className="text-xs font-bold text-foreground leading-none">
                            案件メモ (テキスト)
                          </span>
                          {memo.use_for_ai && (
                            <Badge
                              variant="outline"
                              className="text-[8px] font-semibold border-primary/20 bg-primary/5 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none"
                            >
                              <Brain className="w-2.5 h-2.5 animate-pulse" />
                              AI使用中
                            </Badge>
                          )}
                          {isEditing && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border-0 leading-none"
                            >
                              編集中
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Actions (AI Toggle + Buttons) */}
                      <div
                        className="flex items-center gap-3 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Switch for AI */}
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="text-[9px] font-bold text-muted-foreground">
                            AIナレッジとして使用
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateProjectMemo(memo.id, {
                                use_for_ai: !memo.use_for_ai,
                              });
                              if (memo.id === editingMemoId) {
                                setMemoUseForAi(!memo.use_for_ai);
                              }
                            }}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              memo.use_for_ai
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                memo.use_for_ai
                                  ? "translate-x-4"
                                  : "translate-x-0",
                              )}
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-0.5 border-l border-border/60 pl-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMemoExpand(memo.id)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title={isExpanded ? "詳細を閉じる" : "詳細を表示"}
                          >
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 transition-transform duration-200",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingMemo(memo.id)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="編集"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProjectMemo(memo.id)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="w-full flex flex-col gap-1.5 pl-9">
                      <p
                        className={cn(
                          "pr-2 transition-all duration-300 w-full max-w-2xl",
                          isExpanded
                            ? "text-sm leading-[1.75] whitespace-pre-wrap text-foreground/85 font-medium break-all bg-muted/30 p-4 rounded-xl border border-border/40"
                            : "text-[11px] leading-relaxed truncate text-muted-foreground font-semibold mt-0.5",
                        )}
                      >
                        {memo.content.trim() ? memo.content : "（空のメモ）"}
                      </p>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground/80 font-medium flex-wrap">
                        <span>
                          作成日:{" "}
                          {formatSimpleDate(memo.created_at.slice(0, 10))}
                        </span>
                        <span>•</span>
                        <span>{uploader?.name || "メンバー"}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Uploaded Files */}
              {projectDocuments.map((doc) => {
                const uploader = profiles.find((p) => p.id === doc.uploaded_by);
                return (
                  <Card
                    key={doc.id}
                    className="p-3.5 border border-border bg-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-primary/20 hover:shadow-xs transition-all duration-200 group"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                      <div className="shrink-0">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="min-w-0 flex flex-col gap-0.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {doc.name.includes("議事録") ? (
                            <Badge className="text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 dark:border-blue-500/25 px-2 py-0.5 rounded-md leading-none shadow-3xs">
                              議事録
                            </Badge>
                          ) : doc.name.includes("タスク") ? (
                            <Badge className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/25 px-2 py-0.5 rounded-md leading-none shadow-3xs">
                              タスク
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] font-bold bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-md leading-none shadow-3xs">
                              ファイル
                            </Badge>
                          )}
                          <span className="text-xs font-bold text-foreground leading-snug truncate pr-2">
                            {doc.name}
                          </span>

                          {doc.use_for_ai && (
                            <Badge
                              variant="outline"
                              className="text-[8px] font-semibold border-primary/20 bg-primary/5 text-primary px-1.5 py-0 rounded-full flex items-center gap-0.5"
                            >
                              <Brain className="w-2.5 h-2.5 animate-pulse" />
                              AI使用中
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold flex-wrap">
                          <span>{formatSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>
                            {formatSimpleDate(doc.uploaded_at.slice(0, 10))}
                          </span>
                          <span>•</span>
                          <span className="text-foreground/70 flex items-center gap-0.5">
                            <User className="w-3 h-3" />{" "}
                            {uploader?.name || "メンバー"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 shrink-0 w-full sm:w-auto sm:ml-4">
                      {/* Switch for AI */}
                      <div className="flex items-center gap-1.5 select-none">
                        <span className="text-[9px] font-bold text-muted-foreground">
                          AIナレッジとして使用
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateProjectDocument(doc.id, {
                              use_for_ai: !doc.use_for_ai,
                            });
                          }}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            doc.use_for_ai
                              ? "bg-primary"
                              : "bg-muted-foreground/30",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                              doc.use_for_ai
                                ? "translate-x-4"
                                : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-0.5 border-l border-border/60 pl-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="ダウンロード"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProjectDocument(doc.id)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {projectMemos.length === 0 && projectDocuments.length === 0 && (
                <Card className="p-8 border border-dashed border-border rounded-xl text-center bg-card/50 shadow-none py-12">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-bold text-foreground/70 mb-1">
                    添付ファイルはありません
                  </p>
                  <p className="text-xs text-muted-foreground">
                    右上の追加ボタンからファイルまたはメモを登録できます。
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ProjectDetailsContent = renderProjectDetailsContent(centerTab);

  // 3. Right Collapsible Context Panel Content
  const renderProfileContent = (closeButton: ReactNode) => {
    return (
      <div className="h-full flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <span className="font-bold text-xs text-foreground tracking-wider uppercase flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            案件概要
          </span>
          {closeButton}
        </div>

        {/* Formatted metadata */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* 1. Next Action & Deadline Integration */}
          <div className="relative flex flex-col gap-2.5 p-4 rounded-2xl bg-muted/40 dark:bg-muted/15 border border-border/70 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 shadow-3xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                ネクストアクション
              </span>
              {/* Datepicker inline */}
              <DatePicker
                value={project.next_action_date || ""}
                onChange={(value) => {
                  updateProject(project.id, { next_action_date: value || undefined });
                }}
                size="sm"
                className="w-[150px]"
                buttonClassName="h-8 rounded-lg border-border/70 px-2.5 py-1 text-xs font-bold shadow-3xs"
              />
            </div>
            <textarea
              value={nextActionText}
              onChange={(e) => {
                const val = e.target.value;
                setNextActionText(val);
                setNextActionSaveStatus("idle");
                if (nextActionDebounceRef.current) clearTimeout(nextActionDebounceRef.current);
                nextActionDebounceRef.current = setTimeout(() => {
                  setNextActionSaveStatus("saving");
                  updateProject(project.id, { next_action: val });
                  setNextActionSaveStatus("saved");
                  setTimeout(() => setNextActionSaveStatus("idle"), 2000);
                }, 600);
              }}
              placeholder="次回のアクション予定を入力してください..."
              rows={2}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/45 border-none outline-none resize-none p-0 focus:ring-0 focus:outline-none leading-relaxed font-medium mt-1.5"
            />
            {/* Floating save indicator */}
            <div className={cn(
              "absolute bottom-2.5 right-3 flex items-center gap-1 pointer-events-none transition-opacity duration-200",
              nextActionSaveStatus === "idle" ? "opacity-0" : "opacity-100"
            )}>
              {nextActionSaveStatus === "saving" ? (
                <>
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                  <span className="text-xs font-semibold text-muted-foreground">保存中...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">保存しました</span>
                </>
              )}
            </div>
          </div>

          {/* Grid layout for other items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 案件金額 */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-card border border-border/50 shadow-3xs">
              <span className="text-xs text-muted-foreground font-medium">
                案件金額
              </span>
              <span className="text-base font-extrabold text-foreground tracking-tight">
                {project.amount !== undefined
                  ? `¥${project.amount.toLocaleString("ja-JP")}`
                  : "¥0"}
              </span>
            </div>

            {/* 完了予定日 */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-card border border-border/50 shadow-3xs">
              <span className="text-xs text-muted-foreground font-medium">
                完了予定日
              </span>
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 h-6">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {project.close_date
                  ? formatSimpleDate(project.close_date)
                  : "未設定"}
              </span>
            </div>

            {/* 担当メンバー */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-card border border-border/50 shadow-3xs">
              <span className="text-xs text-muted-foreground font-medium">
                担当メンバー
              </span>
              <div className="flex items-center gap-2 h-6">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold border border-primary/20 shrink-0">
                  {owner?.avatar || "未"}
                </div>
                <span className="text-xs font-bold text-foreground truncate">
                  {owner?.name || "未担当"}
                </span>
              </div>
            </div>

            {/* ラベル */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-card border border-border/50 shadow-3xs">
              <span className="text-xs text-muted-foreground font-medium">
                ラベル
              </span>
              <div className="flex flex-wrap gap-1 items-center min-h-6">
                {project.labels && project.labels.length > 0 ? (
                  project.labels.map((l) => (
                    <Badge
                      key={l}
                      variant="outline"
                      className="text-xs font-medium border-border px-2 py-0.5 bg-background"
                    >
                      {l}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">なし</span>
                )}
              </div>
            </div>
          </div>

          {/* Under other info: フェーズ and 確度 */}
          <div className="border-t border-border/50 my-2 pt-4">
            <h5 className="text-xs font-bold text-muted-foreground mb-2.5">
              ステータス・評価
            </h5>
            <div className="grid grid-cols-2 gap-3">
              {/* フェーズ */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/20 dark:bg-muted/10 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">
                  フェーズ
                </span>
                <div className="flex items-center h-6">
                  <StatusBadge
                    status={project.status}
                    className="text-xs py-0.5 px-2"
                  />
                </div>
              </div>

              {/* 確度 */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/20 dark:bg-muted/10 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">
                  確度
                </span>
                <div className="flex items-center h-6">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                      priorityColor[project.priority],
                    )}
                  >
                    {priorityLabel[project.priority]}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        {/* Project Header */}
        <div
          className={cn(
            "bg-card border-b border-border px-4 md:px-6 shrink-0 shadow-xs z-20 relative overflow-hidden transition-all duration-200",
            isMobileHeaderCompact ? "py-2.5 md:py-5" : "py-4 md:py-5",
          )}
        >
          <div
            className={cn(
              "flex relative z-10 md:flex-row md:items-start md:justify-between md:gap-4",
              isMobileHeaderCompact
                ? "flex-col items-stretch gap-2.5"
                : "flex-row items-start justify-between gap-4",
            )}
          >
            <div
              className={cn(
                "flex gap-3 min-w-0 flex-1 md:items-start",
                isMobileHeaderCompact ? "items-center" : "items-start",
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (fromParam && fromParam.startsWith("/")) {
                    navigate(fromParam);
                  } else {
                    navigate("/projects");
                  }
                }}
                className={cn(
                  "mt-0.5 shrink-0 text-muted-foreground hover:text-foreground h-9 w-9 rounded-full bg-muted/40 hover:bg-muted",
                )}
                title="戻る"
                aria-label="戻る"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div
                className={cn(
                  "min-w-0 flex-1 md:pt-0.5",
                  isMobileHeaderCompact ? "pt-0" : "pt-0.5",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 flex-wrap md:mb-2",
                    isMobileHeaderCompact ? "mb-0" : "mb-2",
                  )}
                >
                  <h1
                    className={cn(
                      "font-bold text-foreground tracking-tight truncate md:text-xl",
                      isMobileHeaderCompact ? "text-base" : "text-lg",
                    )}
                  >
                    {project.name}
                  </h1>
                  <div
                    className={cn(
                      "contents",
                      isMobileHeaderCompact && "hidden md:contents",
                    )}
                  >
                    {project.close_date &&
                    (() => {
                      const timeLeft = getTimeLeftInfo(project.close_date);
                      if (!timeLeft) return null;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 shadow-2xs",
                            timeLeft.variant === "expired" &&
                              "bg-destructive/10 text-destructive border-destructive/20",
                            timeLeft.variant === "today" &&
                              "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                            timeLeft.variant === "tomorrow" &&
                              "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                            timeLeft.variant === "future" &&
                              "bg-primary/10 text-primary border-primary/20",
                          )}
                        >
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          完了予定: {formatSimpleDate(project.close_date)} (
                          {timeLeft.text})
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-medium",
                    isMobileHeaderCompact && "hidden md:flex",
                  )}
                >
                  {customer && (
                    <button
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="flex items-center gap-1 hover:text-primary transition-colors group cursor-pointer"
                      title="企業詳細を表示"
                    >
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span className="text-foreground/80 group-hover:text-primary transition-colors">
                        {customer.name}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                    </button>
                  )}
                  <span className="hidden sm:inline text-border">|</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />{" "}
                    更新: {formatDate(project.updated_at)}
                  </span>
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
                variant="secondary"
                size="sm"
                onClick={handleOpenEditProjectDialog}
                className="h-8 w-full gap-1.5 font-bold shadow-2xs justify-center"
              >
                <Edit className="w-4 h-4" /> 編集
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleOpenDeleteProjectDialog}
                className="h-8 w-full gap-1.5 font-bold shadow-2xs justify-center"
              >
                <Trash2 className="w-4 h-4" /> 削除
              </Button>
            </div>

            <div className="shrink-0 hidden md:flex items-center gap-2.5 pt-1">
              <Button
                variant="secondary"
                size="md"
                onClick={handleOpenEditProjectDialog}
                className="gap-1.5 font-bold shadow-xs"
              >
                <Edit className="w-4 h-4" /> 編集
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={handleOpenDeleteProjectDialog}
                className="gap-1.5 font-bold shadow-xs"
              >
                <Trash2 className="w-4 h-4" /> 削除
              </Button>
            </div>
          </div>

          {/* Mobile Edit Button */}
          <div
            className={cn(
              "flex md:hidden items-center gap-2 mt-4 pt-4 border-t border-border/60 justify-end relative z-10",
              isMobileHeaderCompact && "hidden",
            )}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenEditProjectDialog}
              className="flex-1 gap-1.5 font-bold shadow-2xs justify-center"
            >
              <Edit className="w-4 h-4" /> 編集
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleOpenDeleteProjectDialog}
              className="flex-1 gap-1.5 font-bold shadow-2xs justify-center"
            >
              <Trash2 className="w-4 h-4" /> 削除
            </Button>
          </div>
        </div>

        {/* Mobile Section Switcher */}
        <Tabs
          value={mobileSection}
          onValueChange={(value) => {
            const nextSection = value as MobileSection;
            setMobileSection(nextSection);
            if (nextSection !== "context") setCenterTab(nextSection as CenterTab);
          }}
          className="md:hidden flex-1 min-h-0 gap-0"
        >
          <div className="flex border-b border-border bg-card shrink-0 px-2 overflow-x-auto scrollbar-none z-10">
            {mobileSections.map((section) => {
              const isActive = mobileSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-state={isActive ? "active" : "inactive"}
                  onClick={() => {
                    setMobileSection(section.id);
                    if (section.id !== "context")
                      setCenterTab(section.id as CenterTab);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 min-w-[75px] py-3.5 text-xs font-bold tracking-wider transition-colors whitespace-nowrap px-2.5 text-center border-b-2 relative",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{section.label}</span>
                  {section.count > 0 && (
                    <span
                      className={cn(
                        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none shrink-0",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {section.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Content Area */}
          <TabsContents
            className="flex-1 min-h-0 bg-background/50"
            onScrollCapture={handleMobileContentScroll}
          >
            <TabsContent value="context" className="h-full overflow-y-auto">
              {renderProfileContent(null)}
            </TabsContent>
            {centerSections.map((section) => (
              <TabsContent
                key={section.id}
                value={section.id}
                className="h-full overflow-y-auto"
              >
                {renderProjectDetailsContent(section.id)}
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>

        {/* Desktop View Column Layout */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-muted/10 dark:bg-background">
          {/* Left Column (Collapsible Context Panel) */}
          <div
            className={cn(
              "shrink-0 bg-card border-r border-border overflow-hidden shadow-xs z-10 transition-[width] duration-200",
              isContextPanelOpen ? "w-2/5 min-w-[360px] max-w-[640px]" : "w-13",
            )}
          >
            {isContextPanelOpen ? (
              <div className="h-full overflow-y-auto bg-card">
                {renderProfileContent(
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsContextPanelOpen(false)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                    title="案件概要を閉じる"
                    aria-label="案件概要を閉じる"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>,
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center bg-card py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContextPanelOpen(true)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted shadow-2xs border border-border/50"
                  title="案件概要を開く"
                  aria-label="案件概要を開く"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
                <span className="mt-6 [writing-mode:vertical-rl] text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  案件概要
                </span>
              </div>
            )}
          </div>

          {/* Main Column with Top Tabs */}
          <div className="min-w-0 flex-1 flex flex-col overflow-hidden bg-background">
            {/* Desktop Tabs Switcher */}
            <div className="flex items-end justify-between border-b border-border bg-card shrink-0 pr-6 z-10 pt-2">
              <div className="flex px-6 overflow-hidden -mb-px">
                {centerSections.map((section) => {
                  const isActive = centerTab === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCenterTab(section.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold tracking-wider transition-colors whitespace-nowrap px-4 text-center border-b-2 relative -mb-px",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="shrink-0">{section.icon}</span>
                      <span>{section.label}</span>
                      {section.count > 0 && (
                        <span
                          className={cn(
                            "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none shrink-0",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {section.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action buttons next to the desktop tabs */}
              <div className="pb-2.5 flex items-center gap-2 shrink-0">
                {centerTab === "activities" && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openPopupWindow("/recording", "recording")}
                          className="h-8 w-8 rounded-full px-0 shadow-xs"
                          aria-label="この案件で録音"
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="end"
                        className="px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
                      >
                        この案件で録音
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {centerTab === "tasks" && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleOpenAddTaskDialog}
                          className="h-8 w-8 rounded-full px-0 shadow-xs"
                          aria-label="タスクを追加"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="end"
                        className="px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
                      >
                        タスク追加
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {centerTab === "documents" && (
                  <div className="relative">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setDocumentActionMode((mode) => (mode ? null : "menu"))
                            }
                            className={cn(
                              "h-8 w-8 rounded-full px-0 shadow-sm transition-all",
                              documentActionMode &&
                                "ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                            )}
                            aria-label="添付ファイルを追加"
                            aria-expanded={documentActionMode === "menu"}
                          >
                            <Plus
                              className={cn(
                                "w-4 h-4 transition-transform duration-200",
                                documentActionMode && "rotate-45",
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          align="end"
                          className="px-3 py-1.5 backdrop-blur-xl bg-background/90 border border-border/60 shadow-xl rounded-xl text-xs font-bold text-foreground/90 animate-in zoom-in-95 duration-200 z-50"
                        >
                          添付ファイルを追加
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {documentActionMode === "menu" && (
                      <div
                        className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
                        role="menu"
                      >
                        <button
                          type="button"
                          onClick={() => setDocumentActionMode("upload")}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-muted"
                          role="menuitem"
                        >
                          <Upload className="w-4 h-4 text-primary" />
                          <span>ファイルをアップロード</span>
                        </button>
                        <button
                          type="button"
                          onClick={startNewMemo}
                          className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-muted"
                          role="menuitem"
                        >
                          <FileText className="w-4 h-4 text-primary" />
                          <span>新しいメモを書く</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto bg-background">
              {ProjectDetailsContent}
            </div>
          </div>


        </div>
      </div>
    </AppLayout>
  );
}
