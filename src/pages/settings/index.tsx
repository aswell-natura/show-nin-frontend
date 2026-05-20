import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bot,
  CalendarDays,
  ChevronRight,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import {
  loadFeatureFlags,
  optionalFeatures,
  saveFeatureFlags,
  type OptionalFeatureId,
} from "@/lib/feature-menu";
import { cn } from "@/lib/utils";

const settingCards = [
  {
    title: "AIアシスタント設定",
    description: "AI応答や補助機能の利用方針を管理します。",
    href: "/settings/ai-assistant",
    icon: Bot,
  },
  {
    title: "ドキュメントテンプレート設定",
    description: "契約書や見積書などの雛形を管理します。",
    href: "/settings/document-templates",
    icon: FileText,
  },
  {
    title: "チェックテンプレート設定",
    description: "確認項目やチェックリストの雛形を管理します。",
    href: "/settings/check-templates",
    icon: FileText,
  },
  {
    title: "カレンダー連携",
    description: "外部カレンダーとの連携状態を管理します。",
    href: "/settings/calendar",
    icon: CalendarDays,
  },
  {
    title: "機能選択",
    description: "サイドメニューに表示する追加機能を選択します。",
    href: "/settings/features",
    icon: SlidersHorizontal,
  },
];

function sectionTitle(pathname: string) {
  const found = settingCards.find((card) => card.href === pathname);
  return found?.title ?? "基本設定";
}

export default function SettingsPage() {
  const location = useLocation();
  const [featureFlags, setFeatureFlags] = useState(() => loadFeatureFlags());
  const isFeaturePage = location.pathname === "/settings/features";

  const title = useMemo(() => sectionTitle(location.pathname), [location.pathname]);

  const handleToggle = (id: OptionalFeatureId) => {
    setFeatureFlags((current) => {
      const next = { ...current, [id]: !current[id] };
      saveFeatureFlags(next);
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {title}
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
                <Link
                  key={card.href}
                  to={card.href}
                  className={cn(
                    "group rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md",
                    location.pathname === card.href && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <h2 className="mt-4 text-sm font-bold text-foreground">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
            {isFeaturePage ? (
              <>
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-foreground">機能選択</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    オンにした機能だけ左のサイドメニューへ表示されます。
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {optionalFeatures.map((feature) => {
                    const enabled = featureFlags[feature.id];
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {feature.label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            サイドメニュー表示: {enabled ? "オン" : "オフ"}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => handleToggle(feature.id)}
                          className={cn(
                            "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
                            enabled
                              ? "border-primary bg-primary"
                              : "border-border bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                              enabled ? "translate-x-5" : "translate-x-1",
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-sm font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  この設定項目の詳細画面です。設定内容は今後ここに追加されます。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
