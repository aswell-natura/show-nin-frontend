import * as React from "react"
import { WidgetCard } from "./WidgetCard"
import { StatCard } from "./StatCard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: string | number
  className?: string
  labelClassName?: string
  valueClassName?: string
}

interface StandardWidgetProps<T> {
  title: string
  description?: string
  action?: React.ReactNode
  stats?: Stat[]
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
  emptyMessage?: string
  onSeeMore?: () => void
  seeMoreLabel?: string
  maxItems?: number
  className?: string
  listClassName?: string
  children?: React.ReactNode
}

export function StandardWidget<T>({
  title,
  description,
  action,
  stats,
  items,
  renderItem,
  keyExtractor,
  emptyMessage = "データがありません",
  onSeeMore,
  seeMoreLabel = "すべて表示",
  maxItems = 10,
  className,
  listClassName,
  children,
}: StandardWidgetProps<T>) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items
  const hasMore = items.length > (maxItems || items.length)

  return (
    <WidgetCard title={title} description={description} action={action} className={className}>
      {stats && stats.length > 0 && (
        <div className={cn("grid gap-2 p-4 border-b border-border bg-muted/20", `grid-cols-${Math.min(stats.length, 4)}`)}>
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={stat.value}
              className={stat.className}
              labelClassName={stat.labelClassName}
              valueClassName={stat.valueClassName}
            />
          ))}
        </div>
      )}

      {children}

      <div className="flex-1 relative min-h-0 overflow-hidden">
        <div className={cn("h-full overflow-y-auto divide-y divide-border scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border", listClassName)}>
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic bg-muted/5">
              {emptyMessage}
            </div>
          ) : (
            <>
              {displayItems.map((item) => (
                <React.Fragment key={keyExtractor(item)}>
                  {renderItem(item)}
                </React.Fragment>
              ))}
              
              {(hasMore || onSeeMore) && (
                <div className="p-3 bg-muted/5 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                    onClick={onSeeMore}
                  >
                    {seeMoreLabel} {hasMore && `(+${items.length - maxItems})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        {/* Scroll shadow fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-card to-transparent pointer-events-none opacity-60" />
      </div>
    </WidgetCard>
  )
}
