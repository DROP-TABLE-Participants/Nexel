"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Columns3,
  FileAudio,
  Loader2,
  Mail,
  Mic,
  Play,
  Volume2,
} from "lucide-react";
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
  type TaskLike = { title?: string; description?: string; priority?: string };
  const emailDraft = output.emailDraft as
    | { to?: string; subject?: string; body?: string }
    | undefined;
  const customerReply = output.customerReply as
    | { subject?: string; body?: string }
    | undefined;
  const erpTask = (output.erpTask as TaskLike | undefined) ??
    (output.supportTicket as TaskLike | undefined);

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <p className="text-base font-medium text-slate-950">{String(output.summary ?? output.issueClassification ?? "Generated output")}</p>
      {emailDraft ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Mail size={14} /> Gmail draft
          </div>
          <p className="font-medium text-slate-950">{emailDraft.subject}</p>
          <p className="mt-1 text-xs text-slate-500">{emailDraft.to}</p>
          <p className="mt-3 whitespace-pre-wrap leading-6">{emailDraft.body}</p>
        </div>
      ) : null}
      {customerReply ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Mail size={14} /> Customer reply
          </div>
          <p className="font-medium text-slate-950">{customerReply.subject}</p>
          <p className="mt-3 whitespace-pre-wrap leading-6">{customerReply.body}</p>
        </div>
      ) : null}
      {erpTask ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">ERP task</p>
          <p className="mt-2 font-medium text-slate-950">{erpTask.title}</p>
          <p className="mt-2 leading-6">{erpTask.description}</p>
          <p className="mt-2 text-xs text-slate-500">Priority: {erpTask.priority}</p>
        </div>
      ) : null}
      {output.voiceResponseText ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Volume2 size={14} /> Voice response
          </div>
          <p className="leading-6">{String(output.voiceResponseText)}</p>
        </div>
      ) : null}
    </div>
  );
}

function RunColumn({ title, run }: { title: string; run?: AgentRun }) {
  if (!run) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        {title}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {run.mode === "naive" ? "Without middleware" : "With Company Brain"}
          </h2>
        </div>
        <Link
          href={`/runs/${run.id}`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          Trace
        </Link>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {metricRows(run).map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">{renderOutput(run)}</div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Sources used</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sourceList(run).map((source) => (
            <span
              key={source}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            >
              {source}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Action log</p>
        <div className="mt-2 space-y-2">
          {run.actions.map((action) => (
            <div
              key={`${action.tool}-${JSON.stringify(action.output)}`}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-800">{action.tool}</span>
              <span className="text-slate-500">{action.status}</span>
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
  const [loading, setLoading] = useState<DemoMode | "compare" | "voice" | null>(null);
  const [naiveRun, setNaiveRun] = useState<AgentRun | undefined>();
  const [brainRun, setBrainRun] = useState<AgentRun | undefined>();
  const [scenario, setScenario] = useState<Scenario | undefined>();
  const [mockText, setMockText] = useState(
    "Hi, checkout is failing for our EU users. Can you help?",
  );
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
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

  async function transcribe() {
    setLoading("voice");
    try {
      const formData = new FormData();
      formData.append("mockText", mockText);
      if (audioFile) formData.append("audio", audioFile);
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { transcript: string };
      setTranscript(result.transcript);
      setTask(`Customer Acme says by voice: "${result.transcript}"`);
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-sm font-semibold uppercase text-teal-700">{displayName}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {displayName} demo
          </h1>
          <textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            className="mt-5 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-4 text-base leading-7 text-slate-900 shadow-sm outline-none focus:border-teal-600"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => runMode("naive")}
              disabled={Boolean(loading)}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading === "naive" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Without middleware
            </button>
            <button
              onClick={() => runMode("company_brain")}
              disabled={Boolean(loading)}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {loading === "company_brain" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              With Company Brain
            </button>
            <button
              onClick={runComparison}
              disabled={Boolean(loading)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading === "compare" ? <Loader2 size={16} className="animate-spin" /> : <Columns3 size={16} />}
              Run Comparison
            </button>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Selected scenario</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {scenario?.title ?? scenarioId}
          </p>
          {summary ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-teal-50 p-3">
                <p className="text-xs text-teal-800">Token reduction</p>
                <p className="mt-1 text-lg font-semibold text-teal-950">{summary.tokenReduction}</p>
              </div>
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-xs text-blue-800">Source precision</p>
                <p className="mt-1 text-lg font-semibold text-blue-950">{summary.precisionGain}</p>
              </div>
              <div className="rounded-md bg-amber-50 p-3">
                <p className="text-xs text-amber-800">Forbidden blocked</p>
                <p className="mt-1 text-lg font-semibold text-amber-950">{summary.blocked}</p>
              </div>
              <div className="rounded-md bg-violet-50 p-3">
                <p className="text-xs text-violet-800">Quality score</p>
                <p className="mt-1 text-lg font-semibold text-violet-950">{summary.qualityGain}</p>
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      {agentRole === "voice_support" ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Voice flow</p>
              <p className="mt-1 text-sm text-slate-600">{transcript || "Mock transcript ready"}</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <FileAudio size={16} />
              Audio file
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={mockText}
              onChange={(event) => setMockText(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600"
            />
            <button
              onClick={transcribe}
              disabled={Boolean(loading)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading === "voice" ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
              Transcribe
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <RunColumn title="Baseline run" run={naiveRun} />
        <RunColumn title="Middleware run" run={brainRun} />
      </div>
    </div>
  );
}
