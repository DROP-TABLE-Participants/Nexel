import { getContextPack } from "@/lib/companyBrain/contextPackBuilder";
import { getNaiveContext } from "@/lib/companyBrain/naiveRetriever";
import { evaluateRun } from "@/lib/evaluation";
import { runInvoiceOperationsAgent } from "@/lib/agents/invoiceOperationsAgent";
import { executeToolActions } from "@/lib/agents/tools";
import { getScenario } from "@/lib/scenarios";
import { saveRun } from "@/lib/runs";
import type {
  AgentRole,
  AgentRun,
  DemoMode,
  EvidencePack,
  RetrievedSource,
  Scenario,
} from "@/lib/types";

async function executeAgent(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: Awaited<ReturnType<typeof getNaiveContext>>["sources"];
}) {
  return runInvoiceOperationsAgent(input);
}

export async function runAgent(input: {
  agentRole: AgentRole;
  mode: DemoMode;
  scenarioId: string;
  task?: string;
  input?: Record<string, unknown>;
}): Promise<AgentRun> {
  const startedAt = Date.now();
  const scenario = await getScenario(input.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${input.scenarioId}`);
  if (scenario.agentRole !== input.agentRole) {
    throw new Error(`Scenario ${scenario.id} does not belong to ${input.agentRole}`);
  }

  const task = input.task || scenario.task;
  let context: string | EvidencePack;
  let sources: RetrievedSource[];

  if (input.mode === "naive") {
    const retrieval = await getNaiveContext({
      query: task,
      task,
      agentRole: input.agentRole,
      topK: 20,
    });
    context = retrieval.contextText;
    sources = retrieval.sources;
  } else {
    const retrieval = await getContextPack({
      agentRole: input.agentRole,
      task,
      query: task,
      entities: {},
    });
    context = retrieval;
    sources = retrieval.sources.map((source) => ({
      chunkId: `${source.id}#evidence`,
      artifactId: source.id,
      title: source.title,
      connector: source.connector,
      sourceType: source.sourceType as RetrievedSource["sourceType"],
      department: "general",
      sensitivity: "internal",
      relevance: source.relevance,
      text: source.title,
    }));
  }
  const agentResult = await executeAgent({ scenario, context, sources });
  const actions = await executeToolActions(agentResult.output);
  const metrics = evaluateRun({
    scenario,
    mode: input.mode,
    context,
    output: agentResult.output,
    sources,
    actions,
    usage: agentResult.modelUsage,
    runtimeMs: Date.now() - startedAt,
  });
  const run: AgentRun = {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    scenarioId: scenario.id,
    mode: input.mode,
    agentRole: input.agentRole,
    task,
    context,
    output: agentResult.output,
    actions,
    metrics,
    createdAt: new Date().toISOString(),
  };

  await saveRun(run);
  return run;
}

export async function compareAgent(input: { agentRole: AgentRole; scenarioId: string }) {
  const scenario = await getScenario(input.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${input.scenarioId}`);
  const naive = await runAgent({
    agentRole: input.agentRole,
    mode: "naive",
    scenarioId: input.scenarioId,
    task: scenario.task,
    input: scenario.input,
  });
  const companyBrain = await runAgent({
    agentRole: input.agentRole,
    mode: "company_brain",
    scenarioId: input.scenarioId,
    task: scenario.task,
    input: scenario.input,
  });

  return { scenario, naive, companyBrain };
}
