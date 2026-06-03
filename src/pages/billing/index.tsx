import { ArrowRight, Check, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "フリー",
    price: "¥0",
    features: ["ユーザー1名", "AIバケット100P/月", "基本機能"],
  },
  {
    name: "スターター",
    price: "¥2,980",
    features: ["ユーザー5名", "AIバケット500P/月", "全機能利用可", "メールサポート"],
  },
  {
    name: "ビジネス",
    price: "¥9,800",
    features: ["ユーザー20名", "AIバケット2000P/月", "全機能利用可", "優先サポート", "API連携"],
    current: true,
    popular: true,
  },
  {
    name: "エンタープライズ",
    price: "¥29,800",
    features: ["ユーザー無制限", "AIバケット10000P/月", "全機能利用可", "専任サポート", "API連携", "カスタマイズ"],
  },
];

export default function BillingPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-7 flex items-center gap-3">
                <Package className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  現在のプラン
                </h2>
              </div>

              <div className="flex flex-col gap-5 rounded-lg bg-primary/10 px-6 py-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    ビジネスプラン
                  </p>
                  <p className="mt-2 text-xl text-muted-foreground">
                    次回請求日：2025年1月18日
                  </p>
                </div>
                <p className="text-4xl font-bold text-foreground md:text-5xl">
                  ¥9,800
                  <span className="ml-1 text-base font-medium text-muted-foreground">
                    /月
                  </span>
                </p>
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className="relative flex min-h-[486px] flex-col rounded-lg border border-border bg-card p-8 shadow-sm"
                >
                  {plan.popular && (
                    <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full text-xs font-bold text-white">
                      <span className="bg-primary px-4 py-1">人気</span>
                      <span className="bg-emerald-600 px-4 py-1">
                        現在のプラン
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-4 text-4xl font-bold text-foreground">
                    {plan.price}
                    <span className="ml-1 text-base font-medium text-muted-foreground">
                      /月
                    </span>
                  </p>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-base">
                        <Check className="h-5 w-5 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    variant={plan.current ? "secondary" : "primary"}
                    disabled={plan.current}
                    className={cn(
                      "mt-auto h-14 w-full gap-3 text-lg font-bold",
                      plan.current && "bg-muted text-muted-foreground",
                    )}
                  >
                    {plan.current ? "現在のプラン" : "変更する"}
                    {!plan.current && <ArrowRight className="h-5 w-5" />}
                  </Button>
                </article>
              ))}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
