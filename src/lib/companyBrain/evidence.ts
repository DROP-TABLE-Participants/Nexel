import type { AgentPolicy, EvidencePack, RetrievedSource } from "@/lib/types";

function firstSentence(text: string) {
  return text.split(/[.!?]/).find((part) => part.trim().length > 20)?.trim() ?? text.slice(0, 140);
}

export function buildEvidencePack(input: {
  policy: AgentPolicy;
  task: string;
  resolvedEntities: Record<string, string[]>;
  sources: RetrievedSource[];
  blockedSources: EvidencePack["blockedSources"];
}): EvidencePack {
  const sourceTitles = input.sources.map((source) => source.title).join(", ");
  const facts = input.sources.slice(0, input.policy.maxSources).map((source) => ({
    claim: firstSentence(source.text),
    sourceId: source.artifactId,
    sourceTitle: source.title,
    confidence: Math.min(0.95, 0.65 + source.relevance / 3),
  }));

  const sourceText = input.sources.map((source) => source.text.toLowerCase()).join("\n");
  const missingInfo = input.policy.requiredContextTypes.filter((contextType) => {
    const importantWords = contextType
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    return !importantWords.some((word) => sourceText.includes(word));
  });

  return {
    mode: "company_brain",
    agentRole: input.policy.role,
    task: input.task,
    resolvedEntities: input.resolvedEntities,
    requiredContext: input.policy.requiredContextTypes,
    summary: `Company Brain selected ${input.sources.length} scoped sources for ${input.policy.displayName}: ${sourceTitles || "no matching source"}.`,
    facts,
    recommendedActions: input.policy.allowedActions.slice(0, 4),
    sources: input.sources.map((source) => ({
      id: source.artifactId,
      title: source.title,
      connector: source.connector,
      sourceType: source.sourceType,
      relevance: Number(source.relevance.toFixed(3)),
    })),
    blockedSources: input.blockedSources,
    missingInfo,
  };
}
