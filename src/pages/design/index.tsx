import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WidgetCard } from "@/components/dashboard/shared/WidgetCard"
import { StatCard } from "@/components/dashboard/shared/StatCard"
import { StatusBadge, RankBadge } from "@/components/dashboard/shared/StatusBadge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  CheckSquare,
  Calendar,
  Mic,
  Pin,
} from "lucide-react"

const palette = [
  { name: "Background", variable: "--background", light: "#ffffff", dark: "#0f172a" },
  { name: "Foreground", variable: "--foreground", light: "#111827", dark: "#e5e7eb" },
  { name: "Primary", variable: "--primary", light: "#2563eb", dark: "#60a5fa" },
  { name: "Secondary", variable: "--secondary", light: "#f3f4f6", dark: "#1f2937" },
  { name: "Muted", variable: "--muted", light: "#f9fafb", dark: "#1f2937" },
  { name: "Destructive", variable: "--destructive", light: "#dc2626", dark: "#f87171" },
  { name: "Border", variable: "--border", light: "#e5e7eb", dark: "#334155" },
]

const typography = [
  { name: "H1", variable: "--font-size-h1", sample: "Project command center" },
  { name: "H2", variable: "--font-size-h2", sample: "Pipeline and delivery health" },
  { name: "H3", variable: "--font-size-h3", sample: "Member workload summary" },
  { name: "H4", variable: "--font-size-h4", sample: "Upcoming review actions" },
  { name: "Body", variable: "--font-size-body", sample: "Readable product copy for tables, forms, dashboards, and operational notes." },
  { name: "Caption", variable: "--font-size-caption", sample: "Updated 5 minutes ago" },
  { name: "Code", variable: "--font-size-code", sample: "variant=\"primary\" size=\"md\"" },
]

const spaces = [
  { name: "1", variable: "--space-1", value: "0.25rem" },
  { name: "2", variable: "--space-2", value: "0.5rem" },
  { name: "3", variable: "--space-3", value: "0.75rem" },
  { name: "4", variable: "--space-4", value: "1rem" },
  { name: "6", variable: "--space-6", value: "1.5rem" },
  { name: "8", variable: "--space-8", value: "2rem" },
  { name: "12", variable: "--space-12", value: "3rem" },
]

const variants = ["primary", "secondary", "ghost"] as const
const sizes = ["sm", "md", "lg"] as const

export default function DesignShowcase() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10">
          <p className="text-sm font-medium text-primary">Design System</p>
          <div className="flex flex-col gap-3 md:max-w-3xl">
            <h1
              className="font-semibold"
              style={{ fontSize: "var(--font-size-h1)", lineHeight: "var(--line-height-heading)" }}
            >
              Show-nin interface standards
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)" }}>
              A living reference for semantic tokens, button behavior, type, and spacing.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8">
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold">Color Palette</h2>
            <p className="text-sm text-muted-foreground">Semantic CSS variables used by components and Tailwind utilities.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {palette.map((color) => (
              <article key={color.variable} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="grid grid-cols-2 border-b border-border">
                  <div>
                    <div className="h-20" style={{ backgroundColor: color.light }} />
                    <div className="border-t border-border px-3 py-2 text-xs font-medium">Light</div>
                  </div>
                  <div className="theme-dark">
                    <div className="h-20" style={{ backgroundColor: `var(${color.variable})` }} />
                    <div className="border-t border-border bg-background px-3 py-2 text-xs font-medium text-foreground">Dark</div>
                  </div>
                </div>
                <div className="grid gap-1 p-4">
                  <h3 className="text-sm font-semibold">{color.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{color.variable}</p>
                  <p className="font-mono text-xs text-muted-foreground">Light {color.light}</p>
                  <p className="font-mono text-xs text-muted-foreground">Dark {color.dark}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Buttons</h2>
            <p className="text-sm text-muted-foreground">Variants and sizes from `components/ui/button.tsx`.</p>
          </div>
          <div className="grid gap-5">
            {variants.map((variant) => (
              <div key={variant} className="grid gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <h3 className="text-sm font-semibold capitalize">{variant}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {sizes.map((size) => (
                    <Button key={`${variant}-${size}`} variant={variant} size={size}>
                      {variant} {size}
                    </Button>
                  ))}
                  <Button variant={variant} size="md" disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Typography</h2>
            <p className="text-sm text-muted-foreground">Scale tokens for dashboard and workflow screens.</p>
          </div>
          <div className="grid gap-4">
            {typography.map((item) => (
              <div key={item.name} className="grid gap-1 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{item.variable}</span>
                </div>
                {item.name === "Code" ? (
                  <code className="rounded-md bg-muted px-2 py-1 font-mono" style={{ fontSize: `var(${item.variable})` }}>
                    {item.sample}
                  </code>
                ) : (
                  <p
                    className={item.name === "Caption" ? "text-muted-foreground" : "font-semibold"}
                    style={{
                      fontSize: `var(${item.variable})`,
                      lineHeight: item.name.startsWith("H") ? "var(--line-height-heading)" : "var(--line-height-body)",
                    }}
                  >
                    {item.sample}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Spacing</h2>
            <p className="text-sm text-muted-foreground">Layout rhythm tokens shown as proportional blocks.</p>
          </div>
          <div className="grid gap-3">
            {spaces.map((space) => (
              <div key={space.variable} className="grid grid-cols-[5rem_1fr_6rem] items-center gap-4">
                <span className="font-mono text-xs text-muted-foreground">{space.variable}</span>
                <div className="h-8 rounded-md bg-muted">
                  <div className="h-8 rounded-md bg-primary" style={{ width: `var(${space.variable})` }} />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{space.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Dashboard Shared Components</h2>
            <p className="text-sm text-muted-foreground">High-level components composed from Shadcn primitives for specific dashboard use cases.</p>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">WidgetCard</h3>
              <div className="h-48 rounded-md p-2 bg-muted/30">
                <WidgetCard 
                  title="Task Overview" 
                  description="Recent pending tasks" 
                  action={<Button variant="secondary" size="sm">View All</Button>}
                >
                  <div className="p-4 flex items-center justify-center text-sm text-muted-foreground h-full border border-dashed border-border rounded-md m-2">
                    Widget Content Area (Scrollable)
                  </div>
                </WidgetCard>
              </div>
            </div>
            
            <div className="grid gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">StatCard</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value="¥1,250,000" />
                <StatCard label="Active Projects" value={12} labelClassName="text-blue-600" valueClassName="text-blue-700" />
                <StatCard label="Conversion Rate" value="18.5%" labelClassName="text-green-600" valueClassName="text-green-700" />
              </div>
            </div>

            <div className="grid gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">StatusBadge & RankBadge</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <StatusBadge status="lead" />
                  <StatusBadge status="proposing" />
                  <StatusBadge status="negotiating" />
                  <StatusBadge status="closed" />
                </div>
                <div className="flex gap-2">
                  <RankBadge rank="A" />
                  <RankBadge rank="B" />
                  <RankBadge rank="C" />
                  <RankBadge rank="D" />
                </div>
                <div className="flex gap-2">
                  <RankBadge rank="A" size="lg" />
                  <RankBadge rank="B" size="lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Interactive UX & Dashboard Component Standards</h2>
            <p className="text-sm text-muted-foreground">Premium, high-density elements designed for data persistence, hover responsiveness, and dynamic layouts.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 border-t border-border pt-4">
            
            {/* 1. Collapsible Context Panel Widget */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Collapsible Right Panel Drawer</h3>
                <span className="text-[11px] font-mono text-muted-foreground">w-13 (collapsed) / w-60 (expanded)</span>
              </div>
              <p className="text-xs text-muted-foreground">Right-side metadata panel that collapses to save screen space while keeping data accessible.</p>
              
              <div className="border border-border/80 rounded-xl bg-muted/20 p-4 h-64 flex justify-end relative overflow-hidden">
                <div className="absolute inset-y-0 left-4 right-20 flex flex-col justify-center text-xs text-muted-foreground select-none">
                  <p className="font-semibold text-foreground/80 mb-1">Desktop Grid Layout Area</p>
                  <p>The main task board or feed occupies the left & center, while the right drawer slides out on demand.</p>
                </div>

                <CollapsiblePanelDemo />
              </div>
            </div>

            {/* 2. Hover Metrics Popover */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Hover Metrics Popover Trigger</h3>
                <span className="text-[11px] font-mono text-muted-foreground">onMouseEnter / onMouseLeave State</span>
              </div>
              <p className="text-xs text-muted-foreground">Interactive list badges that expand to show complete sub-resource listings on cursor hover.</p>
              
              <div className="border border-border/80 rounded-xl bg-muted/20 p-4 h-64 flex flex-col items-center justify-center gap-4">
                <p className="text-xs text-muted-foreground">Hover cursor over the metric count below:</p>
                <HoverPopoverDemo />
              </div>
            </div>

            {/* 3. High-Density checklist & Task Cards */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Task Card State Variants</h3>
                <span className="text-[11px] font-mono text-muted-foreground">Checklists / Overdue Alerts</span>
              </div>
              <p className="text-xs text-muted-foreground">Feed cards displaying checklist completions, progress bars, relative updates, and custom alert modes.</p>
              
              <div className="border border-border/80 rounded-xl bg-muted/20 p-4 min-h-[16rem] flex flex-col justify-center gap-3">
                <TaskCardDemo />
              </div>
            </div>

            {/* 4. Table Row Hover Navigate Simulation */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Hover-Triggered Navigable Row</h3>
                <span className="text-[11px] font-mono text-muted-foreground">StopPropagation / Group Hover Chevron</span>
              </div>
              <p className="text-xs text-muted-foreground">Standardized row interactions: triggers parent navigation on click, handles independent actions, and shows a smooth right-pointing indicator on hover.</p>
              
              <div className="border border-border/80 rounded-xl bg-muted/20 p-4 min-h-[16rem] flex flex-col justify-center gap-3">
                <HoverRowDemo />
              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  )
}

// ─── Interactive Showcase Sub-components ────────────────────────────────────────

function CollapsiblePanelDemo() {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <div
      className={`shrink-0 bg-card border-l border-border h-full overflow-hidden shadow-md flex flex-col transition-[width] duration-300 ${
        isOpen ? "w-60" : "w-12"
      }`}
    >
      {isOpen ? (
        <div className="h-full flex flex-col p-3 text-xs gap-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-bold text-foreground flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-primary" /> 企業概要
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 rounded-full hover:bg-muted"
            >
              <PanelRightClose className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="p-2 rounded bg-muted/50 font-medium">
              <p className="text-[10px] text-muted-foreground">担当者</p>
              <p className="font-semibold text-foreground">山田 智</p>
            </div>
            <div className="p-2 rounded bg-muted/50 font-medium">
              <p className="text-[10px] text-muted-foreground">所在地</p>
              <p className="text-foreground">東京都港区芝公園</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center py-3 justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="h-6 w-6 p-0 rounded-full hover:bg-muted border border-border"
          >
            <PanelRightOpen className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <span className="[writing-mode:vertical-rl] text-[10px] font-bold tracking-widest text-muted-foreground uppercase my-auto">
            企業概要
          </span>
        </div>
      )}
    </div>
  )
}

function HoverPopoverDemo() {
  const [open, setOpen] = useState(false)
  
  const mockSubitems: { id: string; name: string; status: "proposing" | "negotiating" | "closed" | "lead" | "active" | "dormant"; date: string }[] = [
    { id: "1", name: "コーポレートサイト改修", status: "proposing", date: "今日" },
    { id: "2", name: "新卒採用LP制作", status: "negotiating", date: "昨日" },
    { id: "3", name: "オウンドメディア開発", status: "closed", date: "3日前" },
  ]

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>
        <div
          className="inline-flex cursor-help items-center gap-1 rounded-md px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-sm select-none"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <span>3</span>
          <span className="text-xs font-semibold text-muted-foreground/80">件の進行中案件</span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 overflow-hidden backdrop-blur-xl bg-background/90 border-border/60 shadow-xl"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="bg-primary/5 px-3 py-2 border-b border-border/40 flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-primary tracking-widest uppercase">進行中案件リスト</h4>
          <Badge className="text-[9px] px-1 bg-primary/15 text-primary border-0">3件</Badge>
        </div>
        <div className="p-1 max-h-48 overflow-y-auto bg-background/50 flex flex-col gap-0.5">
          {mockSubitems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-primary/5 transition-colors cursor-pointer group/subitem">
              <StatusBadge status={item.status} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-bold text-foreground truncate group-hover/subitem:text-primary transition-colors">
                  {item.name}
                </span>
                <span className="text-[9px] text-muted-foreground">最終更新: {item.date}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TaskCardDemo() {
  const [isOverdue, setIsOverdue] = useState(false)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Card State View</span>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsOverdue(!isOverdue)} 
          className="h-7 text-[10px] font-bold py-0"
        >
          {isOverdue ? "通常表示に切り替え" : "期限切れ表示に切り替え"}
        </Button>
      </div>

      <Card
        className={`p-4 rounded-xl border shadow-xs flex flex-col gap-2.5 transition-all duration-300 ${
          isOverdue
            ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
            : "border-border bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">
              顧客情報セキュリティ規約の締結
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-medium flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Calendar className="w-3 h-3" /> 期限: 2026-05-15
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[9px] font-medium px-2 py-0.5 bg-muted text-muted-foreground border-0">
            案件: セキュリティ監査
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-[9px] font-bold px-1.5 py-0.2 rounded border-0 leading-none">
              期限切れ
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 text-[9px] font-medium border-border px-1.5 py-0.2">
            <CheckSquare className="w-2.5 h-2.5 text-primary" /> チェックリスト 3/4 完了
          </Badge>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-[9px] font-bold text-muted-foreground w-12 shrink-0">
            進捗 75%
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverdue ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: "75%" }}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

function HoverRowDemo() {
  const [pinned, setPinned] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-muted-foreground text-center"> Hover the row to see standard visual chevrons and interactive stops </p>
      
      <div
        onClick={() => alert("Row Navigation Triggered!")}
        className={`group cursor-pointer border border-border/80 p-3.5 rounded-xl flex items-center justify-between gap-4 transition-all duration-300 hover:bg-muted/40 select-none ${
          pinned ? "bg-primary/[0.035] hover:bg-primary/[0.07]" : "bg-card"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation() // Stop triggering row navigate
              setPinned(!pinned)
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-all shrink-0 border ${
              pinned
                ? "text-primary bg-primary/10 border-primary/20"
                : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted border-transparent"
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? "fill-current" : ""}`} />
          </button>
          
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              株式会社ネクストウェーブ
            </span>
            <span className="text-[10px] text-muted-foreground">情報通信業</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-1">
          <Badge className="text-[10px] font-bold px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            既存顧客
          </Badge>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
        </div>
      </div>
    </div>
  )
}
