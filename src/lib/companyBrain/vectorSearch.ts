import { embedText } from "@/lib/companyBrain/embeddings";
import {
  cosineSimilarity,
  entityOverlap,
  sourceFromChunk,
} from "@/lib/companyBrain/scoring";
import type { AgentRole, Artifact, Chunk, ConnectorName, RetrievedSource } from "@/lib/types";

export type VectorFilters = {
  agentRole?: AgentRole;
  connectors?: ConnectorName[];
  departments?: Artifact["access"]["department"][];
  sensitivity?: Artifact["access"]["sensitivity"][];
  forbiddenSourceTypes?: Artifact["sourceType"][];
  entities?: string[];
};

function passesFilters(chunk: Chunk, filters: VectorFilters) {
  if (
    filters.agentRole &&
    !chunk.metadata.allowedAgents.includes(filters.agentRole)
  ) {
    return false;
  }
  if (filters.connectors && !filters.connectors.includes(chunk.metadata.connector)) {
    return false;
  }
  if (filters.departments && !filters.departments.includes(chunk.metadata.department)) {
    return false;
  }
  if (filters.sensitivity && !filters.sensitivity.includes(chunk.metadata.sensitivity)) {
    return false;
  }
  if (
    filters.forbiddenSourceTypes &&
    filters.forbiddenSourceTypes.includes(chunk.metadata.sourceType)
  ) {
    return false;
  }
  return true;
}

export async function vectorSearch(input: {
  query: string;
  chunks: Chunk[];
  filters?: VectorFilters;
  topK: number;
}): Promise<RetrievedSource[]> {
  const queryEmbedding = await embedText(input.query);
  const filters = input.filters ?? {};
  const entityTerms = filters.entities ?? [];

  return input.chunks
    .filter((chunk) => passesFilters(chunk, filters))
    .map((chunk) => {
      const vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding ?? []);
      const overlapBoost = entityOverlap(entityTerms, chunk.metadata.entities) * 0.18;
      const titleBoost = input.query
        .toLowerCase()
        .includes(chunk.metadata.title.toLowerCase())
        ? 0.12
        : 0;
      return sourceFromChunk(chunk, vectorScore + overlapBoost + titleBoost);
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, input.topK);
}
