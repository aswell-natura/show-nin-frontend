import { useState, type ReactNode } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  PanelRightClose,
  PanelRightOpen,
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
  CheckSquare,
  ArrowLeft,
  ExternalLink,
  Info,
  Trash2,
  Download,
  Upload,
  FileCode,
  Building2,
  Brain,
  Check,
  Loader2,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import { useAuth } from "../../context/AuthContext";
import ProjectDialogForm from "@/components/projects/ProjectDialogForm";
import {
  StatusBadge,
} from "../../components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function formatSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
    updateTask,
    addProjectDocument,
    updateProjectDocument,
    deleteProjectDocument,
    addProjectMemo,
    updateProjectMemo,
    deleteProjectMemo,
  } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [mobileSection, setMobileSection] = useState<MobileSection>("activities");
  const [centerTab, setCenterTab] = useState<CenterTab>("activities");

  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);

  // Document states
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [documentActionMode, setDocumentActionMode] = useState<DocumentActionMode>(null);

  const project = allProjects.find((p) => p.id === id);
  const projectMemos = allMemos.filter((m) => m.project_id === id);

  // Memo states
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");
  const [memoUseForAi, setMemoUseForAi] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setEditingMemoId(null);
    setMemoText("");
    setMemoUseForAi(false);
    setSaveStatus("idle");
    setDocumentActionMode(null);
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
          <h2 className="text-xl font-bold text-foreground mb-2">案件が見つかりません</h2>
          <p className="text-sm text-muted-foreground mb-6">指定された案件は存在しないか、削除された可能性があります。</p>
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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Audio minutes related to this project
  const projectMinutes = mockAudioMinutes
    .filter((m) => m.project_id === project.id)
    .sort((a, b) => new Date(b.recording_date).getTime() - new Date(a.recording_date).getTime());

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
      id: "activities",
      label: "活動履歴",
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
      label: "添付ファイル・メモ",
      count: projectMemos.length + projectDocuments.length,
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      id: "context",
      label: "案件概要",
      count: 0,
      icon: <Info className="h-3.5 w-3.5" />,
    },
  ];

  const centerSections = mobileSections.filter(
    (section): section is {
      id: CenterTab;
      label: string;
      count: number;
      icon: ReactNode;
    } => section.id !== "context",
  );

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
    const uploader = profiles.find((p) => p.id === doc.uploaded_by)?.name || "システム担当";
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
    link.setAttribute("download", doc.name.endsWith(".txt") ? doc.name : `${doc.name}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="w-8 h-8 text-rose-500" />;
    }
    if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv")) {
      return <FileCode className="w-8 h-8 text-emerald-600" />;
    }
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
      return <FileCode className="w-8 h-8 text-orange-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  const DocumentUploadContent = (
    <Card className="border border-primary/25 bg-card p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Upload className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">ファイルをアップロード</span>
        </div>
        <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 px-2 py-0 text-[9px] font-bold text-primary">
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
          uploading && "opacity-75 pointer-events-none"
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
            <p className="text-xs font-bold text-primary">ファイルをアップロード中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
            <div className="p-3 rounded-full bg-primary/10 text-primary dark:bg-primary/20 mb-1">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-foreground">
              ファイルをドラッグ＆ドロップするか、<br />クリックしてアップロード
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
    <Card className="border border-primary/25 bg-card p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">
            {editingMemoId ? "メモを編集" : "メモを追加"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 px-2 py-0 text-[9px] font-bold text-primary">
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
          <Brain className={cn(
            "w-3.5 h-3.5 transition-colors",
            memoUseForAi ? "text-primary animate-pulse" : "text-muted-foreground/60"
          )} />
          <span className="text-[10px] font-bold text-muted-foreground">AIに使う</span>
          <button
            type="button"
            onClick={() => setMemoUseForAi(!memoUseForAi)}
            className={cn(
              "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              memoUseForAi ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                memoUseForAi ? "translate-x-3" : "translate-x-0"
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
  const ProjectDetailsContent = (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Activities and AudioMinutes Tab */}
        {centerTab === "activities" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="hidden md:flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground">活動履歴</h2>
                <p className="text-xs font-medium text-muted-foreground">
                  議事録と案件活動を時系列で確認します
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/recording")}
                className="gap-1.5 font-bold shadow-sm"
              >
                <Mic className="w-4 h-4" />
                <span>音声録音</span>
              </Button>
            </div>
            {/* Mobile recording CTA row */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/recording")}
              className="md:hidden flex items-center justify-center gap-2 h-10 w-full font-bold shadow-sm rounded-xl"
            >
              <Mic className="w-4 h-4" />
              <span>音声録音を開始</span>
            </Button>
            {/* Audio Minutes section */}
            {projectMinutes.map((m) => {
              const doneCount = m.checklist.filter((c) => c.checked).length;
              return (
                <Card
                  key={m.id}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex flex-col gap-2.5">
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
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {m.recording_date}
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
                    {m.checklist.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-[9px] font-medium border-border px-1.5 py-0.2">
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
                className="w-full p-4 rounded-xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 shrink-0">
                        <FileText className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-foreground leading-snug truncate">
                        {a.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(a.created_at)}
                    </span>
                  </div>
                  {a.content_json?.summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40 font-medium">
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
                  活動履歴はありません
                </p>
                <p className="text-xs text-muted-foreground">
                  この案件に対する会議、議事録、活動記録はまだありません。
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {centerTab === "tasks" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {projectTasks.map((task) => {
              const isOverdue =
                task.due_date &&
                !task.is_completed &&
                new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

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
                      <span className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold",
                        task.is_completed
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-primary/20 bg-primary/10 text-primary",
                      )}>
                        {task.progress_percent ?? (task.is_completed ? 100 : 0)}%
                      </span>
                      <p className={cn(
                        "text-sm font-bold text-foreground leading-tight truncate",
                        task.is_completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                    </div>
                    {task.due_date && (
                      <span className={cn(
                        "text-[10px] font-semibold flex items-center gap-1.5 shrink-0",
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      )}>
                        <Calendar className="w-3.5 h-3.5" /> 期限: {task.due_date}
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
                          style={{ width: `${task.progress_percent ?? (task.is_completed ? 100 : 0)}%` }}
                        />
                      </div>
                      <select
                        value={task.progress_percent ?? (task.is_completed ? 100 : 0)}
                        onChange={(e) => {
                          const progress = Number(e.target.value);
                          updateTask(task.id, {
                            progress_percent: progress,
                            is_completed: progress === 100,
                          });
                        }}
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        aria-label={`${task.title} の進捗率`}
                      >
                        {Array.from({ length: 11 }, (_, index) => index * 10).map((progress) => (
                          <option key={progress} value={progress}>
                            {progress}%
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[9px] font-bold px-1.5 py-0.2 rounded border-0">
                          期限切れ
                        </Badge>
                      )}
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-bold px-1.5 py-0.2 rounded border-0",
                        task.is_completed ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                      )}>
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
        {centerTab === "documents" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">添付ファイル・メモ</h2>
                <p className="text-xs font-medium text-muted-foreground">
                  AI学習データ・添付ファイル一覧 ({projectMemos.length + projectDocuments.length})
                </p>
              </div>
              <div className="relative shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => setDocumentActionMode((mode) => mode === "menu" ? null : "menu")}
                  className={cn(
                    "h-9 w-9 rounded-full px-0 shadow-sm transition-all",
                    documentActionMode && "ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                  )}
                  title="添付ファイル・メモを追加"
                  aria-label="添付ファイル・メモを追加"
                  aria-expanded={documentActionMode === "menu"}
                >
                  <Plus className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    documentActionMode && "rotate-45"
                  )} />
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

            {documentActionMode === "upload" && DocumentUploadContent}
            {documentActionMode === "memo" && DocumentMemoContent}
                
            <div className="flex flex-col gap-2.5">
                  {/* Memo Items */}
                  {projectMemos.map((memo) => {
                    const uploader = profiles.find((p) => p.id === memo.created_by);
                    const isEditing = editingMemoId === memo.id;
                    return (
                      <Card
                        key={memo.id}
                        onClick={() => startEditingMemo(memo.id)}
                        className={cn(
                          "p-3.5 border bg-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-primary/20 hover:shadow-xs transition-all duration-200 group cursor-pointer",
                          isEditing ? "border-primary ring-2 ring-primary/10" : "border-border"
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                          <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex flex-col gap-0.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground leading-snug">
                                案件メモ (テキスト)
                              </span>
                              {memo.use_for_ai && (
                                <Badge variant="outline" className="text-[8px] font-semibold border-primary/20 bg-primary/5 text-primary px-1.5 py-0 rounded-full flex items-center gap-0.5 animate-in zoom-in-95 duration-200">
                                  <Brain className="w-2.5 h-2.5 animate-pulse" />
                                  AI使用中
                                </Badge>
                              )}
                              {isEditing && (
                                <Badge variant="secondary" className="text-[8px] font-bold px-1.5 py-0 rounded-full bg-primary/10 text-primary border-0">
                                  編集中
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-semibold truncate pr-2">
                              {memo.content.trim() ? memo.content : "（空のメモ）"}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground/80 font-medium flex-wrap">
                              <span>作成日: {formatSimpleDate(memo.created_at.slice(0, 10))}</span>
                              <span>•</span>
                              <span>{uploader?.name || "メンバー"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 shrink-0 w-full sm:w-auto sm:ml-4" onClick={(e) => e.stopPropagation()}>
                          {/* Switch for AI */}
                          <div className="flex items-center gap-1.5 select-none">
                            <span className="text-[9px] font-bold text-muted-foreground">AIに使う</span>
                            <button
                              type="button"
                              onClick={() => {
                                updateProjectMemo(memo.id, {
                                  use_for_ai: !memo.use_for_ai
                                });
                                if (memo.id === editingMemoId) {
                                  setMemoUseForAi(!memo.use_for_ai);
                                }
                              }}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                memo.use_for_ai ? "bg-primary" : "bg-muted-foreground/30"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                  memo.use_for_ai ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5 border-l border-border/60 pl-2">
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
                              <span className="text-xs font-bold text-foreground leading-snug truncate pr-2">
                                {doc.name}
                              </span>
                              {doc.use_for_ai && (
                                <Badge variant="outline" className="text-[8px] font-semibold border-primary/20 bg-primary/5 text-primary px-1.5 py-0 rounded-full flex items-center gap-0.5">
                                  <Brain className="w-2.5 h-2.5 animate-pulse" />
                                  AI使用中
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold flex-wrap">
                              <span>{formatSize(doc.file_size)}</span>
                              <span>•</span>
                              <span>{formatSimpleDate(doc.uploaded_at.slice(0, 10))}</span>
                              <span>•</span>
                              <span className="text-foreground/70 flex items-center gap-0.5">
                                <User className="w-3 h-3" /> {uploader?.name || "メンバー"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 shrink-0 w-full sm:w-auto sm:ml-4">
                          {/* Switch for AI */}
                          <div className="flex items-center gap-1.5 select-none">
                            <span className="text-[9px] font-bold text-muted-foreground">AIに使う</span>
                            <button
                              type="button"
                              onClick={() => {
                                updateProjectDocument(doc.id, {
                                  use_for_ai: !doc.use_for_ai
                                });
                              }}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                doc.use_for_ai ? "bg-primary" : "bg-muted-foreground/30"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                  doc.use_for_ai ? "translate-x-4" : "translate-x-0"
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
                        添付ファイル・メモはありません
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

  // 3. Right Collapsible Context Panel Content
  const renderProfileContent = (closeButton: ReactNode) => {
    return (
      <div className="h-full flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <span className="font-bold text-xs text-foreground tracking-wider uppercase flex items-center gap-1.5">
            <Info className="w-4 h-4 text-primary" />
            案件概要
          </span>
          {closeButton}
        </div>

        {/* Formatted metadata */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              ステータス
            </span>
            <div className="flex items-center">
              <StatusBadge status={project.status} className="text-xs py-0.5 px-2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              優先度
            </span>
            <div className="flex items-center">
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border", priorityColor[project.priority])}>
                {priorityLabel[project.priority]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              案件金額
            </span>
            <span className="text-lg font-bold text-foreground tracking-tight">
              {project.amount !== undefined ? `¥${project.amount.toLocaleString("ja-JP")}` : "¥0"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              完了予定日
            </span>
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {project.close_date ? formatSimpleDate(project.close_date) : "未設定"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              次回アクション日
            </span>
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {project.next_action_date ? formatSimpleDate(project.next_action_date) : "未設定"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              担当メンバー
            </span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20 shrink-0">
                {owner?.avatar || "未"}
              </div>
              <span className="text-xs font-bold text-foreground">
                {owner?.name || "未担当"}
              </span>
            </div>
          </div>

          {project.labels && project.labels.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                ラベル
              </span>
              <div className="flex flex-wrap gap-1">
                {project.labels.map((l) => (
                  <Badge key={l} variant="outline" className="text-[9px] font-semibold border-border px-1.5 py-0.2 bg-background">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {customer ? (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary/[0.025] dark:bg-primary/[0.05] border border-primary/10 dark:border-primary/20">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Building className="w-3 h-3" />
                紐付け企業
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-foreground truncate">{customer.name}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{customer.industry?.join("、")}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10 gap-1 mt-1 justify-center w-full shadow-2xs"
              >
                <span>企業詳細へ移動</span>
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-bold text-destructive">
              <Building2 className="w-4 h-4 shrink-0" />
              企業未紐付け
            </div>
          )}

          {projectMemos.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                メモ・特記事項 ({projectMemos.length})
              </span>
              <div className="flex flex-col gap-2">
                {projectMemos.map((m) => (
                  <div key={m.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        {formatSimpleDate(m.created_at.slice(0, 10))}
                      </span>
                      {m.use_for_ai && (
                        <Badge variant="outline" className="text-[8px] font-semibold border-primary/20 bg-primary/5 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none">
                          <Brain className="w-2.5 h-2.5 animate-pulse" />
                          AI使用中
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        {/* Project Header */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 md:py-5 shrink-0 shadow-xs z-20 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3 min-w-0 flex-1">
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
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground h-9 w-9 rounded-full bg-muted/40 hover:bg-muted"
                title="戻る"
                aria-label="戻る"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 pt-0.5 flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    {project.name}
                  </h1>
                  <StatusBadge status={project.status} className="text-xs py-0.5 px-2" />
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border", priorityColor[project.priority])}>
                    優先度 {priorityLabel[project.priority]}
                  </span>
                  {project.amount !== undefined && (
                    <Badge variant="secondary" className="font-semibold text-secondary-foreground text-xs px-2.5 py-0.5">
                      ¥{project.amount.toLocaleString("ja-JP")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-semibold">
                  {customer && (
                    <span className="flex items-center gap-1.5 text-foreground/80 cursor-pointer hover:underline" onClick={() => navigate(`/customers/${customer.id}`)}>
                      <Building className="w-3.5 h-3.5 text-primary" /> {customer.name}
                    </span>
                  )}
                  <span className="hidden sm:inline text-border">|</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" /> 更新: {formatDate(project.updated_at)}
                  </span>
                </div>
              </div>
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
            </div>
          </div>

          {/* Mobile Edit Button */}
          <div className="flex md:hidden items-center gap-2 mt-4 pt-4 border-t border-border/60 justify-end relative z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenEditProjectDialog}
              className="flex-1 gap-1.5 font-bold shadow-2xs justify-center"
            >
              <Edit className="w-4 h-4" /> 編集
            </Button>
          </div>
        </div>

        {/* Mobile Section Switcher */}
        <div className="md:hidden border-b border-border bg-card px-4 py-3 shrink-0 z-10">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span>案件メニュー</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mobileSections.map((section) => {
              const isActive = mobileSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setMobileSection(section.id);
                    if (section.id !== "context") setCenterTab(section.id as CenterTab);
                  }}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="shrink-0">{section.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold">{section.label}</span>
                  {section.count > 0 && (
                    <span className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      {section.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Content Area */}
        <div className="md:hidden flex-1 overflow-y-auto bg-background/50">
          {mobileSection !== "context" && ProjectDetailsContent}
          {mobileSection === "context" && renderProfileContent(null)}
        </div>

        {/* Desktop View 3-Column Layout */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-muted/10 dark:bg-background">
          {/* Left Navigation Column */}
          <aside className="w-56 shrink-0 border-r border-border bg-card p-3">
            <div className="mb-3 flex items-center gap-1.5 px-2">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                案件メニュー
              </span>
            </div>
            <nav className="flex flex-col gap-1.5">
              {centerSections.map((section) => {
                const isActive = centerTab === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setCenterTab(section.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}>
                      {section.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{section.label}</span>
                    {section.count > 0 && (
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
                          isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {section.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Column */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-background">
            {ProjectDetailsContent}
          </div>

          {/* Right Column (Collapsible Context Panel) */}
          <div
            className={cn(
              "shrink-0 bg-card border-l border-border overflow-hidden shadow-xs z-10 transition-[width] duration-200",
              isContextPanelOpen ? "w-72" : "w-13",
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
                    <PanelRightClose className="h-4 w-4" />
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
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
                <span className="mt-6 [writing-mode:vertical-rl] text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  案件概要
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
