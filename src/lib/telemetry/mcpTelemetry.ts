import { db, ensureDatabase } from "@/lib/db/postgres";
import type { AgentRole, DataUsageItem, McpCallTelemetry } from "@/lib/types";

type TelemetryRow = {
  id: string;
  tool_name: string;
  client_name: string;
  agent_role: AgentRole | "system";
  mode: McpCallTelemetry["mode"] | null;
  scenario_id: string | null;
  task: string;
  input: McpCallTelemetry["input"];
  output: McpCallTelemetry["output"];
  usage: McpCallTelemetry["usage"];
  data_used: DataUsageItem[];
  blocked_sources: McpCallTelemetry["blockedSources"];
  permission_snapshot: McpCallTelemetry["permissionSnapshot"];
  created_at: Date | string;
};

function rowToTelemetry(row: TelemetryRow): McpCallTelemetry {
  return {
    id: row.id,
    toolName: row.tool_name,
    clientName: row.client_name,
    agentRole: row.agent_role,
    mode: row.mode ?? undefined,
    scenarioId: row.scenario_id ?? undefined,
    task: row.task,
    input: row.input,
    output: row.output,
    usage: row.usage,
    dataUsed: row.data_used,
    blockedSources: row.blocked_sources,
    permissionSnapshot: row.permission_snapshot,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export async function recordMcpTelemetry(call: McpCallTelemetry) {
  await ensureDatabase();
  await db().query(
    `
      INSERT INTO mcp_call_telemetry (
        id,
        tool_name,
        client_name,
        agent_role,
        mode,
        scenario_id,
        task,
        input,
        output,
        usage,
        data_used,
        blocked_sources,
        permission_snapshot,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    `,
    [
      call.id,
      call.toolName,
      call.clientName,
      call.agentRole,
      call.mode ?? null,
      call.scenarioId ?? null,
      call.task,
      JSON.stringify(call.input),
      JSON.stringify(call.output),
      JSON.stringify(call.usage),
      JSON.stringify(call.dataUsed),
      JSON.stringify(call.blockedSources),
      JSON.stringify(call.permissionSnapshot),
      call.createdAt,
    ],
  );
  return call;
}

export async function listMcpTelemetry(limit = 50) {
  await ensureDatabase();
  const result = await db().query<TelemetryRow>(
    `
      SELECT
        id,
        tool_name,
        client_name,
        agent_role,
        mode,
        scenario_id,
        task,
        input,
        output,
        usage,
        data_used,
        blocked_sources,
        permission_snapshot,
        created_at
      FROM mcp_call_telemetry
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit],
  );
  return result.rows.map(rowToTelemetry);
}

export async function getMcpTelemetryDashboard() {
  const calls = await listMcpTelemetry(200);
  const sourceMap = new Map<
    string,
    {
      agentRole: AgentRole | "system";
      sourceId: string;
      title: string;
      connector: string;
      sensitivity: string;
      calls: number;
      estimatedTokens: number;
    }
  >();

  for (const call of calls) {
    for (const source of call.dataUsed) {
      const key = `${call.agentRole}:${source.sourceId}`;
      const current =
        sourceMap.get(key) ??
        {
          agentRole: call.agentRole,
          sourceId: source.sourceId,
          title: source.title,
          connector: source.connector,
          sensitivity: source.sensitivity,
          calls: 0,
          estimatedTokens: 0,
        };
      current.calls += 1;
      current.estimatedTokens += source.estimatedTokens;
      sourceMap.set(key, current);
    }
  }

  return {
    totalMcpCalls: calls.length,
    totalMcpTokens: calls.reduce((sum, call) => sum + call.usage.totalTokens, 0),
    totalMcpCostUsd: calls.reduce(
      (sum, call) => sum + call.usage.estimatedCostUsd,
      0,
    ),
    totalMoneySavedUsd: calls.reduce(
      (sum, call) => sum + call.usage.moneySavedUsd,
      0,
    ),
    blockedSources: calls.reduce((sum, call) => sum + call.blockedSources.length, 0),
    heatmap: Array.from(sourceMap.values()).sort(
      (a, b) => b.estimatedTokens - a.estimatedTokens,
    ),
    recentCalls: calls.slice(0, 12),
  };
}
