import {
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const settingCards = [
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
  {
    title: "カレンダー連携",
    description: "外部カレンダーとの連携状態を管理します。",
    icon: CalendarDays,
  },
  {
    title: "機能選択",
    description: "サイドメニューに表示する追加機能を選択します。",
    icon: SlidersHorizontal,
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
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <form onSubmit={handleSave}>
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>AIアシスタント詳細</DialogTitle>
              <DialogDescription>AIアシスタントのカラム情報を編集できます。</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-5">
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
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <form onSubmit={handleSave}>
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>ドキュメントテンプレート詳細</DialogTitle>
              <DialogDescription>テンプレートの内容と生成時の構成を編集できます。</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-5">
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
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <form onSubmit={handleSave}>
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>チェックテンプレート詳細</DialogTitle>
              <DialogDescription>チェックテンプレートの実行条件とプロンプトを編集できます。</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-5">
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
                    <input
                      key={index}
                      value={item}
                      onChange={(event) => updateCheckItem(index, event.target.value)}
                      placeholder="例：指名・希望職種の確認"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  ))}
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  {formValues.checkItems.length}/{MAX_CHECK_ITEMS}
                </p>
              </div>
              <TextAreaField label="プロンプト" value={formValues.prompt} rows={7} onChange={(value) => setFormValues((current) => ({ ...current, prompt: value }))} />
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

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <PageHeader title="基本設定" description="利用環境や機能表示を管理します。" />
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {settingCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => card.path && navigate(card.path)}
                  className="rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-sm font-bold text-foreground">{card.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
