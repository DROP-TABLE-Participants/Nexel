import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { runAgent } from "@/lib/agents";
import { contextToPrompt } from "@/lib/agents/helpers";
import { getContextPack } from "@/lib/companyBrain/contextPackBuilder";
import { getNaiveContext } from "@/lib/companyBrain/naiveRetriever";
import { estimateTokens } from "@/lib/companyBrain/scoring";
import {
  getEffectivePolicy,
  listAgentPermissions,
  updateAgentPermissions,
} from "@/lib/permissions";
import { defaultScenarioId } from "@/lib/scenarios";
import { compactEvidencePack, toTsonText } from "@/lib/serialization/tson";
import { dataUsageFromEvidencePack, dataUsageFromSources } from "@/lib/telemetry/dataUsage";
import { estimateCostUsd, moneySavedUsd } from "@/lib/telemetry/pricing";
import { recordMcpTelemetry } from "@/lib/telemetry/mcpTelemetry";
import type {
  AgentAction,
  AgentRole,
  AgentRun,
  DemoMode,
  EvidencePack,
  McpCallTelemetry,
  RunMetrics,
} from "@/lib/types";

const agentRoleSchema = z.enum(["sales_outreach", "teftero", "voice_support"]);
const modeSchema = z.enum(["naive", "company_brain"]);
const connectorSchema = z.enum(["gmail", "google_drive", "teftero_erp", "local_mock"]);
const departmentSchema = z.enum([
  "sales",
  "support",
  "erp",
  "finance",
  "general",
  "restricted",
]);
const sensitivitySchema = z.enum([
  "public",
  "internal",
  "customer_safe",
  "finance",
  "restricted",
]);
const sourceTypeSchema = z.enum([
  "email",
  "drive_doc",
  "erp_customer",
  "erp_invoice",
  "erp_task",
  "voice_transcript",
  "policy",
  "template",
  "restricted_doc",
]);

function callId() {
  return `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function jsonToolResult(data: Record<string, unknown>, contentText?: string) {
  return {
    structuredContent: data,
    content: [
      {
        type: "text" as const,
        text: contentText ?? JSON.stringify(data),
      },
    ],
  };
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function definedRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== ""),
  );
}

function compactDraft(value: unknown) {
  const draft = objectValue(value);
  return definedRecord({
    sub: draft.subject,
    body: draft.body,
  });
}

function compactTask(value: unknown) {
  const task = objectValue(value);
  return definedRecord({
    t: task.title,
    d: task.description,
    p: task.priority,
  });
}

function compactAgentOutput(output: Record<string, unknown>) {
  const compact: Record<string, unknown> = {};

  if (output.summary) compact.s = output.summary;
  if (output.transcript) compact.tr = output.transcript;
  if (output.classification) compact.cls = output.classification;
  if (output.recommendedAction) compact.rec = output.recommendedAction;
  if (output.crmNote) compact.crm = output.crmNote;
  if (output.followUpTask) compact.fu = output.followUpTask;
  if (output.emailDraft) compact.e = compactDraft(output.emailDraft);
  if (output.replyDraft) compact.reply = compactDraft(output.replyDraft);
  if (output.erpTask) compact.task = compactTask(output.erpTask);
  if (output.voiceResponseText) compact.voice = output.voiceResponseText;
  if (output.findings) compact.f = output.findings;
  if (output.usedSources) compact.src = output.usedSources;
  if (output.confidence) compact.conf = output.confidence;

  return Object.keys(compact).length > 0 ? compact : output;
}

function compactActions(actions: AgentAction[]) {
  return actions.map((action) => ({
    t: action.tool,
    s: action.status,
  }));
}

function compactMetrics(metrics: RunMetrics) {
  return {
    it: metrics.inputTokens,
    ot: metrics.outputTokens,
    tt: metrics.totalTokens,
    k: metrics.tokenUsageKind,
    sp: Number(metrics.sourcePrecision.toFixed(2)),
    leak: metrics.forbiddenSourcesReturned,
    blk: metrics.forbiddenSourcesBlocked,
    q: Number(metrics.qualityScore.toFixed(1)),
  };
}

function compactTelemetry(telemetry: McpCallTelemetry) {
  return {
    id: telemetry.id,
    u: definedRecord({
      it: telemetry.usage.inputTokens ?? 0,
      ot: telemetry.usage.outputTokens ?? 0,
      tt: telemetry.usage.totalTokens,
      k: telemetry.usage.tokenUsageKind,
      base: telemetry.usage.baselineTokens,
      save: telemetry.usage.moneySavedUsd,
    }),
    du: telemetry.dataUsed.map((source) => ({
      s: source.sourceId,
      tok: source.estimatedTokens,
    })),
    b: telemetry.blockedSources.length,
  };
}

function scopedContextText(pack: EvidencePack, telemetry?: McpCallTelemetry) {
  const compact: Record<string, unknown> = {
    m: "company_brain",
    ctx: compactEvidencePack(pack),
    b: pack.blockedSources.length,
  };
  if (telemetry) compact.tel = compactTelemetry(telemetry);

  return `MCP TSON keys: m=mode, ctx={f[{c,s}],src,act,miss}, b=blocked source count, tel=telemetry.\n${toTsonText(
    compact,
    "compact scoped MCP context JSON",
  )}`;
}

function demoRunText(run: AgentRun, telemetry?: McpCallTelemetry) {
  if (typeof run.context === "string") return undefined;

  const compact: Record<string, unknown> = {
    r: run.id,
    m: run.mode,
    out: compactAgentOutput(run.output),
    act: compactActions(run.actions),
    met: compactMetrics(run.metrics),
    ctx: compactEvidencePack(run.context),
    b: run.context.blockedSources.length,
  };
  if (telemetry) compact.tel = compactTelemetry(telemetry);

  return `RUN TSON keys: r=run id, m=mode, out=agent output, act=actions, met=metrics, ctx=scoped context, b=blocked count.\n${toTsonText(
    compact,
    "compact demo run MCP JSON",
  )}`;
}

function redactEvidencePackForClient(pack: EvidencePack) {
  return {
    ...pack,
    blockedSources: [],
    blockedSourceCount: pack.blockedSources.length,
  };
}

function redactOutputForClient(output: Record<string, unknown>) {
  const redacted = { ...output };
  if (redacted.evidencePack && typeof redacted.evidencePack === "object") {
    redacted.evidencePack = redactEvidencePackForClient(redacted.evidencePack as EvidencePack);
  }
  if (Array.isArray(redacted.blockedSources)) {
    redacted.blockedSourceCount = redacted.blockedSources.length;
    delete redacted.blockedSources;
  }
  return redacted;
}

function redactTelemetryForClient(telemetry: McpCallTelemetry) {
  return {
    ...telemetry,
    output: redactOutputForClient(telemetry.output),
    blockedSourceCount: telemetry.blockedSources.length,
    blockedSources: [],
  };
}

async function recordContextTelemetry(input: {
  toolName: string;
  clientName: string;
  agentRole: AgentRole;
  mode: DemoMode;
  task: string;
  request: Record<string, unknown>;
  output: Record<string, unknown>;
  totalTokens: number;
  baselineTokens?: number;
  dataUsed: McpCallTelemetry["dataUsed"];
  blockedSources: McpCallTelemetry["blockedSources"];
}) {
  const policy = await getEffectivePolicy(input.agentRole);
  const scopedUsage = {
    inputTokens: input.totalTokens,
    outputTokens: 0,
    totalTokens: input.totalTokens,
  };
  const baselineUsage = {
    inputTokens: input.baselineTokens ?? input.totalTokens,
    outputTokens: 0,
    totalTokens: input.baselineTokens ?? input.totalTokens,
  };

  return recordMcpTelemetry({
    id: callId(),
    toolName: input.toolName,
    clientName: input.clientName,
    agentRole: input.agentRole,
    mode: input.mode,
    task: input.task,
    input: input.request,
    output: input.output,
    usage: {
      ...scopedUsage,
      tokenUsageKind: "estimated",
      estimatedCostUsd: estimateCostUsd(scopedUsage),
      baselineTokens: baselineUsage.totalTokens,
      baselineCostUsd: estimateCostUsd(baselineUsage),
      moneySavedUsd: moneySavedUsd(baselineUsage, scopedUsage),
    },
    dataUsed: input.dataUsed,
    blockedSources: input.blockedSources,
    permissionSnapshot: policy,
    createdAt: new Date().toISOString(),
  });
}

export function createCompanyBrainMcpServer() {
  const server = new McpServer({
    name: "company-brain-middleware",
    version: "0.2.0",
  });

  server.registerTool(
    "get_company_context",
    {
      title: "Get Company Brain context",
      description:
        "Returns either naive broad context or Company Brain scoped context for a client profile. Every call is persisted with usage, sources, permissions, blocked data, and money-saved telemetry.",
      inputSchema: {
        agentRole: agentRoleSchema.describe("Client profile requesting data."),
        task: z.string().min(1).describe("The end-user task or question."),
        query: z.string().optional().describe("Optional retrieval query override."),
        mode: modeSchema.default("company_brain"),
        clientName: z
          .string()
          .optional()
          .describe("Calling chatbot/client name, for example ChatGPT or Claude."),
        includeTelemetry: z
          .boolean()
          .default(false)
          .describe("Include full call telemetry in the tool response. Persisted telemetry is always recorded."),
      },
    },
    async ({ agentRole, task, query, mode, clientName, includeTelemetry }) => {
      const request = { agentRole, task, query, mode, clientName, includeTelemetry };

      if (mode === "naive") {
        const naive = await getNaiveContext({
          agentRole,
          task,
          query: query || task,
          topK: 20,
        });
        const totalTokens = estimateTokens(naive.contextText);
        const output = {
          mode,
          context: naive.contextText,
          sources: naive.sources.map((source) => ({
            id: source.artifactId,
            title: source.title,
            connector: source.connector,
            sourceType: source.sourceType,
            sensitivity: source.sensitivity,
          })),
        };
        const telemetry = await recordContextTelemetry({
          toolName: "get_company_context",
          clientName: clientName || "unknown_mcp_client",
          agentRole,
          mode,
          task,
          request,
          output,
          totalTokens,
          dataUsed: dataUsageFromSources(naive.sources),
          blockedSources: [],
        });
        return jsonToolResult(includeTelemetry ? { ...output, telemetry } : output);
      }

      const [pack, naive] = await Promise.all([
        getContextPack({
          agentRole,
          task,
          query: query || task,
          entities: {},
        }),
        getNaiveContext({
          agentRole,
          task,
          query: query || task,
          topK: 20,
        }),
      ]);
      const contextText = contextToPrompt(pack);
      const totalTokens = estimateTokens(contextText);
      const baselineTokens = estimateTokens(naive.contextText);
      const evidencePack = redactEvidencePackForClient(pack);
      const output = {
        mode,
        evidencePack,
        sources: pack.sources,
        blockedSourceCount: pack.blockedSources.length,
      };
      const telemetry = await recordContextTelemetry({
        toolName: "get_company_context",
        clientName: clientName || "unknown_mcp_client",
        agentRole,
        mode,
        task,
        request,
        output,
        totalTokens,
        baselineTokens,
        dataUsed: dataUsageFromEvidencePack(pack),
        blockedSources: pack.blockedSources,
      });
      const response = includeTelemetry
        ? { ...output, telemetry: redactTelemetryForClient(telemetry) }
        : output;
      return jsonToolResult(
        response,
        scopedContextText(pack, includeTelemetry ? telemetry : undefined),
      );
    },
  );

  server.registerTool(
    "run_demo_agent",
    {
      title: "Run demo agent",
      description:
        "Runs one of the built-in demo profiles to compare downstream behavior. Use get_company_context for normal chatbot context retrieval.",
      inputSchema: {
        agentRole: agentRoleSchema,
        mode: modeSchema.default("company_brain"),
        scenarioId: z.string().optional(),
        task: z.string().optional(),
        clientName: z.string().optional(),
        includeTelemetry: z.boolean().default(false),
      },
    },
    async ({ agentRole, mode, scenarioId, task, clientName, includeTelemetry }) => {
      const run = await runAgent({
        agentRole,
        mode,
        scenarioId: scenarioId || defaultScenarioId(agentRole),
        task,
      });
      const dataUsed =
        typeof run.context === "string" ? [] : dataUsageFromEvidencePack(run.context);
      const policy = await getEffectivePolicy(agentRole);
      const telemetry = await recordMcpTelemetry({
        id: callId(),
        toolName: "run_demo_agent",
        clientName: clientName || "unknown_mcp_client",
        agentRole,
        mode,
        scenarioId: run.scenarioId,
        task: run.task,
        input: { agentRole, mode, scenarioId, task, clientName, includeTelemetry },
        output: { runId: run.id, output: run.output },
        usage: {
          inputTokens: run.metrics.inputTokens,
          outputTokens: run.metrics.outputTokens,
          totalTokens: run.metrics.totalTokens,
          tokenUsageKind: run.metrics.tokenUsageKind,
          estimatedCostUsd: run.metrics.estimatedCostUsd ?? 0,
          moneySavedUsd: 0,
        },
        dataUsed,
        blockedSources: typeof run.context === "string" ? [] : run.context.blockedSources,
        permissionSnapshot: policy,
        createdAt: new Date().toISOString(),
      });
      const clientRun =
        typeof run.context === "string"
          ? run
          : {
              ...run,
              context: redactEvidencePackForClient(run.context),
            };
      const response = {
        run: clientRun,
        ...(includeTelemetry ? { telemetry: redactTelemetryForClient(telemetry) } : {}),
      };
      return jsonToolResult(
        response,
        typeof clientRun.context === "string"
          ? JSON.stringify(response)
          : demoRunText(run, includeTelemetry ? telemetry : undefined),
      );
    },
  );

  server.registerTool(
    "list_agent_permissions",
    {
      title: "List agent permissions",
      description: "Lists persisted permission profiles used by Company Brain filtering.",
      inputSchema: {
        clientName: z.string().optional(),
      },
    },
    async ({ clientName }) => {
      const permissions = await listAgentPermissions();
      await recordMcpTelemetry({
        id: callId(),
        toolName: "list_agent_permissions",
        clientName: clientName || "unknown_mcp_client",
        agentRole: "system",
        task: "List agent permissions",
        input: { clientName },
        output: { count: permissions.length },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          tokenUsageKind: "estimated",
          estimatedCostUsd: 0,
          moneySavedUsd: 0,
        },
        dataUsed: [],
        blockedSources: [],
        permissionSnapshot: { roles: permissions.map((permission) => permission.role) },
        createdAt: new Date().toISOString(),
      });
      return jsonToolResult({ permissions });
    },
  );

  server.registerTool(
    "update_agent_permissions",
    {
      title: "Update agent permissions",
      description:
        "Restricts what a client profile can retrieve. Omitted fields keep their current values.",
      inputSchema: {
        agentRole: agentRoleSchema,
        allowedConnectors: z.array(connectorSchema).optional(),
        allowedDepartments: z.array(departmentSchema).optional(),
        allowedSensitivity: z.array(sensitivitySchema).optional(),
        forbiddenSourceTypes: z.array(sourceTypeSchema).optional(),
        allowedActions: z.array(z.string()).optional(),
        maxSources: z.number().int().min(1).max(20).optional(),
        maxContextTokens: z.number().int().min(200).max(20_000).optional(),
        clientName: z.string().optional(),
      },
    },
    async ({ agentRole, clientName, ...patch }) => {
      const permissions = await updateAgentPermissions(agentRole, patch);
      await recordMcpTelemetry({
        id: callId(),
        toolName: "update_agent_permissions",
        clientName: clientName || "unknown_mcp_client",
        agentRole,
        task: `Update permissions for ${agentRole}`,
        input: { agentRole, clientName, ...patch },
        output: { permissions },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          tokenUsageKind: "estimated",
          estimatedCostUsd: 0,
          moneySavedUsd: 0,
        },
        dataUsed: [],
        blockedSources: [],
        permissionSnapshot: permissions,
        createdAt: new Date().toISOString(),
      });
      return jsonToolResult({ permissions });
    },
  );

  return server;
}
