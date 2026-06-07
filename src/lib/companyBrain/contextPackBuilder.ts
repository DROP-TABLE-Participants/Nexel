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

const invoiceSourceTypes = new Set(["notion_invoice", "erp_invoice"]);
const entityBoundSourceTypes = new Set([
  "notion_invoice",
  "notion_customer",
  "erp_invoice",
  "erp_customer",
  "drive_doc",
  "policy",
]);

function isEmailRequest(requestLower: string) {
  return (
    requestLower.includes("email") ||
    requestLower.includes("draft") ||
    requestLower.includes("reminder")
  );
}

function hasWord(text: string, word: string) {
  return new RegExp(`(^|[^a-z0-9])${word}($|[^a-z0-9])`).test(text);
}

function isClosureRequest(requestLower: string) {
  return (
    requestLower.includes("close") ||
    requestLower.includes("mark") ||
    hasWord(requestLower, "paid") ||
    requestLower.includes("payment received") ||
    requestLower.includes("closure")
  );
}

function isReportRequest(requestLower: string) {
  return (
    requestLower.includes("report") ||
    requestLower.includes("rows") ||
    requestLower.includes("excel") ||
    requestLower.includes("spreadsheet")
  );
}

function driveWorkflowMismatch(chunk: Chunk, requestLower: string) {
  if (chunk.metadata.connector !== "google_drive") return null;
  const title = chunk.metadata.title.toLowerCase();

  if (title.includes("email") && !isEmailRequest(requestLower)) {
    return "drive guidance outside request";
  }
  if (title.includes("closure") && !isClosureRequest(requestLower)) {
    return "drive guidance outside request";
  }
  if (title.includes("report") && !isReportRequest(requestLower)) {
    return "drive guidance outside request";
  }
  return null;
}

function hardFilterReason(
  role: AgentRole,
  policy: AgentPolicy,
  chunk: Chunk,
  entityTerms: string[] = [],
  requestText = "",
) {
  const sourceEntities = chunk.metadata.entities.map((entity) => entity.toLowerCase());
  const requestedEntities = entityTerms.map((entity) => entity.toLowerCase());
  const requestLower = requestText.toLowerCase();
  const chunkLower = chunk.text.toLowerCase();

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
  const driveMismatch = driveWorkflowMismatch(chunk, requestLower);
  if (driveMismatch) return driveMismatch;
  if (
    chunk.metadata.connector === "notion" &&
    chunk.metadata.sourceType === "notion_template" &&
    !isEmailRequest(requestLower)
  ) {
    return "template outside request";
  }
  if (
    invoiceSourceTypes.has(chunk.metadata.sourceType) &&
    requestLower.includes("unpaid") &&
    !chunkLower.includes("status: unpaid")
  ) {
    return "invoice status outside request";
  }
  if (
    entityBoundSourceTypes.has(chunk.metadata.sourceType) &&
    sourceEntities.length > 0 &&
    requestedEntities.length > 0 &&
    !sourceEntities.some((entity) => requestedEntities.includes(entity))
  ) {
    return "unrelated invoice entity";
  }
  return null;
}

function uniqueBlockedSources(
  chunks: Chunk[],
  role: AgentRole,
  policy: AgentPolicy,
  entityTerms: string[],
  requestText: string,
): EvidencePack["blockedSources"] {
  const seen = new Set<string>();
  const blocked: EvidencePack["blockedSources"] = [];

  for (const chunk of chunks) {
    const reason = hardFilterReason(role, policy, chunk, entityTerms, requestText);
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
  const requestText = `${input.task} ${input.query}`;
  const blockedSources = uniqueBlockedSources(
    chunks,
    input.agentRole,
    policy,
    entityTerms,
    requestText,
  );
  const scopedChunks = chunks.filter(
    (chunk) => !hardFilterReason(input.agentRole, policy, chunk, entityTerms, requestText),
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
