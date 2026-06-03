import { Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const packetPlans = [
  { points: "500", price: "¥500" },
  { points: "1,000", price: "¥900", discount: "10%お得" },
  { points: "3,000", price: "¥2,500", discount: "17%お得" },
  { points: "5,000", price: "¥4,000", discount: "20%お得" },
  { points: "10,000", price: "¥7,500", discount: "25%お得" },
];

export default function AiPacketsPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-5xl space-y-8">
            <section className="rounded-lg border border-border bg-card p-8 shadow-sm">
              <div className="mb-7 flex items-center gap-4">
                <Package className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  現在の残高
                </h2>
              </div>

              <div className="rounded-lg bg-primary/10 px-6 py-5">
                <span className="text-5xl font-bold tracking-wider text-primary">
                  978.16
                </span>
                <span className="ml-3 text-2xl font-bold text-primary">P</span>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-8 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">
                パケットを購入
              </h2>

              <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {packetPlans.map((plan) => (
                  <button
                    key={plan.points}
                    type="button"
                    className="min-h-36 rounded-lg border border-border bg-background px-6 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <p className="text-4xl font-bold text-foreground">
                      {plan.points}
                      <span className="ml-3 text-xl">P</span>
                    </p>
                    <p className="mt-3 text-2xl text-muted-foreground">
                      {plan.price}
                    </p>
                    {plan.discount && (
                      <p className="mt-2 text-base text-emerald-600">
                        {plan.discount}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
