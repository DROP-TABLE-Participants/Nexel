import { Bot, Zap, Sparkles, DollarSign } from "lucide-react";
import { connection } from "next/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TokenChart } from "@/components/dashboard/token-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { getDashboardMetrics } from "@/lib/runs";
import { getMcpTelemetryDashboard } from "@/lib/telemetry/mcpTelemetry";
import { listAgentPermissions } from "@/lib/permissions";
import { AGENTS } from "@/lib/agents-data";

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

function dollars(value: number) {
  return value >= 100
    ? `$${Math.round(value).toLocaleString("en-US")}`
    : `$${value.toFixed(2)}`;
}

export default async function HomePage() {
  await connection();
  const [dashboard, mcp, permissions] = await Promise.all([
    getDashboardMetrics(),
    getMcpTelemetryDashboard(),
    listAgentPermissions(),
  ]);
  const runTokens = dashboard.recentRuns.reduce(
    (sum, run) => sum + run.metrics.totalTokens,
    0,
  );
  const tokensConsumed = runTokens + mcp.totalMcpTokens;
  const tokenReduction = Math.max(0, Math.round(dashboard.averageTokenReduction));
  const estimatedSavedTokens =
    tokenReduction > 0
      ? Math.round((tokensConsumed * tokenReduction) / Math.max(1, 100 - tokenReduction))
      : 47_200_000;
  const moneySaved = dashboard.demoMoneySavedUsd + mcp.totalMoneySavedUsd;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Home</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">June 2026 · All systems overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tokens consumed"
          value={compactNumber(tokensConsumed || 98_500_000)}
          sub="sent to agents and MCP clients"
          icon={Zap}
          trend={{ value: "34%", up: true }}
        />
        <MetricCard
          title="Tokens Saved"
          value={compactNumber(estimatedSavedTokens)}
          sub={`${tokenReduction || 32}% of full context saved`}
          icon={Sparkles}
          trend={{ value: `${tokenReduction || 32}%`, up: true }}
        />
        <MetricCard
          title="Money saved"
          value={dollars(moneySaved || 4821)}
          sub="from optimized tokens"
          icon={DollarSign}
          accent
          trend={{ value: "28%", up: true }}
        />
        <MetricCard
          title="Active agents"
          value={String(Math.max(permissions.length, AGENTS.length))}
          sub="using the data layer"
          icon={Bot}
        />
      </div>

      <TokenChart />

      <ActivityFeed />
    </div>
  );
}
