"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Columns3,
  Loader2,
  Mail,
  Play,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentRole, AgentRun, DemoMode, Scenario } from "@/lib/types";

type CompareResult = {
  scenario: Scenario;
  naive: AgentRun;
  companyBrain: AgentRun;
};

type AgentDemoProps = {
  agentRole: AgentRole;
  displayName: string;
  scenarioId: string;
  defaultTask: string;
  initialCompare?: boolean;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDelta(naive: number, brain: number) {
  if (!naive) return "0%";
  return `${Math.round(((naive - brain) / naive) * 100)}%`;
}

function metricRows(run: AgentRun) {
  return [
    ["Token usage", `${run.metrics.totalTokens} ${run.metrics.tokenUsageKind}`],
    ["Source precision", formatPercent(run.metrics.sourcePrecision)],
    ["Forbidden leakage", String(run.metrics.forbiddenSourcesReturned)],
    ["Forbidden sources blocked", String(run.metrics.forbiddenSourcesBlocked)],
    ["Actions completed", `${Math.round(run.metrics.actionSuccessRate * 100)}%`],
    ["Quality score", `${run.metrics.qualityScore}/100`],
  ];
}

function sourceList(run: AgentRun) {
  if (typeof run.context === "string") {
    const matches = [...run.context.matchAll(/\[(.*?)\]/g)].map((match) => match[1]);
    return Array.from(new Set(matches));
  }
  return run.context.sources.map((source) => source.id);
}

function renderOutput(run: AgentRun) {
  const output = run.output;
  const emailDraft = output.emailDraft as
    | { to?: string; subject?: string; body?: string }
    | undefined;
  const invoiceStatusUpdate = output.invoiceStatusUpdate as
    | { invoiceNumber?: string; status?: string; paidAt?: string }
    | undefined;
  const invoiceRows = Array.isArray(output.invoiceRows)
    ? (output.invoiceRows as Array<{
        invoiceNumber?: string;
        customerName?: string;
        customerEmail?: string;
        dueDate?: string;
        amount?: number;
        currency?: string;
        status?: string;
      }>)
    : [];

  return (
    <div className="space-y-4 text-sm text-[var(--foreground)]">
      <p className="text-base font-medium text-[var(--foreground)]">
        {String(output.summary ?? output.issueClassification ?? "Generated output")}
      </p>
      {emailDraft ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
            <Mail size={14} /> Gmail draft
          </div>
          <p className="font-medium text-[var(--foreground)]">{emailDraft.subject}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{emailDraft.to}</p>
          <p className="mt-3 whitespace-pre-wrap leading-6">{emailDraft.body}</p>
        </div>
      ) : null}
      {invoiceStatusUpdate ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
            <BadgeCheck size={14} /> Invoice status
          </div>
          <p className="font-medium text-[var(--foreground)]">
            {invoiceStatusUpdate.invoiceNumber} {invoiceStatusUpdate.status}
          </p>
          {invoiceStatusUpdate.paidAt ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">Paid at {invoiceStatusUpdate.paidAt}</p>
          ) : null}
        </div>
      ) : null}
      {invoiceRows.length > 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
            <Table2 size={14} /> Invoice rows
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs text-[var(--foreground)]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                  <th className="py-2 pr-3 font-semibold">Invoice</th>
                  <th className="py-2 pr-3 font-semibold">Customer</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Due</th>
                  <th className="py-2 pr-3 font-semibold">Amount</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoiceRows.map((row) => (
                  <tr key={row.invoiceNumber} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-3 font-medium text-[var(--foreground)]">{row.invoiceNumber}</td>
                    <td className="py-2 pr-3">{row.customerName}</td>
                    <td className="py-2 pr-3">{row.customerEmail}</td>
                    <td className="py-2 pr-3">{row.dueDate}</td>
                    <td className="py-2 pr-3">{row.amount} {row.currency}</td>
                    <td className="py-2 pr-3">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RunColumn({ title, run }: { title: string; run?: AgentRun }) {
  if (!run) {
    return (
      <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-5 text-sm text-[var(--muted-foreground)]">
        {title}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{title}</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {run.mode === "naive" ? "Without middleware" : "With Company Brain"}
          </h2>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/runs/${run.id}`}>Trace</Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {metricRows(run).map(([label, value]) => (
          <div key={label} className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-3">
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-1 font-semibold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">{renderOutput(run)}</div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Sources used</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sourceList(run).map((source) => (
            <span
              key={source}
              className="rounded-md border border-[var(--border)] bg-[var(--muted)]/50 px-2 py-1 text-xs text-[var(--foreground)]"
            >
              {source}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Action log</p>
        <div className="mt-2 space-y-2">
          {run.actions.length === 0 ? (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm text-[var(--muted-foreground)]">
              No actions requested
            </div>
          ) : null}
          {run.actions.map((action) => (
            <div
              key={`${action.tool}-${JSON.stringify(action.output)}`}
              className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
            >
              <span className="font-medium text-[var(--foreground)]">{action.tool}</span>
              <span className="text-[var(--muted-foreground)]">{action.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AgentDemo({
  agentRole,
  displayName,
  scenarioId,
  defaultTask,
  initialCompare = false,
}: AgentDemoProps) {
  const [task, setTask] = useState(defaultTask);
  const [loading, setLoading] = useState<DemoMode | "compare" | null>(null);
  const [naiveRun, setNaiveRun] = useState<AgentRun | undefined>();
  const [brainRun, setBrainRun] = useState<AgentRun | undefined>();
  const [scenario, setScenario] = useState<Scenario | undefined>();
  const hasAutoRun = useRef(false);

  const summary = useMemo(() => {
    if (!naiveRun || !brainRun) return null;
    return {
      tokenReduction: formatDelta(naiveRun.metrics.totalTokens, brainRun.metrics.totalTokens),
      precisionGain: `${Math.round(
        (brainRun.metrics.sourcePrecision - naiveRun.metrics.sourcePrecision) * 100,
      )} pts`,
      qualityGain: `${Math.round(
        brainRun.metrics.qualityScore - naiveRun.metrics.qualityScore,
      )} pts`,
      blocked: brainRun.metrics.forbiddenSourcesBlocked,
    };
  }, [naiveRun, brainRun]);

  async function runMode(mode: DemoMode) {
    setLoading(mode);
    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentRole, mode, scenarioId, task }),
      });
      const run = (await response.json()) as AgentRun;
      if (mode === "naive") setNaiveRun(run);
      else setBrainRun(run);
    } finally {
      setLoading(null);
    }
  }

  async function runComparison() {
    setLoading("compare");
    try {
      const response = await fetch("/api/agents/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentRole, scenarioId }),
      });
      const result = (await response.json()) as CompareResult;
      setScenario(result.scenario);
      setTask(result.scenario.task);
      setNaiveRun(result.naive);
      setBrainRun(result.companyBrain);
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    if (!initialCompare || hasAutoRun.current) return;
    hasAutoRun.current = true;
    void runComparison();
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--primary)]">{displayName}</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{displayName} demo</h1>
          <textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            className="mt-5 min-h-32 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-base leading-7 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => runMode("naive")}
              disabled={Boolean(loading)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {loading === "naive" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Without middleware
            </Button>
            <Button
              onClick={() => runMode("company_brain")}
              disabled={Boolean(loading)}
              className="w-full sm:w-auto"
            >
              {loading === "company_brain" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              With Company Brain
            </Button>
            <Button
              onClick={runComparison}
              disabled={Boolean(loading)}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {loading === "compare" ? <Loader2 size={16} className="animate-spin" /> : <Columns3 size={16} />}
              Run Comparison
            </Button>
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[var(--foreground)]">Selected scenario</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{scenario?.title ?? scenarioId}</p>
          {summary ? (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/45 p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Token reduction</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{summary.tokenReduction}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/45 p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Source precision</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{summary.precisionGain}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/45 p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Forbidden blocked</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{summary.blocked}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/45 p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Quality score</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{summary.qualityGain}</p>
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <RunColumn title="Baseline run" run={naiveRun} />
        <RunColumn title="Middleware run" run={brainRun} />
      </div>
    </div>
  );
}
