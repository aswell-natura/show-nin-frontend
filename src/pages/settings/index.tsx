import {
  Bot,
  CalendarDays,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const settingCards = [
  {
    title: "AIアシスタント設定",
    description: "AI応答や補助機能の利用方針を管理します。",
    icon: Bot,
  },
  {
    title: "ドキュメントテンプレート設定",
    description: "契約書や見積書などの雛形を管理します。",
    icon: FileText,
  },
  {
    title: "チェックテンプレート設定",
    description: "確認項目やチェックリストの雛形を管理します。",
    icon: FileText,
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

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            基本設定
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            利用環境や機能表示を管理します。
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {settingCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h2 className="mt-4 text-sm font-bold text-foreground">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
