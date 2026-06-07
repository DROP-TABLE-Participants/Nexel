import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { getRunById } from "@/lib/runs";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const run = await getRunById(id);

  if (!run) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600">
          <ArrowLeft size={16} /> Home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">Run not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600">
        <ArrowLeft size={16} /> Dashboard
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-teal-700">{run.agentRole}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">
            {run.mode === "naive" ? "Without middleware" : "With Company Brain"}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">{run.task}</p>
        </div>
        <p className="text-sm text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total tokens", run.metrics.totalTokens],
          ["Source precision", `${Math.round(run.metrics.sourcePrecision * 100)}%`],
          ["Forbidden returned", run.metrics.forbiddenSourcesReturned],
          ["Quality score", run.metrics.qualityScore],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Retrieved context</h2>
          <JsonBlock value={run.context} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Final output</h2>
          <JsonBlock value={run.output} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Actions</h2>
          <JsonBlock value={run.actions} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Metrics</h2>
          <JsonBlock value={run.metrics} />
        </div>
      </section>
    </main>
  );
}
