import { CreditCard } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

export default function PaymentCardPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <section className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <CreditCard className="h-7 w-7 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                お支払い方法
              </h2>
            </div>

            <div className="flex flex-col gap-5 rounded-lg border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  Visa
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-medium text-foreground">
                    •••• •••• •••• 4242
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    有効期限：12/2026
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                有効
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              className="mt-8 h-16 w-full text-lg font-bold"
            >
              カード情報を更新する
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              カード情報はStripeにより安全に管理されています
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
