import Link from "next/link";
import { connection } from "next/server";
import {
  Activity,
  ArrowRight,
  Database,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDashboardMetrics } from "@/lib/runs";
import { getMcpTelemetryDashboard } from "@/lib/telemetry/mcpTelemetry";

function metric(value: number, suffix = "") {
  return `${Number(value.toFixed(1))}${suffix}`;
}

function usd(value: number) {
  return `$${value.toFixed(4)}`;
}

function heat(value: number, max: number) {
  if (!max) return "bg-slate-50";
  const ratio = value / max;
  if (ratio > 0.66) return "bg-teal-700 text-white";
  if (ratio > 0.33) return "bg-teal-200 text-teal-950";
  return "bg-teal-50 text-teal-950";
}

export default async function DashboardPage() {
  await connection();
  const [dashboard, mcp] = await Promise.all([
    getDashboardMetrics(),
    getMcpTelemetryDashboard(),
  ]);
  const maxHeatTokens = Math.max(0, ...mcp.heatmap.map((cell) => cell.estimatedTokens));
  const metricCards: {
    label: string;
    value: string | number;
    Icon: LucideIcon;
    color: string;
  }[] = [
    {
      label: "Total runs",
      value: dashboard.totalRuns,
      Icon: Activity,
      color: "bg-slate-950 text-white",
    },
    {
      label: "Average token reduction",
      value: metric(dashboard.averageTokenReduction, "%"),
      Icon: Gauge,
      color: "bg-teal-100 text-teal-950",
    },
    {
      label: "Average source precision improvement",
      value: metric(dashboard.averageSourcePrecisionImprovement, " pts"),
      Icon: Sparkles,
      color: "bg-blue-100 text-blue-950",
    },
    {
      label: "Average quality score improvement",
      value: metric(dashboard.averageQualityScoreImprovement, " pts"),
      Icon: Gauge,
      color: "bg-violet-100 text-violet-950",
    },
    {
      label: "Forbidden sources blocked",
      value: dashboard.forbiddenSourcesBlocked,
      Icon: ShieldCheck,
      color: "bg-amber-100 text-amber-950",
    },
    {
      label: "Actions completed",
      value: dashboard.actionsCompleted,
      Icon: Activity,
      color: "bg-emerald-100 text-emerald-950",
    },
    {
      label: "MCP calls",
      value: mcp.totalMcpCalls,
      Icon: Database,
      color: "bg-slate-100 text-slate-950",
    },
    {
      label: "MCP money saved",
      value: usd(mcp.totalMoneySavedUsd + dashboard.demoMoneySavedUsd),
      Icon: Gauge,
      color: "bg-emerald-100 text-emerald-950",
    },
    {
      label: "MCP blocked sources",
      value: mcp.blockedSources,
      Icon: ShieldCheck,
      color: "bg-amber-100 text-amber-950",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-teal-700">Comparison dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Aggregate demo metrics</h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Home
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/permissions"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Permissions
          <ShieldCheck size={16} />
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map(({ label, value, Icon, color }) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-md ${color}`}>
                <Icon size={20} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">MCP data heatmap</h2>
            <p className="mt-1 text-sm text-slate-600">
              Source usage per client profile, based on persisted MCP calls.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {mcp.totalMcpTokens} tokens, {usd(mcp.totalMcpCostUsd)} estimated cost
          </p>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Client profile</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Connector</th>
                <th className="px-4 py-3">Sensitivity</th>
                <th className="px-4 py-3">Calls</th>
                <th className="px-4 py-3">Token heat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mcp.heatmap.slice(0, 16).map((cell) => (
                <tr key={`${cell.agentRole}:${cell.sourceId}`}>
                  <td className="px-4 py-3 font-medium text-slate-950">{cell.agentRole}</td>
                  <td className="px-4 py-3 text-slate-600">{cell.title}</td>
                  <td className="px-4 py-3 text-slate-600">{cell.connector}</td>
                  <td className="px-4 py-3 text-slate-600">{cell.sensitivity}</td>
                  <td className="px-4 py-3 text-slate-600">{cell.calls}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex min-w-24 justify-center rounded-md px-3 py-2 font-semibold ${heat(
                        cell.estimatedTokens,
                        maxHeatTokens,
                      )}`}
                    >
                      {cell.estimatedTokens}
                    </span>
                  </td>
                </tr>
              ))}
              {!mcp.heatmap.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Connect an MCP client or call `/mcp` to populate source telemetry.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-950">Recent MCP calls</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Money saved</th>
                <th className="px-4 py-3">Blocked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mcp.recentCalls.map((call) => (
                <tr key={call.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{call.toolName}</td>
                  <td className="px-4 py-3 text-slate-600">{call.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">{call.agentRole}</td>
                  <td className="px-4 py-3 text-slate-600">{call.usage.totalTokens}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {usd(call.usage.moneySavedUsd)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{call.blockedSources.length}</td>
                </tr>
              ))}
              {!mcp.recentCalls.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No MCP calls have been recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-950">Recent runs</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Precision</th>
                <th className="px-4 py-3">Forbidden</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.recentRuns.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{run.agentRole}</td>
                  <td className="px-4 py-3 text-slate-600">{run.mode}</td>
                  <td className="px-4 py-3 text-slate-600">{run.metrics.totalTokens}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {Math.round(run.metrics.sourcePrecision * 100)}%
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {run.metrics.forbiddenSourcesReturned}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{run.metrics.qualityScore}</td>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-teal-700" href={`/runs/${run.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!dashboard.recentRuns.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    Run a comparison from an agent page to populate the dashboard.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
