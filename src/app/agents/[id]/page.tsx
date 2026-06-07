"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Zap, DollarSign, Database, TrendingDown, ChevronDown } from "lucide-react";
import { SiOpenai, SiAnthropic, SiSlack, SiNotion, SiGoogledrive, SiJira, SiDiscord, SiGithub, SiGmail } from "react-icons/si";
import { type IconType } from "react-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { NetworkChart } from "@/components/dashboard/network-chart";
import { cn } from "@/lib/utils";
import {
  AGENTS,
  FULL_CONTEXTS,
  CONTEXT_UNITS,
  AGENT_ACTIVE_UNITS,
  ALL_SOURCES,
  type ContextUnit,
} from "@/lib/agents-data";

const statusConfig = {
  healthy: { label: "Active",   variant: "success"     as const, dot: "bg-emerald-500" },
  warning: { label: "Degraded", variant: "warning"     as const, dot: "bg-amber-400"   },
  error:   { label: "Offline",  variant: "destructive" as const, dot: "bg-red-500"     },
};

const SOURCE_ICONS: Record<string, { Icon: IconType; color: string }> = {
  slack:   { Icon: SiSlack,       color: "#4A154B" },
  notion:  { Icon: SiNotion,      color: "#000000" },
  gdrive:  { Icon: SiGoogledrive, color: "#1FA463" },
  jira:    { Icon: SiJira,        color: "#0052CC" },
  discord: { Icon: SiDiscord,     color: "#5865F2" },
  github:  { Icon: SiGithub,      color: "#24292F" },
  gmail:   { Icon: SiGmail,       color: "#EA4335" },
};

const ICONS: Record<string, { Icon: React.ElementType; color: string }> = {
  sales:   { Icon: SiOpenai,    color: "#000000" },
  support: { Icon: SiAnthropic, color: "#d97706" },
  dev:     { Icon: SiAnthropic, color: "#d97706" },
};

function StatBox({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5",
      accent ? "border-[var(--primary)]/20" : ""
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("h-3.5 w-3.5", accent ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]")} />
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      </div>
      <p className={cn("text-xl font-semibold", accent ? "text-[var(--primary)]" : "text-[var(--foreground)]")}>{value}</p>
    </div>
  );
}

function UnitBubbles({
  activeUnits,
  onToggle,
}: {
  activeUnits: Set<string>;
  onToggle: (id: string) => void;
}) {
  const groups = FULL_CONTEXTS.map((ctx) => ({
    ...ctx,
    units: CONTEXT_UNITS.filter((u) => u.parent === ctx.name),
  }));

  return (
    <div className="space-y-4 pt-4 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--muted-foreground)]">Click any context unit to grant or revoke access</p>
      {groups.map((group) => (
        <div key={group.name}>
          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">{group.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.units.map((unit) => {
              const active = activeUnits.has(unit.id);
              return (
                <button
                  key={unit.id}
                  onClick={() => onToggle(unit.id)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: active ? `${unit.color}18` : "rgba(113,113,122,0.07)",
                    color: active ? unit.color : "#71717a",
                    border: `1px solid ${active ? `${unit.color}40` : "rgba(113,113,122,0.18)"}`,
                  }}
                >
                  {unit.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agent = AGENTS.find((a) => a.id === id);
  if (!agent) notFound();

  const status = statusConfig[agent.status];
  const { Icon, color } = ICONS[id] ?? { Icon: SiAnthropic, color: "#000" };

  const [contextExpanded, setContextExpanded] = useState(false);
  const [activeUnits, setActiveUnits] = useState<Set<string>>(
    new Set(AGENT_ACTIVE_UNITS[id] ?? [])
  );
  const [sourcePerms, setSourcePerms] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_SOURCES.map((s) => [s.id, agent.sourcesAccess.includes(s.id)]))
  );

  function toggleUnit(unitId: string) {
    setActiveUnits((prev) => {
      const next = new Set(prev);
      next.has(unitId) ? next.delete(unitId) : next.add(unitId);
      return next;
    });
  }

  // Collapsed: 7 high-level category nodes
  const categoryContexts = FULL_CONTEXTS.map((c) => ({
    ...c,
    active: CONTEXT_UNITS.some((u) => u.parent === c.name && activeUnits.has(u.id)),
  }));

  // Expanded: category nodes + 25 unit nodes orbiting parents
  const expandedContexts = [
    ...categoryContexts,
    ...CONTEXT_UNITS.map((u) => ({
      name:   u.name,
      value:  10,
      active: activeUnits.has(u.id),
      parent: u.parent,
      color:  u.color,
    })),
  ];

  const withoutNexel = (
    parseFloat(agent.cost.replace(/[$,]/g, "")) +
    parseFloat(agent.saved.replace(/[$,]/g, ""))
  ).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/agents" className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Agents
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon style={{ color, fontSize: 22 }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">{agent.name}</h1>
            <Badge variant={status.variant} className="gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{agent.model} · via {agent.connection}</p>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Tokens used"    value={agent.tokens}    icon={Zap}         />
        <StatBox label="Cost this month" value={agent.cost}     icon={DollarSign}  />
        <StatBox label="Data units"      value={agent.dataUnits} icon={Database}   />
        <StatBox label="Money saved"     value={agent.saved}     icon={TrendingDown} accent />
      </div>

      {/* Cost comparison */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">Cost comparison</p>
        <div className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Without Nexel</span>
              <span className="font-medium text-[var(--muted-foreground)]">{withoutNexel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--muted)]">
              <div className="h-full w-full rounded-full bg-[var(--muted-foreground)]/25" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--foreground)]">With Nexel</span>
              <span className="font-semibold text-[var(--primary)]">{agent.cost}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${(parseFloat(agent.cost.replace(/[$,]/g, "")) / (parseFloat(agent.cost.replace(/[$,]/g, "")) + parseFloat(agent.saved.replace(/[$,]/g, "")))) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">↓ {agent.saved} saved this month</p>
        </div>
      </div>

      {/* Context allocation — expandable */}
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden cursor-pointer"
        onClick={() => setContextExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Context allocation</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {contextExpanded
                ? "All company contexts — agent usage relative to total"
                : "Click to see full context breakdown"}
            </p>
          </div>
          <div
            className="text-[var(--muted-foreground)] transition-transform duration-300"
            style={{ transform: contextExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        <div className="px-5 pb-5" onClick={(e) => e.stopPropagation()}>
          <NetworkChart contexts={contextExpanded ? expandedContexts : categoryContexts} />
          <div
            style={{
              maxHeight: contextExpanded ? "700px" : "0px",
              opacity: contextExpanded ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <UnitBubbles activeUnits={activeUnits} onToggle={toggleUnit} />
          </div>
        </div>
      </div>

      {/* Permissions — source access only */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">Data source access</p>
        <div className="space-y-1">
          {ALL_SOURCES.map((src) => {
            const si = SOURCE_ICONS[src.id];
            return (
            <div key={src.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <div className="flex items-center gap-3">
                {si && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0" style={{ backgroundColor: `${si.color}18` }}>
                    <si.Icon style={{ color: si.color, fontSize: 14 }} />
                  </div>
                )}
                <span className="text-sm text-[var(--foreground)]">{src.name}</span>
              </div>
              <Switch
                checked={sourcePerms[src.id] ?? false}
                onCheckedChange={(v) => setSourcePerms((p) => ({ ...p, [src.id]: v }))}
              />
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
