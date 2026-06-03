import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

/* ─── Header ─────────────────────────────────────────────────────────────── */

export interface LinearDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  titlePlaceholder?: string;
  titleValue: string;
  onTitleChange: (value: string) => void;
  summaryPlaceholder?: string;
  summaryValue?: string;
  onSummaryChange?: (value: string) => void;
  titleRequired?: boolean;
  summarySuggestions?: string[];
  onSelectSummarySuggestion?: (value: string) => void;
}

export function LinearDialogHeader({
  icon,
  titlePlaceholder = "Project name",
  titleValue,
  onTitleChange,
  summaryPlaceholder = "Add a short summary...",
  summaryValue,
  onSummaryChange,
  titleRequired = false,
  summarySuggestions,
  onSelectSummarySuggestion,
  className,
  ...props
}: LinearDialogHeaderProps) {
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = React.useState(false);

  // summaryValue に応じて候補をフィルタリング
  const filteredSummarySuggestions = React.useMemo(() => {
    if (!summarySuggestions) return [];
    if (!summaryValue) return summarySuggestions;
    return summarySuggestions.filter((s) =>
      s.toLowerCase().includes(summaryValue.toLowerCase())
    );
  }, [summarySuggestions, summaryValue]);

  return (
    <div className={cn("flex flex-col gap-3 pt-2 pb-4", className)} {...props}>
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground shadow-2xs mb-1">
          {icon}
        </div>
      )}
      <div className="relative flex items-center">
        <input
          autoFocus
          required={titleRequired}
          type="text"
          value={titleValue}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full border-none bg-transparent px-0 py-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:ring-0 focus:outline-none truncate"
        />
        {titleRequired && !titleValue.trim() && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded shadow-2xs">
            必須
          </span>
        )}
      </div>

      {/* 業種・サマリー入力エリア (洗練されたコンボボックスUX) */}
      {summaryValue !== undefined && onSummaryChange && (
        <div className="relative flex items-center w-full max-w-lg pt-0.5">
          <div className="flex items-center w-full bg-muted/30 hover:bg-muted/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring rounded-xl px-3 py-1.5 border border-border/60 transition-all shadow-2xs group">
            <input
              type="text"
              value={summaryValue}
              onChange={(e) => {
                onSummaryChange(e.target.value);
                setIsSuggestionsExpanded(true);
              }}
              onFocus={() => setIsSuggestionsExpanded(true)}
              onBlur={() => {
                setTimeout(() => setIsSuggestionsExpanded(false), 200);
              }}
              placeholder={summaryPlaceholder}
              className="w-full border-none bg-transparent px-1 py-0.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none truncate"
            />
            {summarySuggestions && summarySuggestions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSuggestionsExpanded((v) => !v)}
                className="text-muted-foreground/60 hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title="候補一覧を開閉"
              >
                <ChevronDown className={cn("size-4 transition-transform duration-200", isSuggestionsExpanded && "rotate-180")} />
              </button>
            )}
          </div>

          {/* フローティング候補ドロップダウンメニュー */}
          {isSuggestionsExpanded && summarySuggestions && summarySuggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1.5 w-full bg-background rounded-xl border border-border/80 shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-1 max-h-60 overflow-y-auto">
              <p className="text-[11px] font-bold text-muted-foreground px-3 py-1.5 border-b border-border/40 bg-muted/20">
                業種・サマリーを選択 または 直接入力
              </p>
              <div className="flex flex-col py-1">
                {filteredSummarySuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSelectSummarySuggestion?.(s);
                      onSummaryChange(s);
                      setIsSuggestionsExpanded(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer text-left w-full"
                  >
                    <span>{s}</span>
                    {summaryValue === s && <span className="text-xs text-primary font-bold">✓</span>}
                  </button>
                ))}
                {filteredSummarySuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground px-3 py-2 font-medium">
                    「{summaryValue}」を新しく設定します
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Metadata Pills Bar ─────────────────────────────────────────────────── */

export function LinearDialogMetadataBar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-3.5 border-y border-border/60 my-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Pill Button & Popover ──────────────────────────────────────────────── */

export interface LinearDialogPillProps {
  icon?: React.ReactNode;
  label?: string;
  value?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  popoverContent?: React.ReactNode;
  popoverClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LinearDialogPill({
  icon,
  label,
  value,
  active = false,
  onClick,
  className,
  popoverContent,
  popoverClassName,
  popoverAlign = "start",
  open,
  onOpenChange,
}: LinearDialogPillProps) {
  const pillButton = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border/80 bg-muted/30 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active &&
          "border-primary/30 bg-primary/5 text-primary font-semibold hover:bg-primary/10 hover:text-primary",
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            "shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors",
            active && "text-primary group-hover:text-primary"
          )}
        >
          {icon}
        </span>
      )}
      {label && <span className="truncate">{label}</span>}
      {value && (
        <span
          className={cn(
            "text-foreground max-w-[140px] truncate font-semibold",
            active && "text-primary"
          )}
        >
          {value}
        </span>
      )}
      {popoverContent && (
        <ChevronDown className="size-3 opacity-50 group-hover:opacity-100 ml-0.5 shrink-0" />
      )}
    </button>
  );

  if (!popoverContent) {
    return pillButton;
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{pillButton}</PopoverTrigger>
      <PopoverContent
        align={popoverAlign}
        className={cn("w-64 p-3 z-50 shadow-xl border-border/60 bg-background/95 backdrop-blur-md rounded-xl animate-in zoom-in-95 duration-150", popoverClassName)}
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Textarea ───────────────────────────────────────────────────────────── */

export type LinearDialogTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function LinearDialogTextarea({
  className,
  ...props
}: LinearDialogTextareaProps) {
  return (
    <div className="py-2">
      <textarea
        className={cn(
          "min-h-64 w-full resize-none bg-transparent text-base font-medium leading-7 text-foreground placeholder:text-muted-foreground/50 outline-none border-none px-0 py-2 focus:ring-0",
          className
        )}
        {...props}
      />
    </div>
  );
}

/* ─── Bottom Section (Milestones box style) ──────────────────────────────── */

export interface LinearDialogSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  sectionTitle: React.ReactNode;
  action?: React.ReactNode;
}

export function LinearDialogSection({
  sectionTitle,
  action,
  children,
  className,
  ...props
}: LinearDialogSectionProps) {
  return (
    <div
      className={cn(
        "border border-border/80 bg-card/60 dark:bg-card/40 rounded-xl p-4 shadow-2xs mt-6 transition-all hover:border-border hover:shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="text-sm font-bold text-foreground flex items-center gap-2">
          {sectionTitle}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
