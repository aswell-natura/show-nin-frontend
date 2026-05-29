import {
  AlertCircle,
  Bot,
  Building,
  CalendarDays,
  Check,
  ChevronLeft,
  ExternalLink,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  loadFeatureFlags,
  optionalFeatures,
  saveFeatureFlags,
  type OptionalFeatureFlags,
  type OptionalFeatureId,
} from "@/lib/feature-menu";

const settingSections = [
  {
    title: "ユーザー情報",
    cards: [
      {
        title: "ユーザー",
        description: "利用ユーザーの権限やステータスを管理します。",
        icon: User,
        path: "/users",
      },
      {
        title: "自社情報",
        description: "自社の基本情報を管理します。",
        icon: Building,
        path: "/company",
      },
    ],
  },
  {
    title: "AI機能",
    cards: [
      {
        title: "AIアシスタント設定",
        description: "AI応答や補助機能の利用方針を管理します。",
        icon: Bot,
        path: "/settings/ai-assistants",
      },
      {
        title: "ドキュメントテンプレート設定",
        description: "契約書や見積書などの雛形を管理します。",
        icon: FileText,
        path: "/settings/document-templates",
      },
      {
        title: "チェックテンプレート設定",
        description: "確認項目やチェックリストの雛形を管理します。",
        icon: ListChecks,
        path: "/settings/check-templates",
      },
    ],
  },
  {
    title: "補助機能",
    cards: [
      {
        title: "カレンダー連携",
        description: "外部カレンダーとの連携状態を管理します。",
        icon: CalendarDays,
        path: "/settings/calendar-integration",
      },
    ],
  },
  {
    title: "オプション",
    cards: [
      {
        title: "機能選択",
        description: "サイドメニューに表示する追加機能を選択します。",
        icon: SlidersHorizontal,
        path: "/settings/features",
      },
      {
        title: "登録項目の選択",
        description: "ラベルや、フェーズなど登録フォームで使用する項目を管理します。",
        icon: ListChecks,
        path: "/registration-items",
      },
    ],
  },
];

interface AiAssistant {
  id: string;
  name: string;
  summary: string;
  intervalSeconds: number;
  isDefault: boolean;
  prompt: string;
}

const initialAiAssistants: AiAssistant[] = [
  {
    id: "assistant-001",
    name: "議事録要約アシスタント",
    summary: "録音内容から議事録の概要、決定事項、ネクストアクションを抽出します。",
    intervalSeconds: 60,
    isDefault: true,
    prompt:
      "録音内容を読み取り、議事録の概要、決定事項、未完了の論点、ネクストアクションを簡潔に整理してください。",
  },
  {
    id: "assistant-002",
    name: "タスク抽出アシスタント",
    summary: "顧客や案件に紐づくタスク候補を会話内容から自動生成します。",
    intervalSeconds: 120,
    isDefault: false,
    prompt:
      "会話内容から担当者、期限、タスク名、優先度を抽出し、顧客または案件に紐づくタスク候補として出力してください。",
  },
  {
    id: "assistant-003",
    name: "商談フォローアシスタント",
    summary: "商談後のフォローメールや確認事項の下書きを作成します。",
    intervalSeconds: 300,
    isDefault: false,
    prompt:
      "商談内容をもとに、相手に送るフォローメール、確認事項、次回提案に向けた補足情報を作成してください。",
  },
];

interface DocumentTemplate {
  id: string;
  title: string;
  type: string;
  description: string;
  promptStructure: string;
}

const templateTypeOptions = ["見積書", "契約書", "請求書", "提案書", "議事録"];

const initialDocumentTemplates: DocumentTemplate[] = [
  {
    id: "template-001",
    title: "標準見積書テンプレート",
    type: "見積書",
    description: "案件金額、内訳、支払条件を整理して見積書を作成します。",
    promptStructure:
      "顧客名、案件名、提供範囲、金額、支払条件、備考を含め、読みやすい見積書形式で構成してください。",
  },
  {
    id: "template-002",
    title: "業務委託契約書テンプレート",
    type: "契約書",
    description: "業務範囲、契約期間、報酬、秘密保持を含む契約書の雛形です。",
    promptStructure:
      "契約当事者、業務内容、契約期間、報酬、検収、秘密保持、解除条項を章立てで構成してください。",
  },
  {
    id: "template-003",
    title: "商談議事録テンプレート",
    type: "議事録",
    description: "商談内容から決定事項と次回アクションを整理します。",
    promptStructure:
      "参加者、議題、要点、決定事項、懸念点、ネクストアクション、期限を一覧化してください。",
  },
];

interface CheckTemplate {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  intervalSeconds: number;
  applyByDefault: boolean;
  checkItems: string[];
  prompt: string;
}

const MAX_CHECK_ITEMS = 30;

const initialCheckTemplates: CheckTemplate[] = [
  {
    id: "check-template-001",
    title: "商談前確認チェック",
    description: "商談前に顧客情報、提案内容、目的を確認するためのテンプレートです。",
    itemCount: 6,
    intervalSeconds: 60,
    applyByDefault: true,
    checkItems: [
      "指名・希望職種の確認",
      "商談目的の確認",
      "提案内容への合意確認",
      "次回アクションの確認",
      "期限の確認",
      "担当者の確認",
    ],
    prompt:
      "商談前に確認すべき顧客情報、過去接点、提案内容、商談目的、想定質問、次回アクション候補をチェック項目として整理してください。",
  },
  {
    id: "check-template-002",
    title: "契約前確認チェック",
    description: "契約締結前に条件、金額、納期、リスクを確認します。",
    itemCount: 8,
    intervalSeconds: 120,
    applyByDefault: false,
    checkItems: [
      "契約条件の確認",
      "金額の確認",
      "納期の確認",
      "検収条件の確認",
      "支払条件の確認",
      "責任範囲の確認",
      "リスクの確認",
      "承認状況の確認",
    ],
    prompt:
      "契約締結前に確認すべき契約条件、金額、納期、検収、支払条件、責任範囲、リスク、承認状況を抽出してください。",
  },
  {
    id: "check-template-003",
    title: "議事録品質チェック",
    description: "議事録に決定事項、担当者、期限が含まれているか確認します。",
    itemCount: 5,
    intervalSeconds: 180,
    applyByDefault: false,
    checkItems: [
      "概要の記載確認",
      "決定事項の記載確認",
      "未解決事項の記載確認",
      "担当者の記載確認",
      "期限の記載確認",
    ],
    prompt:
      "議事録に概要、決定事項、未解決事項、担当者、期限が含まれているかをチェックできる項目にしてください。",
  },
];

function AiAssistantTable() {
  const [assistants, setAssistants] = useState(initialAiAssistants);
  const [selectedAssistant, setSelectedAssistant] = useState<AiAssistant | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    isDefault: false,
    summary: "",
    prompt: "",
  });

  const openDetail = (assistant: AiAssistant) => {
    setSelectedAssistant(assistant);
    setFormValues({
      name: assistant.name,
      isDefault: assistant.isDefault,
      summary: assistant.summary,
      prompt: assistant.prompt,
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAssistant) return;

    setAssistants((current) =>
      current.map((assistant) =>
        assistant.id === selectedAssistant.id
          ? { ...assistant, ...formValues }
          : formValues.isDefault
            ? { ...assistant, isDefault: false }
            : assistant,
      ),
    );
    setSelectedAssistant(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <PageHeader title="AIアシスタント設定" description="作成済みのAIアシスタントを一覧で確認できます。" showBackButton />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <DataTable>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12"><Checkbox aria-label="すべて選択" /></TableHead>
              <TableHead className="w-28">デフォルト</TableHead>
              <TableHead className="w-64">名前</TableHead>
              <TableHead>AI概要</TableHead>
              <TableHead className="w-44 text-right">実行間隔（秒表記）</TableHead>
              <TableHead className="w-28 text-right">詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assistants.map((assistant) => (
              <TableRow key={assistant.id}>
                <TableCell><Checkbox aria-label={`${assistant.name}を選択`} /></TableCell>
                <TableCell>{assistant.isDefault ? <DefaultMark /> : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell className="font-medium text-foreground">{assistant.name}</TableCell>
                <TableCell className="text-muted-foreground">{assistant.summary}</TableCell>
                <TableCell className="text-right font-medium">{assistant.intervalSeconds}秒</TableCell>
                <TableCell className="text-right">
                  <DetailButton onClick={() => openDetail(assistant)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>

      <Dialog open={selectedAssistant !== null} onOpenChange={(open) => !open && setSelectedAssistant(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
          <form onSubmit={handleSave} className="flex max-h-[calc(100vh-2rem)] flex-col">
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>AIアシスタント詳細</DialogTitle>
              <DialogDescription>AIアシスタントのカラム情報を編集できます。</DialogDescription>
            </DialogHeader>
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <InputField
                  label="名前"
                  value={formValues.name}
                  onChange={(value) => setFormValues((current) => ({ ...current, name: value }))}
                />
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <label className="flex h-6 items-center gap-3">
                    <Checkbox
                      checked={formValues.isDefault}
                      onCheckedChange={(checked) =>
                        setFormValues((current) => ({ ...current, isDefault: checked === true }))
                      }
                      aria-label="デフォルトに設定"
                    />
                    <span className="whitespace-nowrap text-sm font-medium text-foreground">デフォルト</span>
                  </label>
                  <p className="mt-1 pl-7 text-xs leading-5 text-muted-foreground">
                    録音の初期状態として使用されます。
                  </p>
                </div>
              </div>
              <TextAreaField label="説明" value={formValues.summary} rows={3} onChange={(value) => setFormValues((current) => ({ ...current, summary: value }))} />
              <TextAreaField label="プロンプト" value={formValues.prompt} rows={6} onChange={(value) => setFormValues((current) => ({ ...current, prompt: value }))} />
            </div>
            <ModalFooter onCancel={() => setSelectedAssistant(null)} />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentTemplateTable() {
  const [templates, setTemplates] = useState(initialDocumentTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formValues, setFormValues] = useState({
    title: "",
    type: templateTypeOptions[0],
    description: "",
    promptStructure: "",
  });

  const openDetail = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormValues({
      title: template.title,
      type: template.type,
      description: template.description,
      promptStructure: template.promptStructure,
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTemplate) return;
    setTemplates((current) =>
      current.map((template) =>
        template.id === selectedTemplate.id ? { ...template, ...formValues } : template,
      ),
    );
    setSelectedTemplate(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <PageHeader title="ドキュメントテンプレート設定" description="作成済みのドキュメントテンプレートを一覧で確認できます。" showBackButton />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <DataTable>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-72">タイトル</TableHead>
              <TableHead className="w-36">種類</TableHead>
              <TableHead>テンプレートの説明</TableHead>
              <TableHead className="w-28 text-right">詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium text-foreground">{template.title}</TableCell>
                <TableCell>{template.type}</TableCell>
                <TableCell className="text-muted-foreground">{template.description}</TableCell>
                <TableCell className="text-right"><DetailButton onClick={() => openDetail(template)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>

      <Dialog open={selectedTemplate !== null} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
          <form onSubmit={handleSave} className="flex max-h-[calc(100vh-2rem)] flex-col">
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>ドキュメントテンプレート詳細</DialogTitle>
              <DialogDescription>テンプレートの内容と生成時の構成を編集できます。</DialogDescription>
            </DialogHeader>
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <InputField label="タイトル" value={formValues.title} onChange={(value) => setFormValues((current) => ({ ...current, title: value }))} />
              <SelectField label="種類" value={formValues.type} options={templateTypeOptions} onChange={(value) => setFormValues((current) => ({ ...current, type: value }))} />
              <TextAreaField label="説明" value={formValues.description} rows={3} onChange={(value) => setFormValues((current) => ({ ...current, description: value }))} />
              <TextAreaField label="プロンプト / 構成" value={formValues.promptStructure} rows={7} onChange={(value) => setFormValues((current) => ({ ...current, promptStructure: value }))} />
            </div>
            <ModalFooter onCancel={() => setSelectedTemplate(null)} />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckTemplateTable() {
  const [templates, setTemplates] = useState(initialCheckTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<CheckTemplate | null>(null);
  const [formValues, setFormValues] = useState({
    title: "",
    intervalSeconds: 60,
    applyByDefault: false,
    checkItems: [] as string[],
    prompt: "",
  });

  const openDetail = (template: CheckTemplate) => {
    setSelectedTemplate(template);
    setFormValues({
      title: template.title,
      intervalSeconds: template.intervalSeconds,
      applyByDefault: template.applyByDefault,
      checkItems: template.checkItems,
      prompt: template.prompt,
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTemplate) return;
    const checkItems = formValues.checkItems
      .map((item) => item.trim())
      .filter(Boolean);
    setTemplates((current) =>
      current.map((template) =>
        template.id === selectedTemplate.id
          ? {
              ...template,
              title: formValues.title,
              intervalSeconds: formValues.intervalSeconds,
              applyByDefault: formValues.applyByDefault,
              checkItems,
              itemCount: checkItems.length,
              prompt: formValues.prompt,
            }
          : template,
      ),
    );
    setSelectedTemplate(null);
  };

  const addCheckItem = () => {
    setFormValues((current) => {
      if (current.checkItems.length >= MAX_CHECK_ITEMS) return current;
      return { ...current, checkItems: [...current.checkItems, ""] };
    });
  };

  const updateCheckItem = (index: number, value: string) => {
    setFormValues((current) => ({
      ...current,
      checkItems: current.checkItems.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  };

  const removeCheckItem = (index: number) => {
    setFormValues((current) => ({
      ...current,
      checkItems: current.checkItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <PageHeader title="チェックテンプレート設定" description="作成済みのチェックテンプレートを一覧で確認できます。" showBackButton />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <DataTable>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-72">タイトル</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="w-28 text-right">項目数</TableHead>
              <TableHead className="w-36 text-right">実行間隔</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.id}
                className="cursor-pointer"
                onClick={() => openDetail(template)}
              >
                <TableCell className="font-medium text-foreground">{template.title}</TableCell>
                <TableCell className="text-muted-foreground">{template.description}</TableCell>
                <TableCell className="text-right">{template.itemCount}件</TableCell>
                <TableCell className="text-right">{template.intervalSeconds}秒</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>

      <Dialog open={selectedTemplate !== null} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
          <form onSubmit={handleSave} className="flex max-h-[calc(100vh-2rem)] flex-col">
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>チェックテンプレート詳細</DialogTitle>
              <DialogDescription>チェックテンプレートの実行条件とプロンプトを編集できます。</DialogDescription>
            </DialogHeader>
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <InputField label="タイトル" value={formValues.title} onChange={(value) => setFormValues((current) => ({ ...current, title: value }))} />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">実行間隔</span>
                  <input
                    type="number"
                    min="1"
                    value={formValues.intervalSeconds}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        intervalSeconds: Number(event.target.value),
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </label>
                <label className="flex h-10 items-center gap-3 rounded-lg border border-border bg-muted/20 px-3">
                  <Checkbox
                    checked={formValues.applyByDefault}
                    onCheckedChange={(checked) =>
                      setFormValues((current) => ({
                        ...current,
                        applyByDefault: checked === true,
                      }))
                    }
                    aria-label="デフォルトで適用"
                  />
                  <span className="whitespace-nowrap text-sm font-medium text-foreground">デフォルトで適用</span>
                </label>
              </div>
              <TextAreaField label="プロンプト" value={formValues.prompt} rows={7} onChange={(value) => setFormValues((current) => ({ ...current, prompt: value }))} />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">
                    追加チェック項目
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={addCheckItem}
                    disabled={formValues.checkItems.length >= MAX_CHECK_ITEMS}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    項目追加
                  </Button>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  AIが会話内容に応じてチェックを付ける内容を入力してください。
                </p>
                <div className="space-y-2">
                  {formValues.checkItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                      value={item}
                      onChange={(event) => updateCheckItem(index, event.target.value)}
                      placeholder="例：指名・希望職種の確認"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeCheckItem(index)}
                        aria-label="チェック項目を削除"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  {formValues.checkItems.length}/{MAX_CHECK_ITEMS}
                </p>
              </div>
            </div>
            <ModalFooter onCancel={() => setSelectedTemplate(null)} />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageHeader({
  title,
  description,
  showBackButton = false,
}: {
  title: string;
  description: string;
  showBackButton?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
      <div className="flex items-start gap-3">
        {showBackButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 h-8 w-8 shrink-0"
            onClick={() => navigate("/settings")}
            aria-label="設定一覧に戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table>{children}</Table>
    </div>
  );
}

function DefaultMark() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Check className="h-4 w-4" />
    </span>
  );
}

function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" />
      詳細
    </Button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}

function ModalFooter({ onCancel }: { onCancel: () => void }) {
  return (
    <DialogFooter>
      <Button type="button" variant="secondary" onClick={onCancel}>キャンセル</Button>
      <Button type="submit" variant="primary">保存</Button>
    </DialogFooter>
  );
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function GoogleCalendarLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      height="36"
      viewBox="0 0 36 36"
      width="36"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>Google Calendar</title>
      <g fill="none" fillRule="evenodd">
        <path d="m0 0h36v36h-36z" />
        <g fillRule="nonzero" transform="translate(3.75 3.75)">
          <path d="m21.75 6.75-6.75-.75-8.25.75-.75 7.5.75 7.5 7.5.9375 7.5-.9375.75-7.6875z" fill="#fff" />
          <path d="m9.826875 18.38625c-.560625-.37875-.94875-.931875-1.160625-1.663125l1.30125-.53625c.118125.45.324375.79875.61875 1.04625.2925.2475.64875.369375 1.065.369375.425625 0 .79125-.129375 1.096875-.388125s.459375-.58875.459375-.988125c0-.40875-.16125-.7425-.48375-1.00125s-.7275-.388125-1.21125-.388125h-.751875v-1.288125h.675c.41625 0 .766875-.1125 1.051875-.3375s.4275-.5325.4275-.924375c0-.34875-.1275-.62625-.3825-.834375s-.5775-.313125-.969375-.313125c-.3825 0-.68625.10125-.91125.305625s-.388125.455625-.49125.751875l-1.288125-.53625c.170625-.48375.48375-.91125.943125-1.280625s1.04625-.555 1.75875-.555c.526875 0 1.00125.10125 1.42125.305625s.75.4875.988125.8475c.238125.361875.35625.766875.35625 1.216875 0 .459375-.110625.8475-.331875 1.16625s-.493125.5625-.815625.733125v.076875c.425625.178125.7725.45 1.04625.815625.271875.365625.40875.8025.40875 1.3125s-.129375.965625-.388125 1.365-.616875.714375-1.070625.943125c-.455625.22875-.9675.3450138-1.535625.3450138-.658125.0018612-1.265625-.1875138-1.82625-.5662638z" fill="#1a73e8" />
          <path d="m17.8125 11.92875-1.42125 1.033125-.714375-1.08375 2.563125-1.84875h.9825v8.720625h-1.41z" fill="#1a73e8" />
          <path d="m21.75 28.5 6.75-6.75-3.375-1.5-3.375 1.5-1.5 3.375z" fill="#ea4335" />
          <path d="m5.25 25.125 1.5 3.375h15v-6.75h-15z" fill="#34a853" />
          <path d="m2.25 0c-1.243125 0-2.25 1.006875-2.25 2.25v19.5l3.375 1.5 3.375-1.5v-15h15l1.5-3.375-1.5-3.375z" fill="#4285f4" />
          <path d="m0 21.75v4.5c0 1.243125 1.006875 2.25 2.25 2.25h4.5v-6.75z" fill="#188038" />
          <path d="m21.75 6.75v15h6.75v-15l-3.375-1.5z" fill="#fbbc04" />
          <path d="m28.5 6.75v-4.5c0-1.243125-1.006875-2.25-2.25-2.25h-4.5v6.75z" fill="#1967d2" />
        </g>
      </g>
    </svg>
  );
}

function OutlookCalendarLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>Outlook Calendar</title>
      <path fill="#0078D4" d="M9.5 3.5h12A1.5 1.5 0 0 1 23 5v14a1.5 1.5 0 0 1-1.5 1.5h-12z" />
      <path fill="#106EBE" d="M9.5 6.5H23v4H9.5z" />
      <path fill="#28A8EA" d="M9.5 10.5H23v8A1.5 1.5 0 0 1 21.5 20h-12z" />
      <path fill="#50D9FF" d="M12.5 12h2.75v2.25H12.5zm4 0h2.75v2.25H16.5zm4 0H23v2.25h-2.5zm-8 3.5h2.75v2.25H12.5zm4 0h2.75v2.25H16.5zm4 0H23v2.25h-2.5z" />
      <path fill="#005A9E" d="M1 6.25 10.75 4.5v15L1 17.75A1.2 1.2 0 0 1 0 16.57V7.43a1.2 1.2 0 0 1 1-1.18z" />
      <path fill="#FFFFFF" d="M5.35 9.05c1.73 0 2.9 1.28 2.9 3.05 0 1.79-1.18 3.1-2.94 3.1-1.72 0-2.9-1.28-2.9-3.05 0-1.83 1.22-3.1 2.94-3.1zm-.02 1.16c-.91 0-1.47.78-1.47 1.9 0 1.11.57 1.91 1.48 1.91.93 0 1.47-.78 1.47-1.91 0-1.11-.55-1.9-1.48-1.9z" />
    </svg>
  );
}

function CalendarIntegrationPage() {
  const initialStartDate = formatDateValue(new Date());
  const initialEndDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return formatDateValue(date);
  })();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const providers = [
    {
      name: "Google Calendar",
      status: "未設定",
      actionLabel: "Googleと連携",
      Logo: GoogleCalendarLogo,
    },
    {
      name: "Outlook Calendar",
      status: "未設定",
      actionLabel: "Outlookと連携",
      Logo: OutlookCalendarLogo,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <PageHeader
        title="カレンダー連携"
        description="外部カレンダーの予定をSHOW-NINへインポートします。"
        showBackButton
      />

      <div className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              外部カレンダー連携
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Outlook/Googleカレンダーの予定をSHOW-NINにインポート
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {providers.map((provider) => {
              const ProviderLogo = provider.Logo;

              return (
                <div
                  key={provider.name}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-border"
                    >
                      <ProviderLogo className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-foreground">
                        {provider.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {provider.status}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-5 w-full gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {provider.actionLabel}
                  </Button>
                </div>
              );
            })}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">取得期間</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,240px)]">
              <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                <span className="text-sm font-medium text-muted-foreground">開始:</span>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  clearable={false}
                  buttonClassName="rounded-lg"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                <span className="text-sm font-medium text-muted-foreground">終了:</span>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  clearable={false}
                  buttonClassName="rounded-lg"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex gap-3 text-amber-700 dark:text-amber-400">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="text-sm font-bold">外部カレンダー連携について</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                  <li>OAuth認証にはGoogle Cloud Console / Azure AD でのアプリ登録が必要です</li>
                  <li>インポートは単方向（外部-&gt;SHOW-NIN）です</li>
                  <li>同じイベントを複数回インポートすると重複が発生します</li>
                  <li>本番環境ではトークンは安全に管理されます</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureSelectionPage() {
  const [featureFlags, setFeatureFlags] = useState<OptionalFeatureFlags>(() =>
    loadFeatureFlags(),
  );

  const toggleFeature = (featureId: OptionalFeatureId) => {
    setFeatureFlags((current) => {
      const nextFlags = {
        ...current,
        [featureId]: !current[featureId],
      };
      saveFeatureFlags(nextFlags);
      return nextFlags;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <PageHeader title="機能選択" description="使用する追加機能を選択できます。" showBackButton />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <section className="mx-auto max-w-3xl rounded-xl border border-border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {optionalFeatures.map((feature) => {
              const isEnabled = featureFlags[feature.id];
              return (
                <div
                  key={feature.id}
                  id={feature.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground">
                      {feature.label}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isEnabled ? "使用中" : "未使用"}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={isEnabled}
                    onChange={() => toggleFeature(feature.id)}
                    ariaLabel={`${feature.label}の使用可否を切り替え`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { section } = useParams();

  if (section === "ai-assistants") {
    return <AppLayout><AiAssistantTable /></AppLayout>;
  }

  if (section === "document-templates") {
    return <AppLayout><DocumentTemplateTable /></AppLayout>;
  }

  if (section === "check-templates") {
    return <AppLayout><CheckTemplateTable /></AppLayout>;
  }

  if (section === "calendar-integration") {
    return <AppLayout><CalendarIntegrationPage /></AppLayout>;
  }

  if (section === "features") {
    return <AppLayout><FeatureSelectionPage /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <PageHeader title="機能設定" description="利用環境や機能表示を管理します。" />
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-8">
            {settingSections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-sm font-bold text-muted-foreground">
                  {section.title}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {section.cards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => {
                          if ("path" in card && card.path) navigate(card.path);
                        }}
                        className="rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-sm font-bold text-foreground">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {card.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
