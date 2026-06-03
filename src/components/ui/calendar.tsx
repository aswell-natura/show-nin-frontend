import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DropdownProps } from "react-day-picker";
import "react-day-picker/style.css";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDropdown({
  options,
  value,
  disabled,
  onChange,
  "aria-label": ariaLabel,
}: DropdownProps) {
  return (
    <Select
      disabled={disabled}
      value={value === undefined ? undefined : String(value)}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        size="sm"
        className="min-w-18 border-border bg-background px-2 text-xs font-semibold shadow-2xs"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="pointer-events-auto min-w-20">
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
            className="text-xs"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        root: cn(defaultClassNames.root, "w-fit"),
        months: cn(defaultClassNames.months, "flex flex-col gap-4"),
        month: cn(defaultClassNames.month, "space-y-4"),
        month_caption: cn(
          defaultClassNames.month_caption,
          "relative flex h-8 items-center justify-center px-8",
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          "text-sm font-semibold text-foreground",
        ),
        nav: cn(
          defaultClassNames.nav,
          "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        ),
        button_previous: cn(
          defaultClassNames.button_previous,
          "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-2xs transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        ),
        button_next: cn(
          defaultClassNames.button_next,
          "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-2xs transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        ),
        month_grid: cn(defaultClassNames.month_grid, "w-full border-collapse"),
        weekdays: cn(defaultClassNames.weekdays, "flex"),
        weekday: cn(
          defaultClassNames.weekday,
          "flex size-9 items-center justify-center text-[0.8rem] font-medium text-muted-foreground",
        ),
        week: cn(defaultClassNames.week, "mt-1 flex w-full"),
        day: cn(defaultClassNames.day, "relative size-9 p-0 text-center text-sm"),
        day_button: cn(
          defaultClassNames.day_button,
          "inline-flex size-9 items-center justify-center rounded-md text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-40",
        ),
        today: cn(defaultClassNames.today, "[&>button]:border [&>button]:border-primary/40"),
        selected: cn(
          defaultClassNames.selected,
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90",
        ),
        outside: cn(
          defaultClassNames.outside,
          "[&>button]:text-muted-foreground/45",
        ),
        disabled: cn(
          defaultClassNames.disabled,
          "[&>button]:text-muted-foreground/35",
        ),
        hidden: cn(defaultClassNames.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        Chevron: ({ orientation, className, style }) => {
          const iconProps = {
            className: cn("size-4", className),
            style: { ...style, fill: "none" },
          };

          switch (orientation) {
            case "left":
              return <ChevronLeft {...iconProps} />;
            case "up":
              return <ChevronUp {...iconProps} />;
            case "down":
              return <ChevronDown {...iconProps} />;
            default:
              return <ChevronRight {...iconProps} />;
          }
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
