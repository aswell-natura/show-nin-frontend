import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = "lead" | "proposing" | "negotiating" | "closed"
export type RankType = "A" | "B" | "C" | "D" | string

const statusLabels: Record<StatusType, string> = {
  lead: 'リード', proposing: '提案中', negotiating: '交渉中', closed: '成約',
}

export function StatusBadge({ status, className }: { status: StatusType | string, className?: string }) {
  const isKnown = status in statusLabels;
  const label = isKnown ? statusLabels[status as StatusType] : status;

  const colorMap: Record<string, string> = {
    lead: 'bg-muted text-muted-foreground hover:bg-muted/80',
    proposing: 'bg-blue-100 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900/30 dark:text-blue-400',
    negotiating: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200/80 dark:bg-yellow-900/30 dark:text-yellow-400',
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
  const colorMap: Record<string, string> = {
    A: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    B: 'bg-muted text-muted-foreground',
    C: 'bg-muted text-muted-foreground opacity-70',
    D: 'bg-muted text-muted-foreground opacity-50',
  }
  
  const sizeClasses = size === "lg" 
    ? "w-8 h-8 rounded-lg text-sm" 
    : "px-1.5 py-0.5 min-w-5 text-[11px]"

  return (
    <Badge 
      className={cn("font-bold border-0 shadow-none flex items-center justify-center transition-colors", sizeClasses, colorMap[rank] || 'bg-muted text-muted-foreground', className)}
    >
      {rank}
    </Badge>
  )
}
