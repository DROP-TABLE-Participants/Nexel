import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Database,
  Mail,
  Mic,
  ShieldCheck,
} from "lucide-react";
import { agentOrder, getPolicy } from "@/lib/policies";
import { defaultScenarioId } from "@/lib/scenarios";
import type { AgentRole } from "@/lib/types";

const agentIcons: Record<AgentRole, typeof Bot> = {
  sales_outreach: Mail,
  teftero: Database,
  voice_support: Mic,
};

const systems: Record<AgentRole, string[]> = {
  sales_outreach: ["Gmail", "Google Drive", "Local lead mock"],
  teftero: ["Teftero ERP", "Google Drive", "ERP mock data"],
  voice_support: ["Voice", "Gmail", "Google Drive", "Teftero ERP"],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f7] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
              <BrainCircuit size={16} />
              Company Brain MCP Server
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Give any chatbot a governed MCP path into company data.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Connect ChatGPT, Claude, or another MCP client to one server that scopes
              data by profile, permissions, task, and source, then records telemetry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/agents/sales?compare=1"
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Run full comparison
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                href="/permissions"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Permissions
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-3">
              {[
                ["Naive retrieval", "All systems, noisy context", "bg-rose-100 text-rose-900"],
                ["Company Brain", "Policy-scoped evidence pack", "bg-teal-100 text-teal-950"],
                ["MCP endpoint", "/mcp Streamable HTTP", "bg-blue-100 text-blue-950"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center gap-3 rounded-md bg-white p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md ${color}`}>
                    {label === "Company Brain" ? (
                      <ShieldCheck size={18} />
                    ) : label === "MCP endpoint" ? (
                      <ArrowRight size={18} />
                    ) : (
                      <Database size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{label}</p>
                    <p className="text-sm text-slate-600">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {agentOrder.map((role) => {
            const policy = getPolicy(role);
            const Icon = agentIcons[role];
            const path =
              role === "voice_support"
                ? "/agents/support"
                : role === "sales_outreach"
                  ? "/agents/sales"
                  : `/agents/${role}`;
            return (
              <article
                key={role}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon size={20} />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-slate-950">
                  {policy.displayName}: {role === "sales_outreach" ? "Sales Outreach Profile" : role === "teftero" ? "ERP Operations Profile" : "Customer Support Profile"}
                </h2>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">
                  {policy.jobDescription}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {systems[role].map((system) => (
                    <span
                      key={system}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      {system}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`${path}?scenario=${defaultScenarioId(role)}`}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Bot size={15} />
                    Run Demo
                  </Link>
                  <Link
                    href={`${path}?scenario=${defaultScenarioId(role)}&compare=1`}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <BrainCircuit size={15} />
                    Run Comparison
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
