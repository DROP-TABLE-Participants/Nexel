import { ingestArtifacts } from "@/lib/companyBrain";
import { buildEvidencePack } from "@/lib/companyBrain/evidence";
import {
  flattenResolvedEntities,
  inferQueryForAgent,
  resolveEntities,
} from "@/lib/companyBrain/entityResolver";
import { vectorSearch } from "@/lib/companyBrain/vectorSearch";
import { getEffectivePolicy } from "@/lib/permissions";
import type { AgentPolicy, AgentRole, Chunk, EvidencePack } from "@/lib/types";

function hardFilterReason(
  role: AgentRole,
  policy: AgentPolicy,
  chunk: Chunk,
  entityTerms: string[] = [],
) {
  const sourceEntities = chunk.metadata.entities.map((entity) => entity.toLowerCase());
  const requestedEntities = entityTerms.map((entity) => entity.toLowerCase());

  if (!chunk.metadata.allowedAgents.includes(role)) return "agent not allowed";
  if (!policy.allowedConnectors.includes(chunk.metadata.connector)) {
    return "connector outside policy";
  }
  if (!policy.allowedDepartments.includes(chunk.metadata.department)) {
    return "department outside policy";
  }
  if (!policy.allowedSensitivity.includes(chunk.metadata.sensitivity)) {
    return "sensitivity outside policy";
  }
  if (policy.forbiddenSourceTypes.includes(chunk.metadata.sourceType)) {
    return "source type forbidden";
  }
  if (
    chunk.metadata.connector === "teftero_erp" &&
    sourceEntities.length > 0 &&
    requestedEntities.length > 0 &&
    !sourceEntities.some((entity) => requestedEntities.includes(entity))
  ) {
    return "unrelated ERP entity";
  }
  return null;
}

function uniqueBlockedSources(
  chunks: Chunk[],
  role: AgentRole,
  policy: AgentPolicy,
  entityTerms: string[],
): EvidencePack["blockedSources"] {
  const seen = new Set<string>();
  const blocked: EvidencePack["blockedSources"] = [];

  for (const chunk of chunks) {
    const reason = hardFilterReason(role, policy, chunk, entityTerms);
    if (!reason || seen.has(chunk.artifactId)) continue;
    seen.add(chunk.artifactId);
    blocked.push({
      id: chunk.artifactId,
      title: chunk.metadata.title,
      reason,
    });
  }

  return blocked;
}

export async function getContextPack(input: {
  agentRole: AgentRole;
  task: string;
  query: string;
  entities?: Record<string, string[]>;
}) {
  const policy = await getEffectivePolicy(input.agentRole);
  const { chunks } = await ingestArtifacts();
  const resolvedEntities = resolveEntities(`${input.task} ${input.query}`, input.entities);
  const entityTerms = flattenResolvedEntities(resolvedEntities);
  const blockedSources = uniqueBlockedSources(chunks, input.agentRole, policy, entityTerms);
  const scopedChunks = chunks.filter(
    (chunk) => !hardFilterReason(input.agentRole, policy, chunk, entityTerms),
  );
  const sources = await vectorSearch({
    query: inferQueryForAgent(input.agentRole, `${input.task} ${input.query}`),
    chunks: scopedChunks,
    topK: policy.maxSources,
    filters: {
      agentRole: input.agentRole,
      connectors: policy.allowedConnectors,
      departments: policy.allowedDepartments,
      sensitivity: policy.allowedSensitivity,
      forbiddenSourceTypes: policy.forbiddenSourceTypes,
      entities: entityTerms,
    },
  });

  return buildEvidencePack({
    policy,
    task: input.task,
    resolvedEntities,
    sources,
    blockedSources,
  });
}
