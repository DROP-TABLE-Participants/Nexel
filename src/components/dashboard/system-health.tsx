import { connectorStatuses } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SystemHealth() {
  const healthy = connectorStatuses.filter((c) => c.status === "healthy").length;
  const total = connectorStatuses.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System health</CardTitle>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {healthy}/{total} online
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {connectorStatuses.map((connector) => (
          <div
            key={connector.name}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-[var(--muted)]/50"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  connector.status === "healthy"
                    ? "bg-emerald-500"
                    : connector.status === "warning"
                    ? "bg-amber-400"
                    : "bg-red-500"
                )}
              />
              <span className="text-sm font-medium text-[var(--foreground)]">{connector.name}</span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{connector.lastSync}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
