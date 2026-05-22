import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

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
          "absolute inset-x-0 top-0 flex items-center justify-between",
        ),
        button_previous: cn(
          defaultClassNames.button_previous,
          "inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-2xs transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        ),
        button_next: cn(
          defaultClassNames.button_next,
          "inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-2xs transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
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
        Chevron: ({ orientation, className, ...props }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...props} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
