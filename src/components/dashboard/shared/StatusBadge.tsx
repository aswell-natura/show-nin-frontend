import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = "lead" | "proposing" | "negotiating" | "active" | "dormant" | "closed"
export type RankType = "A" | "B" | "C" | "D" | string

const statusLabels: Record<StatusType, string> = {
  lead: 'リード', proposing: '提案中', negotiating: '商談中', active: '既存顧客', dormant: '休眠', closed: '成約',
}

export function StatusBadge({ status, className }: { status: StatusType | string, className?: string }) {
  const isKnown = status in statusLabels;
  const label = isKnown ? statusLabels[status as StatusType] : status;

  const colorMap: Record<string, string> = {
    lead: 'bg-muted text-muted-foreground hover:bg-muted/80',
    proposing: 'bg-blue-100 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900/30 dark:text-blue-400',
    negotiating: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200/80 dark:bg-yellow-900/30 dark:text-yellow-400',
    active: 'bg-green-100 text-green-700 hover:bg-green-200/80 dark:bg-green-900/30 dark:text-green-400',
    dormant: 'bg-muted text-muted-foreground hover:bg-muted/80',
    closed: 'bg-green-100 text-green-700 hover:bg-green-200/80 dark:bg-green-900/30 dark:text-green-400'
  }
  
  return (
    <Badge 
      className={cn("text-[11px] font-medium border-0 shadow-none transition-colors", colorMap[status] || 'bg-muted text-muted-foreground', className)}
    >
      {label}
    </Badge>
  )
}

export function RankBadge({ rank, className, size = "sm" }: { rank: RankType, className?: string, size?: "sm" | "lg" }) {
  const r = typeof rank === 'string' ? rank.toUpperCase() : String(rank);

  // Premium design tokens per rank for sm (translucent + border + glow) and lg (translucent + border + glow) styles
  const stylesMap: Record<string, { sm: string, lg: string }> = {
    A: { // Gold / VIP
      sm: "bg-gradient-to-br from-amber-400/20 via-yellow-400/10 to-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-400/50 dark:border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.25)] dark:shadow-[0_0_12px_rgba(245,158,11,0.2)] font-black",
      lg: "bg-gradient-to-br from-amber-400/20 via-yellow-400/10 to-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-400/50 dark:border-amber-400/50 shadow-[0_0_14px_rgba(245,158,11,0.35)] dark:shadow-[0_0_16px_rgba(245,158,11,0.3)] font-black"
    },
    B: { // Silver / Standard-High
      sm: "bg-gradient-to-br from-slate-200/40 via-slate-100/20 to-slate-200/5 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500/40 shadow-[0_0_8px_rgba(148,163,184,0.2)] dark:shadow-[0_0_12px_rgba(148,163,184,0.15)] font-extrabold",
      lg: "bg-gradient-to-br from-slate-200/40 via-slate-100/20 to-slate-200/5 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500/40 shadow-[0_0_14px_rgba(148,163,184,0.25)] dark:shadow-[0_0_16px_rgba(148,163,184,0.2)] font-extrabold"
    },
    C: { // Bronze / Standard-Mid
      sm: "bg-gradient-to-br from-orange-500/15 via-amber-600/10 to-orange-700/5 text-orange-700 dark:text-orange-400 border border-orange-500/40 dark:border-orange-500/45 shadow-[0_0_8px_rgba(217,119,6,0.25)] dark:shadow-[0_0_12px_rgba(217,119,6,0.2)] font-extrabold",
      lg: "bg-gradient-to-br from-orange-500/15 via-amber-600/10 to-orange-700/5 text-orange-700 dark:text-orange-400 border border-orange-500/40 dark:border-orange-500/45 shadow-[0_0_14px_rgba(217,119,6,0.3)] dark:shadow-[0_0_16px_rgba(217,119,6,0.25)] font-extrabold"
    },
    D: { // Muted / Neutral
      sm: "bg-muted text-muted-foreground border border-border/80 dark:border-border/40 font-bold",
      lg: "bg-muted text-muted-foreground border border-border/80 dark:border-border/40 shadow-md font-bold"
    }
  }

  const selectedStyle = stylesMap[r] || stylesMap.D;

  const sizeClasses = size === "lg" 
    ? "w-8 h-8 text-sm" 
    : "w-5 h-5 text-[10px]"

  return (
    <Badge 
      className={cn(
        "rounded-full p-0 flex items-center justify-center select-none shrink-0 cursor-default",
        sizeClasses, 
        size === "lg" ? selectedStyle.lg : selectedStyle.sm,
        className
      )}
    >
      {r}
    </Badge>
  )
}
