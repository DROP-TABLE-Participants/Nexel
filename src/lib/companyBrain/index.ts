import { chunkArtifacts } from "@/lib/companyBrain/chunking";
import { embedChunks } from "@/lib/companyBrain/embeddings";
import { getGmailAdapter } from "@/lib/connectors/gmail";
import { getGoogleDriveAdapter } from "@/lib/connectors/googleDrive";
import { getNotionAdapter } from "@/lib/connectors/notion";
import { listErpArtifacts } from "@/lib/connectors/tefteroErp";
import type { Artifact, Chunk } from "@/lib/types";

export type IngestResult = {
  artifacts: Artifact[];
  chunks: Chunk[];
};

export async function ingestArtifacts(): Promise<IngestResult> {
  const gmail = getGmailAdapter();
  const notion = getNotionAdapter();
  const drive = getGoogleDriveAdapter();
  const artifacts = [
    ...(await notion.listInvoiceArtifacts()),
    ...(await drive.listKnowledgeDocs()),
    ...(await listErpArtifacts()),
    ...((await gmail.listRecentEmails?.()) ?? []),
  ];

  const chunks = await embedChunks(chunkArtifacts(artifacts));
  return { artifacts, chunks };
}
