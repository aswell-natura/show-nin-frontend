import { useRef } from "react";
import { Button } from "../ui/button";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  compact?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  showLabel?: boolean;
  extended?: boolean;
  fab?: boolean;
}

export function RecordButton({
  compact = false,
  className,
  variant = "primary",
  showLabel = true,
  extended = false,
  fab = false,
}: RecordButtonProps) {
  const popupRef = useRef<Window | null>(null);

  function openRecordingWindow() {
    const width = 430;
    const height = 780;
    const left = Math.max(0, window.screenX + window.outerWidth - width - 24);
    const top = Math.max(0, window.screenY + 32);
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=yes",
      "noopener=no",
    ].join(",");

    const popup = window.open("/recording", "show_nin_recording", features);
    if (popup) {
      popupRef.current = popup;
      popup.focus();
    } else {
      window.location.href = "/recording";
    }
  }

  return (
    <Button
      onClick={openRecordingWindow}
      title="録音画面を開く"
      variant={variant}
      size={compact ? "sm" : "md"}
      className={cn(
        "shadow-md hover:shadow-lg transition-all active:scale-95 ring-offset-background",
        extended && "px-4 rounded-full h-12 shadow-lg hover:shadow-xl",
        fab && "h-14 w-14 rounded-full shadow-2xl p-0 flex items-center justify-center",
        className
      )}
    >
      <span className={cn(
        "flex items-center justify-center rounded-full bg-white/20 shrink-0",
        compact ? "h-4 w-4" : fab ? "h-9 w-9" : "h-5 w-5",
        (extended || (showLabel && !fab)) && "mr-2"
      )}>
        <Mic className={compact ? "w-3 h-3" : fab ? "w-5 h-5" : "w-3.5 h-3.5"} />
      </span>
      {(showLabel || extended) && !fab && (
        <span className={cn(
          "whitespace-nowrap font-semibold tracking-tight",
          extended ? "text-sm" : "text-sm"
        )}>
          {compact ? "録音" : "録音開始"}
        </span>
      )}
    </Button>
  );
}
