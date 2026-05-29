import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, WheelEvent } from "react";
import NumberFlow from "@number-flow/react";
import { ChevronDown } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const progressOptions = Array.from({ length: 21 }, (_, index) => index * 5);

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

function normalizeProgressInput(value: string) {
  if (value.trim() === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(clampProgress(Math.round(parsed)));
}

function nearestProgressOption(value: number) {
  return clampProgress(Math.round(value / 5) * 5);
}

interface ProgressPercentPickerProps {
  value: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  className?: string;
}

export function ProgressPercentPicker({
  value,
  onChange,
  ariaLabel = "進捗率",
  className,
}: ProgressPercentPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const centeredOption = nearestProgressOption(value);

  useEffect(() => {
    if (!open) setDraft(String(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      selectedOptionRef.current?.scrollIntoView({ block: "center" });
    });
  }, [centeredOption, open]);

  const commitValue = (nextValue: number) => {
    const normalized = clampProgress(Math.round(nextValue));
    setDraft(String(normalized));
    if (normalized !== value) onChange(normalized);
  };

  const commitDraft = () => {
    const normalized = normalizeProgressInput(draft);
    if (normalized === "") {
      setDraft(String(value));
      return;
    }
    commitValue(Number(normalized));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitDraft();
      setOpen(false);
      return;
    }

    if (event.key === "Escape") {
      setDraft(String(value));
      setOpen(false);
    }
  };

  const handlePickerWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    pickerRef.current?.scrollBy({
      top: event.deltaY > 0 ? 40 : -40,
      behavior: "smooth",
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraft(String(value));
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex h-8 w-24 items-center justify-between gap-2 rounded-full border border-border/80 bg-background px-3 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/60 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          <NumberFlow
            value={value}
            suffix="%"
            willChange
            className="tabular-nums"
          />
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-52 gap-3 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={5}
            value={draft}
            aria-label={ariaLabel}
            autoFocus
            onFocus={(event) => event.currentTarget.select()}
            onBlur={commitDraft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onWheel={(event) => event.preventDefault()}
            className="h-7 min-w-0 flex-1 bg-transparent text-center text-sm font-semibold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs font-semibold text-muted-foreground">%</span>
        </div>
        <div
          ref={pickerRef}
          onWheel={handlePickerWheel}
          className="h-40 overflow-y-auto scroll-smooth [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.35)_transparent] [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex flex-col items-stretch">
            {progressOptions.map((option) => {
              const isSelected = option === centeredOption;

              return (
                <button
                  key={option}
                  ref={isSelected ? selectedOptionRef : undefined}
                  type="button"
                  onClick={() => {
                    commitValue(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "mr-3 h-10 shrink-0 rounded-md text-center text-sm font-semibold tabular-nums text-muted-foreground transition-colors [scroll-snap-align:start]",
                    "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isSelected && "bg-primary/10 text-primary font-bold",
                  )}
                >
                  {option}%
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
