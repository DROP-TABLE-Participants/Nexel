import { ingestArtifacts } from "@/lib/companyBrain";

export async function POST() {
  const { artifacts, chunks } = await ingestArtifacts();
  return Response.json({
    artifactCount: artifacts.length,
    chunkCount: chunks.length,
    connectors: Array.from(new Set(artifacts.map((artifact) => artifact.connector))),
  });
}
