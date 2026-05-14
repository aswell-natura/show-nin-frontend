import { Button } from "@/components/ui/button"
import { WidgetCard } from "@/components/dashboard/shared/WidgetCard"
import { StatCard } from "@/components/dashboard/shared/StatCard"
import { StatusBadge, RankBadge } from "@/components/dashboard/shared/StatusBadge"

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
      </div>
    </main>
  )
}
