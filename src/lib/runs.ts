import { db, ensureDatabase } from "@/lib/db/postgres";
import type { AgentRun } from "@/lib/types";

type RunRow = {
  id: string;
  scenario_id: string;
  mode: AgentRun["mode"];
  agent_role: AgentRun["agentRole"];
  task: string;
  context: AgentRun["context"];
  output: AgentRun["output"];
  actions: AgentRun["actions"];
  metrics: AgentRun["metrics"];
  created_at: Date | string;
};

function rowToRun(row: RunRow): AgentRun {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    mode: row.mode,
    agentRole: row.agent_role,
    task: row.task,
    context: row.context,
    output: row.output,
    actions: row.actions,
    metrics: row.metrics,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export async function saveRun(run: AgentRun) {
  await ensureDatabase();
  await db().query(
    `
      INSERT INTO agent_runs (
        id,
        scenario_id,
        mode,
        agent_role,
        task,
        context,
        output,
        actions,
        metrics,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO UPDATE SET
        context = EXCLUDED.context,
        output = EXCLUDED.output,
        actions = EXCLUDED.actions,
        metrics = EXCLUDED.metrics
    `,
    [
      run.id,
      run.scenarioId,
      run.mode,
      run.agentRole,
      run.task,
      JSON.stringify(run.context),
      JSON.stringify(run.output),
      JSON.stringify(run.actions),
      JSON.stringify(run.metrics),
      run.createdAt,
    ],
  );
  return run;
}

export async function listRuns() {
  await ensureDatabase();
  const result = await db().query<RunRow>(
    `
      SELECT
        id,
        scenario_id,
        mode,
        agent_role,
        task,
        context,
        output,
        actions,
        metrics,
        created_at
      FROM agent_runs
      ORDER BY created_at DESC
    `,
  );
  return result.rows.map(rowToRun);
}

export async function getRunById(id: string) {
  await ensureDatabase();
  const result = await db().query<RunRow>(
    `
      SELECT
        id,
        scenario_id,
        mode,
        agent_role,
        task,
        context,
        output,
        actions,
        metrics,
        created_at
      FROM agent_runs
      WHERE id = $1
    `,
    [id],
  );
  return result.rows[0] ? rowToRun(result.rows[0]) : null;
}

export async function getDashboardMetrics() {
  const runs = await listRuns();
  const companyBrainRuns = runs.filter((run) => run.mode === "company_brain");
  const naiveRuns = runs.filter((run) => run.mode === "naive");
  const pairs = companyBrainRuns
    .map((brainRun) => ({
      brainRun,
      naiveRun: naiveRuns.find(
        (run) =>
          run.scenarioId === brainRun.scenarioId &&
          run.agentRole === brainRun.agentRole &&
          Math.abs(
            new Date(run.createdAt).getTime() - new Date(brainRun.createdAt).getTime(),
          ) < 60_000,
      ),
    }))
    .filter((pair) => pair.naiveRun);

  const average = (values: number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

  return {
    totalRuns: runs.length,
    averageTokenReduction: average(
      pairs.map(({ brainRun, naiveRun }) => {
        const naiveTotal = naiveRun?.metrics.totalTokens ?? 0;
        if (!naiveTotal) return 0;
        return ((naiveTotal - brainRun.metrics.totalTokens) / naiveTotal) * 100;
      }),
    ),
    averageSourcePrecisionImprovement: average(
      pairs.map(
        ({ brainRun, naiveRun }) =>
          (brainRun.metrics.sourcePrecision - (naiveRun?.metrics.sourcePrecision ?? 0)) *
          100,
      ),
    ),
    averageQualityScoreImprovement: average(
      pairs.map(
        ({ brainRun, naiveRun }) =>
          brainRun.metrics.qualityScore - (naiveRun?.metrics.qualityScore ?? 0),
      ),
    ),
    totalEstimatedCostUsd: runs.reduce(
      (sum, run) => sum + (run.metrics.estimatedCostUsd ?? 0),
      0,
    ),
    demoMoneySavedUsd: pairs.reduce((sum, { brainRun, naiveRun }) => {
      const naiveCost = naiveRun?.metrics.estimatedCostUsd ?? 0;
      const brainCost = brainRun.metrics.estimatedCostUsd ?? 0;
      return sum + Math.max(0, naiveCost - brainCost);
    }, 0),
    forbiddenSourcesBlocked: runs.reduce(
      (sum, run) => sum + run.metrics.forbiddenSourcesBlocked,
      0,
    ),
    actionsCompleted: runs.reduce(
      (sum, run) =>
        sum +
        run.actions.filter(
          (action) => action.status === "success" || action.status === "mocked",
        ).length,
      0,
    ),
    recentRuns: runs.slice(0, 8),
  };
}
