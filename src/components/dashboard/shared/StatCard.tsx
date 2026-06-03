import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  labelClassName?: string;
  valueClassName?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      label,
      value,
      unit,
      icon,
      labelClassName,
      valueClassName,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "rounded-lg p-3.5 flex flex-col justify-center transition-all duration-150 relative border-[0.5] shadow-none hover:shadow-md hover:bg-accent/50",
          className,
        )}
        {...props}
      >
        {icon && (
          <div className="absolute top-2 right-2 text-muted-foreground/30 pointer-events-none">
            {icon}
          </div>
        )}
        <div className="min-w-0 w-full text-left">
          <p
            className={cn(
              "text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate mb-1.5",
              labelClassName,
            )}
          >
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-xl font-bold text-foreground",
                valueClassName,
              )}
            >
              {value}
            </span>
            {unit && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {unit}
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  },
);

StatCard.displayName = "StatCard";
