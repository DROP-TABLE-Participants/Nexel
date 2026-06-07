"use client";

import Link from "next/link";
import { SiOpenai, SiAnthropic } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AGENTS } from "@/lib/agents-data";
import { type IconType } from "react-icons";

const statusConfig = {
  healthy: { label: "Active",   variant: "success"     as const, dot: "bg-emerald-500" },
  warning: { label: "Degraded", variant: "warning"     as const, dot: "bg-amber-400"   },
  error:   { label: "Offline",  variant: "destructive" as const, dot: "bg-red-500"     },
};

const ICONS: Record<string, { Icon: IconType; color: string }> = {
  sales:   { Icon: SiOpenai,    color: "#000000" },
  support: { Icon: SiAnthropic, color: "#d97706" },
  dev:     { Icon: SiAnthropic, color: "#d97706" },
};

function AgentIcon({ id, size = "md" }: { id: string; size?: "sm" | "md" }) {
  const { Icon, color } = ICONS[id] ?? { Icon: SiAnthropic, color: "#000" };
  const dims    = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const iconSize = size === "md" ? 18 : 14;
  return (
    <div className={cn("flex items-center justify-center rounded-lg flex-shrink-0", dims)}
      style={{ backgroundColor: `${color}18` }}>
      <Icon style={{ color, fontSize: iconSize }} />
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Agents</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{AGENTS.length} agents · all active</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--muted)]/40">
          {["Agent", "Status", "Tokens", "Cost", "Saved"].map((h) => (
            <span key={h} className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {AGENTS.map((agent, i) => {
          const status = statusConfig[agent.status];
          return (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center px-5 py-4 hover:bg-[var(--muted)]/40 transition-colors",
                i < AGENTS.length - 1 && "border-b border-[var(--border)]"
              )}
            >
              <div className="flex items-center gap-3">
                <AgentIcon id={agent.id} />
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{agent.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{agent.model} · {agent.connection}</p>
                </div>
              </div>

              <Badge variant={status.variant} className="gap-1.5 w-fit">
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>

              <p className="text-sm text-[var(--foreground)]">{agent.tokens}</p>
              <p className="text-sm text-[var(--foreground)]">{agent.cost}</p>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{agent.saved}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
