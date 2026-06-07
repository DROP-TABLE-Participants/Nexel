"use client";

import Link from "next/link";
import { SiAnthropic, SiNotion, SiOpenai } from "react-icons/si";
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
  invoice_ops:  { Icon: SiOpenai,    color: "#000000" },
  mcp_reporter: { Icon: SiAnthropic, color: "#d97706" },
  collections:  { Icon: SiNotion,    color: "#6338fe" },
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
  const activeCount = AGENTS.filter((agent) => agent.status === "healthy").length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Agents</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {AGENTS.length} agents · {activeCount} active
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[var(--border)] bg-[var(--muted)]/40 px-5 py-3 sm:grid">
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
                "flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-[var(--muted)]/40 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-4 sm:px-5",
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

              <p className="flex items-center justify-between gap-3 text-sm text-[var(--foreground)] sm:block">
                <span className="text-xs text-[var(--muted-foreground)] sm:hidden">Tokens</span>
                {agent.tokens}
              </p>
              <p className="flex items-center justify-between gap-3 text-sm text-[var(--foreground)] sm:block">
                <span className="text-xs text-[var(--muted-foreground)] sm:hidden">Cost</span>
                {agent.cost}
              </p>
              <p className="flex items-center justify-between gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 sm:block">
                <span className="text-xs font-normal text-[var(--muted-foreground)] sm:hidden">Saved</span>
                {agent.saved}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
