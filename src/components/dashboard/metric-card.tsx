import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: boolean;
  trend?: { value: string; up: boolean };
}

export function MetricCard({ title, value, sub, icon: Icon, accent, trend }: MetricCardProps) {
  return (
    <Card className={cn(accent && "border-[var(--primary)]/20 bg-[var(--primary)]/[0.03]")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accent ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{value}</div>
        {(sub || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span className={cn(
                "text-xs font-medium",
                trend.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              )}>
                {trend.up ? "↑" : "↓"} {trend.value}
              </span>
            )}
            {sub && <span className="text-xs text-[var(--muted-foreground)]">{sub}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
