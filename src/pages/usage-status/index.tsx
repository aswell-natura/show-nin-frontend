import { Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const usageCards = [
  {
    label: "AIパケット残高",
    value: "808.52 P",
    progress: 16,
    color: "bg-primary",
  },
  {
    label: "ユーザー数",
    value: "5 / 20",
    progress: 25,
    color: "bg-emerald-600",
  },
  {
    label: "ストレージ使用量",
    value: "2.3 GB / 10 GB",
    progress: 23,
    color: "bg-primary",
  },
  {
    label: "今月のAPI呼び出し",
    value: "1,234 回",
  },
];

export default function UsageStatusPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="shrink-0 border-b border-border bg-background px-4 py-4 md:px-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            利用状況
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-9 md:px-8">
          <section className="mx-auto max-w-6xl rounded-lg border border-border bg-card p-8 shadow-sm md:p-9">
            <div className="mb-10 flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                利用状況
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {usageCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-lg border border-border bg-background p-6"
                >
                  <p className="text-xl text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-4xl font-bold tracking-wide text-foreground">
                    {card.value}
                  </p>
                  {typeof card.progress === "number" && (
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${card.color}`}
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
