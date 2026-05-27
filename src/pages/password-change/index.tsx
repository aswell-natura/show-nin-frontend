import { Eye, KeyRound } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

function PasswordInput() {
  return (
    <div className="relative">
      <input
        type="password"
        className="h-16 w-full rounded-xl border border-border bg-background px-4 pr-14 text-lg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
      <Eye className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export default function PasswordChangePage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto px-4 py-9 md:px-8">
          <section className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 shadow-sm md:p-9">
            <div className="mb-9 flex items-center gap-4">
              <span className="flex h-15 w-15 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <KeyRound className="h-8 w-8" />
              </span>
              <h2 className="text-3xl font-bold text-foreground">
                パスワード変更
              </h2>
            </div>

            <form className="space-y-6">
              <label className="block">
                <span className="mb-3 block text-lg font-medium text-foreground">
                  現在のパスワード
                </span>
                <PasswordInput />
              </label>

              <label className="block">
                <span className="mb-3 block text-lg font-medium text-foreground">
                  新しいパスワード
                </span>
                <PasswordInput />
                <span className="mt-1 block text-base text-muted-foreground">
                  8文字以上
                </span>
              </label>

              <label className="block">
                <span className="mb-3 block text-lg font-medium text-foreground">
                  新しいパスワード（確認）
                </span>
                <PasswordInput />
              </label>

              <Button
                type="submit"
                variant="primary"
                className="h-16 w-full text-xl font-bold"
              >
                パスワードを変更
              </Button>
            </form>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
