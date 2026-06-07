"use client";

import { useState } from "react";
import { recentActivity, type ActivityItem } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { FULL_CONTEXTS } from "@/lib/agents-data";

const typeConfig = {
  agent_query: { icon: Zap,           color: "text-[var(--primary)]",              bg: "bg-[var(--primary)]/10"           },
  sync:        { icon: RefreshCw,      color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  warning:     { icon: AlertTriangle,  color: "text-amber-500",                     bg: "bg-amber-100 dark:bg-amber-900/30" },
};

function ActivityDialog({ item, onClose }: { item: ActivityItem; onClose: () => void }) {
  const d = item.detail!;
  const optimizedPct = Math.round((parseInt(d.tokensOptimized.replace(/,/g, "")) / parseInt(d.tokens.replace(/,/g, ""))) * 100);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold leading-snug">{item.label}</DialogTitle>
          <p className="text-xs text-[var(--muted-foreground)]">{item.time} · {item.agent} · {d.duration}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Tokens used",      value: d.tokens },
              { label: "Tokens saved", value: d.tokensOptimized },
              { label: "Cost saved",       value: d.costSaved },
              { label: "Reduction",        value: `${optimizedPct}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2.5">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Optimization bar */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Token reduction</p>
            <div className="h-2 w-full rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${optimizedPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>{optimizedPct}% optimized away</span>
              <span>{100 - optimizedPct}% delivered</span>
            </div>
          </div>

          {/* Context batches used */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Context batches accessed</p>
            <div className="flex flex-wrap gap-2">
              {d.contexts.map((name) => {
                const ctx = FULL_CONTEXTS.find((c) => c.name === name);
                return (
                  <span
                    key={name}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: `${ctx?.color ?? "#6338fe"}18`, color: ctx?.color ?? "#6338fe" }}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivityFeed() {
  const [selected, setSelected] = useState<ActivityItem | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {recentActivity.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            const clickable = item.type === "agent_query" && !!item.detail;
            return (
              <div
                key={item.id}
                onClick={() => clickable && setSelected(item)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  clickable
                    ? "cursor-pointer hover:bg-[var(--primary)]/5 hover:text-[var(--primary)]"
                    : "hover:bg-[var(--muted)]/60"
                )}
              >
                <div className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full", config.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--foreground)] truncate">{item.label}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">{item.time}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {selected && <ActivityDialog item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
