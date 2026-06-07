import { estimateTokens } from "@/lib/companyBrain/scoring";
import { estimateCostUsd } from "@/lib/telemetry/pricing";
import type {
  AgentAction,
  AgentModelUsage,
  DemoMode,
  EvidencePack,
  RetrievedSource,
  RunMetrics,
  Scenario,
} from "@/lib/types";

function normalizeSourceId(id: string) {
  if (id === "erp:invoice_acme_1007") return "erp:invoice_inv_1007";
  if (id === "drive:sales_sdr_template") return "drive:approved_sdr_template";
  if (id === "drive:finance_collection_template") return "drive:payment_terms_policy";
  return id;
}

function asLowerText(value: unknown) {
  return JSON.stringify(value).toLowerCase();
}

function agentFacingContextText(context: string | EvidencePack) {
  if (typeof context === "string") return context;
  return JSON.stringify({
    summary: context.summary,
    facts: context.facts.map((fact) => ({
      claim: fact.claim,
      sourceId: fact.sourceId,
    })),
    recommendedActions: context.recommendedActions,
    sources: context.sources.map((source) => ({
      id: source.id,
      title: source.title,
    })),
    missingInfo: context.missingInfo,
  });
}

function meaningfulWords(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !["the", "and", "for", "that"].includes(word));
}

function factMatches(fact: string, outputText: string) {
  const words = meaningfulWords(fact);
  const required = Math.max(1, Math.ceil(words.length * 0.45));
  const matched = words.filter((word) => outputText.includes(word)).length;
  return matched >= required;
}

function completedExpectedActions(actions: AgentAction[], scenario: Scenario) {
  const completed = new Set(
    actions
      .filter((action) => action.status === "success" || action.status === "mocked")
      .map((action) => action.tool),
  );
  return scenario.expectedActions.filter((action) => completed.has(action)).length;
}

export function evaluateRun(input: {
  scenario: Scenario;
  mode: DemoMode;
  context: string | EvidencePack;
  output: Record<string, unknown>;
  sources: RetrievedSource[];
  actions: AgentAction[];
  usage?: AgentModelUsage;
  runtimeMs: number;
}): RunMetrics {
  const expectedSources = new Set(input.scenario.expectedSources.map(normalizeSourceId));
  const forbiddenSources = new Set(input.scenario.forbiddenSources.map(normalizeSourceId));
  const returnedSourceIds = input.sources.map((source) => normalizeSourceId(source.artifactId));
  const blockedSourceIds =
    typeof input.context === "string"
      ? []
      : input.context.blockedSources.map((source) => normalizeSourceId(source.id));

  const sourcesRetrieved = returnedSourceIds.length;
  const relevantSources = returnedSourceIds.filter((id) => expectedSources.has(id)).length;
  const forbiddenSourcesReturned = returnedSourceIds.filter((id) =>
    forbiddenSources.has(id),
  ).length;
  const forbiddenSourcesBlocked = blockedSourceIds.filter((id) =>
    forbiddenSources.has(id),
  ).length;
  const sourcePrecision = sourcesRetrieved ? relevantSources / sourcesRetrieved : 0;

  const outputText = asLowerText(input.output);
  const matchedFacts = input.scenario.expectedFacts.filter((fact) =>
    factMatches(fact, outputText),
  ).length;
  const expectedFactsScore = input.scenario.expectedFacts.length
    ? matchedFacts / input.scenario.expectedFacts.length
    : 1;
  const actionSuccessRate = input.scenario.expectedActions.length
    ? completedExpectedActions(input.actions, input.scenario) /
      input.scenario.expectedActions.length
    : 1;
  const noForbiddenLeakageScore = forbiddenSourcesReturned === 0 ? 1 : 0;
  const outputFormatScore =
    input.output && typeof input.output === "object" && !Array.isArray(input.output) ? 1 : 0;

  const contextText = agentFacingContextText(input.context);
  const outputJson = JSON.stringify(input.output);
  const inputTokens = input.usage?.inputTokens ?? estimateTokens(contextText);
  const outputTokens = input.usage?.outputTokens ?? estimateTokens(outputJson);
  const totalTokens = input.usage?.totalTokens ?? inputTokens + outputTokens;
  const estimatedCostUsd = estimateCostUsd({ inputTokens, outputTokens, totalTokens });

  const qualityScore =
    25 * sourcePrecision +
    25 * expectedFactsScore +
    30 * actionSuccessRate +
    10 * noForbiddenLeakageScore +
    10 * outputFormatScore;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd,
    contextCharacters: contextText.length,
    sourcesRetrieved,
    relevantSources,
    forbiddenSourcesReturned,
    forbiddenSourcesBlocked,
    sourcePrecision,
    actionSuccessRate,
    qualityScore: Number(qualityScore.toFixed(1)),
    runtimeMs: input.runtimeMs,
    tokenUsageKind: input.usage?.totalTokens ? "measured" : "estimated",
  };
}
