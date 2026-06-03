import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WidgetCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: WidgetCardProps) {
  return (
    <Card
      className={cn(
        "md:h-[480px] h-auto flex flex-col rounded-xl border border-border/50 shadow-none bg-card hover:shadow-md transition-shadow duration-200 md:overflow-hidden overflow-visible py-0",
        className,
      )}
    >
      <CardHeader className="px-4 py-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0 shrink-0 bg-muted/5">
        <div className="min-w-0">
          <CardTitle className="text-sm font-bold text-foreground truncate tracking-tight">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-[11px] text-muted-foreground mt-0.5 truncate leading-none">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div className="shrink-0 ml-2">{action}</div>}
      </CardHeader>
      <CardContent
        className={cn(
          "md:flex-1 p-0 md:overflow-y-auto overflow-visible flex flex-col md:min-h-0 min-h-fit scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
