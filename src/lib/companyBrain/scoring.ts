import type { Chunk, RetrievedSource } from "@/lib/types";

export function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export function estimateTokens(input: string) {
  return Math.max(1, Math.ceil(input.length / 4));
}

export function hashToken(token: string) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function fakeEmbedding(text: string, dimensions = 64) {
  const vector = new Array<number>(dimensions).fill(0);
  for (const token of tokenize(text)) {
    const hash = hashToken(token);
    const index = hash % dimensions;
    vector[index] += 1 + (hash % 7) / 10;
  }
  return normalizeVector(vector);
}

export function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let score = 0;
  for (let index = 0; index < length; index += 1) {
    score += a[index] * b[index];
  }
  return score;
}

export function entityOverlap(queryEntities: string[], sourceEntities: string[]) {
  const sourceSet = new Set(sourceEntities.map((entity) => entity.toLowerCase()));
  return queryEntities.filter((entity) => sourceSet.has(entity.toLowerCase())).length;
}

export function sourceFromChunk(chunk: Chunk, relevance: number): RetrievedSource {
  return {
    chunkId: chunk.id,
    artifactId: chunk.artifactId,
    title: chunk.metadata.title,
    connector: chunk.metadata.connector,
    sourceType: chunk.metadata.sourceType,
    department: chunk.metadata.department,
    sensitivity: chunk.metadata.sensitivity,
    relevance,
    text: chunk.text,
  };
}
