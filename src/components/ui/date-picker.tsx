import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { ja } from "date-fns/locale/ja";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDateString(value?: string) {
  if (!value) return undefined;
  const normalized = value.replace(/\//g, "-");
  const [year, month, day] = normalized.split("-").map(Number);

  if (!year || !month || !day) return undefined;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value?: string, placeholder = "日付を選択") {
  const date = parseDateString(value);
  if (!date) return placeholder;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  size?: "sm" | "md";
  clearable?: boolean;
}

function DatePicker({
  value,
  onChange,
  id,
  placeholder = "日付を選択",
  disabled,
  className,
  buttonClassName,
  contentClassName,
  align = "start",
  size = "md",
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateString(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="secondary"
            size={size === "sm" ? "sm" : "md"}
            disabled={disabled}
            className={cn(
              "w-full justify-start border-input bg-background text-left font-medium text-foreground shadow-2xs hover:bg-background hover:border-ring/50",
              !selected && "text-muted-foreground",
              clearable && selected && "pr-8",
              size === "sm" && "h-8 rounded-lg px-2 text-xs",
              size === "md" && "h-10 rounded-xl px-3 text-sm",
              buttonClassName,
            )}
          >
            <CalendarDays className={cn("text-muted-foreground", size === "sm" ? "size-3.5" : "size-4")} />
            <span className="min-w-0 truncate">
              {formatDisplayDate(value, placeholder)}
            </span>
          </Button>
        </PopoverTrigger>
        {clearable && selected ? (
          <button
            type="button"
            aria-label="日付をクリア"
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange("");
            }}
            className={cn(
              "absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-40",
              size === "sm" ? "size-4" : "size-5",
            )}
          >
            <X className={size === "sm" ? "size-3" : "size-3.5"} />
          </button>
        ) : null}
      </div>
      <PopoverContent
        align={align}
        className={cn("w-auto gap-0 p-3", contentClassName)}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? formatDateValue(date) : "");
            setOpen(false);
          }}
          locale={ja}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
