import * as React from "react"
import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-md border border-border/30 bg-background/40 px-1.5 font-mono text-[11px] font-medium text-muted-foreground/60 shadow-sm transition-colors",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
