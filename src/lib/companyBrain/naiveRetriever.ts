import { ingestArtifacts } from "@/lib/companyBrain";
import { inferQueryForAgent, resolveEntities } from "@/lib/companyBrain/entityResolver";
import { vectorSearch } from "@/lib/companyBrain/vectorSearch";
import type { AgentRole } from "@/lib/types";

export async function getNaiveContext(input: {
  query: string;
  task?: string;
  agentRole?: AgentRole;
  topK?: number;
}) {
  const { chunks } = await ingestArtifacts();
  const query =
    input.agentRole && input.task
      ? inferQueryForAgent(input.agentRole, input.query || input.task)
      : input.query;
  const entities = resolveEntities(`${input.query} ${input.task ?? ""}`);
  const sources = await vectorSearch({
    query,
    chunks,
    topK: input.topK ?? 20,
    filters: {
      entities: Object.values(entities).flat(),
    },
  });

  return {
    mode: "naive" as const,
    contextText: sources
      .map((source) => `[${source.artifactId}] ${source.title}\n${source.text}`)
      .join("\n\n"),
    sources,
  };
}
