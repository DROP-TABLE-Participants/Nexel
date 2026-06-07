import { chunkArtifacts } from "@/lib/companyBrain/chunking";
import { embedChunks } from "@/lib/companyBrain/embeddings";
import { getGmailAdapter } from "@/lib/connectors/gmail";
import { getGoogleDriveAdapter } from "@/lib/connectors/googleDrive";
import { listLocalMockArtifacts } from "@/lib/connectors/localMock";
import { listErpArtifacts } from "@/lib/connectors/tefteroErp";
import type { Artifact, Chunk } from "@/lib/types";

export type IngestResult = {
  artifacts: Artifact[];
  chunks: Chunk[];
};

export async function ingestArtifacts(): Promise<IngestResult> {
  const drive = getGoogleDriveAdapter();
  const gmail = getGmailAdapter();
  const artifacts = [
    ...(await drive.listKnowledgeDocs()),
    ...(await listErpArtifacts()),
    ...(await listLocalMockArtifacts()),
    ...((await gmail.listRecentEmails?.()) ?? []),
  ];

  const chunks = await embedChunks(chunkArtifacts(artifacts));
  return { artifacts, chunks };
}
