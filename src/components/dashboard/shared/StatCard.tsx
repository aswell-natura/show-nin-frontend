import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  labelClassName?: string;
  valueClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  labelClassName,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-lg bg-muted/50 border border-border/50 px-3 py-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
          labelClassName,
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold text-foreground mt-0.5 tracking-tight",
          valueClassName,
        )}
      >
        {value}
      </p>
    </Card>
  );
}
