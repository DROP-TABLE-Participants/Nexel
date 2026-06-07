import type { Artifact, Chunk } from "@/lib/types";

function flattenEntities(artifact: Artifact) {
  return Object.values(artifact.entities).flat().filter(Boolean) as string[];
}

export function chunkArtifacts(artifacts: Artifact[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const artifact of artifacts) {
    const normalized = artifact.text.replace(/\s+/g, " ").trim();
    const chunkSize = 1000;
    const overlap = 100;

    if (normalized.length <= chunkSize) {
      chunks.push({
        id: `${artifact.id}#chunk_0`,
        artifactId: artifact.id,
        text: normalized,
        metadata: {
          connector: artifact.connector,
          sourceType: artifact.sourceType,
          title: artifact.title,
          allowedAgents: artifact.access.allowedAgents,
          sensitivity: artifact.access.sensitivity,
          department: artifact.access.department,
          entities: flattenEntities(artifact),
        },
      });
      continue;
    }

    for (let start = 0; start < normalized.length; start += chunkSize - overlap) {
      const end = Math.min(start + chunkSize, normalized.length);
      chunks.push({
        id: `${artifact.id}#chunk_${chunks.length}`,
        artifactId: artifact.id,
        text: normalized.slice(start, end),
        metadata: {
          connector: artifact.connector,
          sourceType: artifact.sourceType,
          title: artifact.title,
          allowedAgents: artifact.access.allowedAgents,
          sensitivity: artifact.access.sensitivity,
          department: artifact.access.department,
          entities: flattenEntities(artifact),
        },
      });
    }
  }

  return chunks;
}
