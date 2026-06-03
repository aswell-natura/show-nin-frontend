import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

interface FilterPillProps {
  label: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
  onClear?: () => void;
}

export function FilterPill({
  label,
  active,
  children,
  className,
  onClear,
}: FilterPillProps) {
  return (
    <div
      className={cn(
        "relative inline-flex min-h-9 w-full items-center gap-2 rounded-full border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors sm:w-auto",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border hover:border-primary/35 hover:bg-muted/60",
        onClear && "pr-9",
        className,
      )}
    >
      <span className="shrink-0 font-bold">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "h-3.5 w-px shrink-0",
          active ? "bg-primary/30" : "bg-border",
        )}
      />
      <div className="min-w-0 flex-1 sm:flex-none">{children}</div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${label}をクリア`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export const filterComboboxClassName =
  "h-9 w-full min-w-0 rounded-full border border-border bg-background px-3 text-xs font-medium shadow-sm hover:bg-muted/60 sm:w-auto sm:min-w-[132px] data-[state=open]:border-primary";

export const activeFilterComboboxClassName =
  "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15";

export const filterRangeInputClassName =
  "h-7 w-full min-w-0 bg-transparent p-0 text-center text-xs font-semibold text-foreground outline-none [appearance:textfield] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 sm:w-16 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const filterPriceInputClassName =
  "h-7 w-full min-w-0 bg-transparent p-0 text-right text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 sm:w-24";

export const filterDateButtonClassName =
  "h-7 border-none bg-transparent px-0 text-center text-xs font-semibold shadow-none hover:border-none hover:bg-transparent focus:ring-0";

export function FilterRangeSeparator() {
  return (
    <span className="shrink-0 px-0.5 text-xs font-bold text-muted-foreground/70">
      〜
    </span>
  );
}

export function formatPriceInputValue(value: string) {
  const numericValue = value.replace(/[^\d]/g, "");
  if (!numericValue) return "";
  return Number(numericValue).toLocaleString("ja-JP");
}

export function parsePriceInputValue(value: string) {
  return value.replace(/[^\d]/g, "");
}
