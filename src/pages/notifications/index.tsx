import { useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarClock, FileText } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDataStore } from "@/context/DataStoreContext";
import { cn } from "@/lib/utils";

type NotificationFilter = "all" | "alert" | "schedule" | "minutes";

const filterOptions: {
  id: NotificationFilter;
  label: string;
  icon: typeof Bell;
}[] = [
  { id: "all", label: "すべて", icon: Bell },
  { id: "alert", label: "アラート", icon: AlertTriangle },
  { id: "schedule", label: "スケジュール", icon: CalendarClock },
  { id: "minutes", label: "議事録", icon: FileText },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getNotificationType(title: string, body: string): Exclude<NotificationFilter, "all"> {
  const text = normalize(`${title} ${body}`);

  if (
    text.includes("議事録") ||
    text.includes("録音") ||
    text.includes("活動報告") ||
    text.includes("minutes")
  ) {
    return "minutes";
  }

  if (
    text.includes("会議") ||
    text.includes("予定") ||
    text.includes("スケジュール") ||
    text.includes("日程") ||
    text.includes("schedule")
  ) {
    return "schedule";
  }

  return "alert";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function typeLabel(type: Exclude<NotificationFilter, "all">) {
  return {
    alert: "アラート",
    schedule: "スケジュール",
    minutes: "議事録",
  }[type];
}

function typeTone(type: Exclude<NotificationFilter, "all">) {
  return {
    alert: "border-destructive/20 bg-destructive/10 text-destructive",
    schedule: "border-blue-500/20 bg-blue-500/10 text-blue-600",
    minutes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  }[type];
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const { notifications } = useDataStore();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");

  const notificationViews = useMemo(
    () =>
      notifications
        .filter((notification) => notification.user_id === currentUser?.id)
        .map((notification) => ({
          ...notification,
          type: getNotificationType(notification.title, notification.body),
        }))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [currentUser?.id, notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      activeFilter === "all"
        ? notificationViews
        : notificationViews.filter((notification) => notification.type === activeFilter),
    [activeFilter, notificationViews],
  );

  const counts = useMemo(
    () =>
      filterOptions.reduce<Record<NotificationFilter, number>>(
        (acc, option) => {
          acc[option.id] =
            option.id === "all"
              ? notificationViews.length
              : notificationViews.filter((notification) => notification.type === option.id).length;
          return acc;
        },
        { all: 0, alert: 0, schedule: 0, minutes: 0 },
      ),
    [notificationViews],
  );

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                通知
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                通知の種類ごとに確認できます
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeFilter === option.id;
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={isActive ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setActiveFilter(option.id)}
                    className={cn(
                      "shrink-0 gap-1.5 rounded-full px-3 font-bold",
                      !isActive && "bg-background",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                    <span
                      className={cn(
                        "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {counts[option.id]}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {filteredNotifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-bold text-foreground">
                  通知はありません
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  条件に一致する通知はありません。
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={cn(
                      "px-4 py-4 transition-colors hover:bg-muted/40 md:px-5",
                      !notification.is_read && "bg-primary/5",
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold text-foreground">
                            {notification.title}
                          </h2>
                          <Badge
                            variant="outline"
                            className={cn("px-2 py-0.5 text-[10px] font-bold", typeTone(notification.type))}
                          >
                            {typeLabel(notification.type)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {formatDateTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {notification.body}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
