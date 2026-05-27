import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Filter,
  FolderKanban,
  Link2,
  Mic,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Sparkles,
  Tag,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const colors = [
  { name: "Action", variable: "--primary", className: "bg-primary", usage: "Selection and commit" },
  { name: "Surface", variable: "--card", className: "bg-card", usage: "Panels and records" },
  { name: "Quiet", variable: "--muted", className: "bg-muted", usage: "Grouping and headers" },
  { name: "Attention", variable: "--destructive", className: "bg-destructive", usage: "Risk and overdue" },
];

const workflow = [
  {
    icon: Mic,
    label: "Capture",
    title: "議事録を取り込む",
    detail: "録音・テキストから会話を構造化",
  },
  {
    icon: Link2,
    label: "Associate",
    title: "顧客と案件へ紐付け",
    detail: "未紐付けをその場で解決",
  },
  {
    icon: FolderKanban,
    label: "Manage",
    title: "案件を進める",
    detail: "状況・担当・次回行動を管理",
  },
  {
    icon: CheckSquare,
    label: "Deliver",
    title: "タスクを完了する",
    detail: "期限と進捗を明確に追跡",
  },
];

const projectRows = [
  {
    name: "業務基幹システム刷新",
    customer: "株式会社ネクストウェーブ",
    status: "提案中",
    priority: "高",
    amount: "1,500万円",
    owner: "山田 智",
    next: "2026/06/03",
  },
  {
    name: "店舗データ統合基盤",
    customer: "東都リテール株式会社",
    status: "交渉中",
    priority: "中",
    amount: "840万円",
    owner: "佐々木 誠",
    next: "2026/05/29",
  },
  {
    name: "採用ポータル改善",
    customer: "みらい人材サービス",
    status: "成約",
    priority: "低",
    amount: "320万円",
    owner: "田中 美咲",
    next: "-",
  },
];

const minuteRows = [
  {
    name: "要件整理・初回ヒアリング",
    customer: "株式会社ネクストウェーブ",
    project: "業務基幹システム刷新",
    date: "2026/05/27 10:30",
    linked: true,
  },
  {
    name: "音声録音 05/26 営業面談",
    customer: "顧客を選択",
    project: "案件を選択",
    date: "2026/05/26 16:00",
    linked: false,
  },
  {
    name: "契約条件レビュー",
    customer: "東都リテール株式会社",
    project: "店舗データ統合基盤",
    date: "2026/05/24 13:00",
    linked: true,
  },
];

const dialogPills = [
  { icon: Building2, label: "顧客", value: "株式会社ネクストウェーブ" },
  { icon: Activity, label: "ステータス", value: "提案中" },
  { icon: Tag, label: "ラベル", value: "重点案件" },
  { icon: User, label: "担当者", value: "山田 智" },
];

type ListPreview = "projects" | "minutes";

export default function DesignShowcase() {
  const [listPreview, setListPreview] = useState<ListPreview>("projects");
  const [profileOpen, setProfileOpen] = useState(true);
  const [overdue, setOverdue] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Show-nin</p>
              <p className="text-[11px] font-medium text-muted-foreground">Design system / Workflow UI</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-semibold text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#foundations">Foundations</a>
            <a className="transition-colors hover:text-foreground" href="#surfaces">Surfaces</a>
            <a className="transition-colors hover:text-foreground" href="#patterns">Patterns</a>
          </nav>
          <Badge variant="outline" className="hidden h-7 px-3 text-[11px] font-semibold sm:inline-flex">
            Living reference
          </Badge>
        </div>
      </header>

      <section className="overflow-hidden border-b border-border/70 bg-muted/20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 md:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:py-20">
          <div className="max-w-xl">
            <Badge className="mb-5 h-7 bg-primary/10 px-3 font-bold text-primary hover:bg-primary/10">
              Product interface standard
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Conversation to action,
              <span className="block text-primary">without losing context.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-muted-foreground sm:text-base">
              Show-nin connects recorded meetings, customer relationships, active projects,
              and tasks in a calm, information-dense workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#surfaces">
                  View workflow
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a href="#foundations">Component standards</a>
              </Button>
            </div>
          </div>

          <WorkflowPreview />
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-5 py-14 md:px-8 lg:py-16">
        <section id="foundations" className="scroll-mt-24 space-y-7">
          <SectionHeading
            eyebrow="01 / Foundations"
            title="Quiet structure, explicit meaning"
            description="Neutral surfaces keep business content legible. Blue identifies action and selection; red appears only where attention is required."
          />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <p className="text-sm font-bold">Semantic color tokens</p>
                <p className="mt-1 text-xs text-muted-foreground">Token-first components remain reliable in light and dark modes.</p>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {colors.map((color) => (
                  <div key={color.variable} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3">
                    <div className={`h-11 w-11 shrink-0 rounded-lg border border-border/40 ${color.className}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{color.name}</p>
                      <p className="font-mono text-[11px] text-primary">{color.variable}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{color.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
              <p className="text-sm font-bold">Actions and status</p>
              <p className="mt-1 text-xs text-muted-foreground">One primary action, quiet support, unmistakable risk.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm"><Plus />追加</Button>
                <Button variant="secondary" size="sm">キャンセル</Button>
                <Button variant="ghost" size="sm">詳細を見る</Button>
                <Button variant="destructive" size="sm">削除</Button>
              </div>
              <div className="mt-6 border-t border-border/60 pt-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">State language</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">提案中</Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">完了</Badge>
                  <Badge variant="secondary">未処理</Badge>
                  <Badge variant="destructive">期限超過</Badge>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="surfaces" className="scroll-mt-24 space-y-7">
          <SectionHeading
            eyebrow="02 / Product Surfaces"
            title="Interfaces built around real work"
            description="List screens resolve intake and pipeline state. Detail screens preserve relationship context. Dialogs keep creation fast and structured."
          />

          <ListSurfaceDemo view={listPreview} onChange={setListPreview} />

          <div className="grid gap-6 xl:grid-cols-[1fr_0.96fr]">
            <DialogSurfaceDemo />
            <DetailSurfaceDemo
              overdue={overdue}
              profileOpen={profileOpen}
              onToggleOverdue={() => setOverdue((current) => !current)}
              onToggleProfile={() => setProfileOpen((current) => !current)}
            />
          </div>
        </section>

        <section id="patterns" className="scroll-mt-24 space-y-7">
          <SectionHeading
            eyebrow="03 / Patterns"
            title="Rules that keep flows coherent"
            description="These decisions are shared by projects, minutes, customer details, tasks, and every new operational view."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PatternCard
              icon={Search}
              title="Recoverable lists"
              text="Search, filters, sorting, and page position belong in URL state."
              reference="Projects / Minutes"
            />
            <PatternCard
              icon={Link2}
              title="Inline association"
              text="Missing relationships are resolved where they are discovered."
              reference="Minutes"
            />
            <PatternCard
              icon={PanelRightOpen}
              title="Persistent context"
              text="Desktop panels collapse; mobile tabs preserve the same mental model."
              reference="Customer detail"
            />
            <PatternCard
              icon={AlertTriangle}
              title="Explicit urgency"
              text="Danger tone is paired with labels and deadlines, never color alone."
              reference="Task detail"
            />
          </div>
        </section>
      </div>

      <footer className="border-t border-border/70 bg-muted/20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-8 text-xs font-medium text-muted-foreground sm:flex-row md:px-8">
          <p>Show-nin interface standards / Implementation-aligned reference</p>
          <p className="font-mono">DESIGN.md / src/pages/design/index.tsx</p>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function WorkflowPreview() {
  return (
    <Card className="relative gap-0 overflow-hidden rounded-3xl border-border/70 bg-card p-0 shadow-lg">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold">Workflow</Badge>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground">株式会社ネクストウェーブ</p>
            <p className="mt-1 text-base font-bold">業務基幹システム刷新</p>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">提案中</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {workflow.map(({ icon: Icon, label, title, detail }, index) => (
            <div key={label} className="relative rounded-xl border border-border/70 bg-background px-4 py-3.5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">0{index + 1}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{label}</p>
              <p className="mt-1 text-xs font-bold">{title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ListSurfaceDemo({
  view,
  onChange,
}: {
  view: ListPreview;
  onChange: (view: ListPreview) => void;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-md">
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 bg-background px-4 py-5 sm:flex-row sm:items-center md:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Operational list</p>
          <h3 className="mt-1 text-lg font-bold">{view === "projects" ? "案件一覧" : "議事録一覧"}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            {(["projects", "minutes"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  view === item ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                }`}
              >
                {item === "projects" ? "案件" : "議事録"}
              </button>
            ))}
          </div>
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">キーワードで検索</span>
          </div>
          <Button variant="secondary" size="sm"><Filter />絞り込み</Button>
          <Button size="sm"><Plus />追加</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {view === "projects" ? <ProjectTable /> : <MinutesTable />}
      </div>
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-[11px] font-semibold text-muted-foreground md:px-6">
        <span>1 - 3 / 24 件</span>
        <span>Rows navigate; inline controls preserve context</span>
      </div>
    </Card>
  );
}

function ProjectTable() {
  return (
    <div className="min-w-[760px]">
      <div className="grid grid-cols-[1.55fr_1.4fr_0.8fr_0.7fr_0.85fr_0.9fr_0.9fr_36px] gap-4 bg-muted/40 px-6 py-3 text-[11px] font-bold text-muted-foreground">
        {["案件名", "顧客名", "フェーズ", "確度", "金額", "担当者", "次回アクション", ""].map((head) => (
          <span key={head}>{head}</span>
        ))}
      </div>
      {projectRows.map((row, index) => (
        <div key={row.name} className="group grid grid-cols-[1.55fr_1.4fr_0.8fr_0.7fr_0.85fr_0.9fr_0.9fr_36px] items-center gap-4 border-t border-border/60 px-6 py-4 text-xs transition hover:bg-muted/30">
          <div>
            <p className="font-bold group-hover:text-primary">{row.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">案件更新 {index + 1}日前</p>
          </div>
          <span className="font-semibold">{row.customer}</span>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{row.status}</Badge>
          <Badge variant={row.priority === "高" ? "destructive" : "secondary"}>{row.priority}</Badge>
          <span className="font-semibold">{row.amount}</span>
          <span>{row.owner}</span>
          <span className="text-muted-foreground">{row.next}</span>
          <ChevronRight className="h-4 w-4 -translate-x-1 text-primary opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
}

function MinutesTable() {
  return (
    <div className="min-w-[760px]">
      <div className="grid grid-cols-[1.45fr_1.25fr_1.45fr_0.95fr_0.85fr_36px] gap-4 bg-muted/40 px-6 py-3 text-[11px] font-bold text-muted-foreground">
        {["議事録名", "企業名", "案件名", "録音日時", "状態", ""].map((head) => (
          <span key={head}>{head}</span>
        ))}
      </div>
      {minuteRows.map((row) => (
        <div key={row.name} className="group grid grid-cols-[1.45fr_1.25fr_1.45fr_0.95fr_0.85fr_36px] items-center gap-4 border-t border-border/60 px-6 py-4 text-xs transition hover:bg-muted/30">
          <div>
            <p className="font-bold group-hover:text-primary">{row.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">音声から生成</p>
          </div>
          <AssociationCell value={row.customer} linked={row.linked} />
          <AssociationCell value={row.project} linked={row.linked} />
          <span className="text-muted-foreground">{row.date}</span>
          {row.linked ? (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">紐付け済み</Badge>
          ) : (
            <Badge variant="destructive">要紐付け</Badge>
          )}
          <ChevronRight className="h-4 w-4 -translate-x-1 text-primary opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
}

function AssociationCell({ value, linked }: { value: string; linked: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center justify-between gap-2 rounded-lg px-2.5 font-semibold ${
        linked
          ? "bg-secondary/70 text-foreground"
          : "border border-destructive/25 bg-destructive/5 text-destructive"
      }`}
    >
      {value}
      <ChevronDown className="h-3 w-3 opacity-60" />
    </span>
  );
}

function DialogSurfaceDemo() {
  return (
    <Card className="gap-0 rounded-2xl border-border/70 p-0 shadow-md">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Title-first editor</p>
          <p className="mt-1 text-sm font-bold">案件を追加</p>
        </div>
        <Badge variant="secondary">Dialog</Badge>
      </div>
      <div className="p-5">
        <p className="text-2xl font-bold tracking-tight">業務基幹システム刷新</p>
        <p className="mt-1 text-xs text-muted-foreground">案件名を起点に、必要な属性をすばやく設定</p>
        <div className="mt-5 flex flex-wrap gap-2 border-y border-border/60 py-4">
          {dialogPills.map(({ icon: Icon, label, value }) => (
            <span key={label} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 text-[11px] font-semibold text-primary">
              <Icon className="h-3.5 w-3.5" />
              {label}
              <strong>{value}</strong>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </span>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold">
              <FolderKanban className="h-3.5 w-3.5 text-primary" /> 基本情報
            </p>
            <InputPreview label="案件金額 (円)" value="15,000,000" />
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold">
              <Calendar className="h-3.5 w-3.5 text-primary" /> アクション・日程
            </p>
            <InputPreview label="次回アクション日" value="2026/06/03" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button size="sm" variant="secondary">キャンセル</Button>
          <Button size="sm">案件を追加</Button>
        </div>
      </div>
    </Card>
  );
}

function InputPreview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold text-muted-foreground">{label}</p>
      <div className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold">{value}</div>
    </div>
  );
}

function DetailSurfaceDemo({
  overdue,
  profileOpen,
  onToggleOverdue,
  onToggleProfile,
}: {
  overdue: boolean;
  profileOpen: boolean;
  onToggleOverdue: () => void;
  onToggleProfile: () => void;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-md">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Contextual detail</p>
          <p className="mt-1 text-sm font-bold">顧客 / タスク詳細</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleProfile} aria-label="企業概要パネルを切り替え">
          {profileOpen ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </div>
      <div className="flex min-h-[423px] bg-muted/10">
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">タスク詳細</p>
              <p className="text-sm font-bold">セキュリティ規約の締結</p>
            </div>
            <button type="button" onClick={onToggleOverdue}>
              <Badge variant={overdue ? "destructive" : "outline"}>
                {overdue ? "期限超過" : "実行中"}
              </Badge>
            </button>
          </div>
          <div className={`rounded-xl border p-4 ${overdue ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Calendar className={`h-3.5 w-3.5 ${overdue ? "text-destructive" : "text-primary"}`} />
                期限
              </span>
              <span className={overdue ? "font-bold text-destructive" : "text-muted-foreground"}>
                2026/05/30 {overdue ? "（期限超過）" : "（残り3日）"}
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>進捗</span>
              <span>{overdue ? "40%" : "70%"}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${overdue ? "w-2/5 bg-destructive" : "w-[70%] bg-primary"}`} />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <DetailItem icon={Building2} label="顧客" value="ネクストウェーブ" />
              <DetailItem icon={User} label="担当者" value="山田 智" />
            </div>
          </div>
        </div>
        {profileOpen ? (
          <aside className="hidden w-44 shrink-0 border-l border-border/60 bg-card p-3 sm:block">
            <div className="mb-4 flex items-center gap-1.5 text-[11px] font-bold">
              <Building2 className="h-3.5 w-3.5 text-primary" />企業概要
            </div>
            <DetailLabel label="業種" value="情報通信業" />
            <DetailLabel label="担当窓口" value="DX 推進室" />
            <DetailLabel label="契約状況" value="提案中" />
            <div className="mt-3 rounded-lg bg-primary/5 p-2 text-[10px] font-semibold text-primary">
              関連案件 3件
            </div>
          </aside>
        ) : (
          <aside className="hidden w-12 shrink-0 flex-col items-center border-l border-border/60 bg-card py-3 sm:flex">
            <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
            <span className="mt-8 text-[10px] font-bold tracking-wider text-muted-foreground [writing-mode:vertical-rl]">企業概要</span>
          </aside>
        )}
      </div>
    </Card>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-2.5">
      <p className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </p>
      <p className="mt-1 truncate text-[11px] font-bold">{value}</p>
    </div>
  );
}

function DetailLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2.5 rounded-lg border border-border/60 bg-background p-2">
      <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-[11px] font-bold">{value}</p>
    </div>
  );
}

function PatternCard({
  icon: Icon,
  title,
  text,
  reference,
}: {
  icon: typeof Search;
  title: string;
  text: string;
  reference: string;
}) {
  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <h3 className="mt-2 text-sm font-bold">{title}</h3>
      <p className="text-xs font-medium leading-6 text-muted-foreground">{text}</p>
      <p className="mt-auto flex items-center gap-1.5 border-t border-border/60 pt-3 text-[10px] font-bold uppercase tracking-wider text-primary">
        <CircleCheck className="h-3 w-3" />
        {reference}
      </p>
    </Card>
  );
}
