import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5435/nexel";

const pool = new Pool({ connectionString });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_permissions (
      role TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      job_description TEXT NOT NULL,
      allowed_connectors JSONB NOT NULL,
      allowed_departments JSONB NOT NULL,
      allowed_sensitivity JSONB NOT NULL,
      forbidden_source_types JSONB NOT NULL,
      required_context_types JSONB NOT NULL,
      allowed_actions JSONB NOT NULL,
      max_sources INTEGER NOT NULL,
      max_context_tokens INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      agent_role TEXT NOT NULL,
      task TEXT NOT NULL,
      context JSONB NOT NULL,
      output JSONB NOT NULL,
      actions JSONB NOT NULL,
      metrics JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS agent_runs_created_at_idx
      ON agent_runs (created_at DESC);
    CREATE INDEX IF NOT EXISTS agent_runs_agent_role_idx
      ON agent_runs (agent_role);

    CREATE TABLE IF NOT EXISTS mcp_call_telemetry (
      id TEXT PRIMARY KEY,
      tool_name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      agent_role TEXT NOT NULL,
      mode TEXT,
      scenario_id TEXT,
      task TEXT NOT NULL,
      input JSONB NOT NULL,
      output JSONB NOT NULL,
      usage JSONB NOT NULL,
      data_used JSONB NOT NULL,
      blocked_sources JSONB NOT NULL,
      permission_snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS mcp_call_telemetry_created_at_idx
      ON mcp_call_telemetry (created_at DESC);
    CREATE INDEX IF NOT EXISTS mcp_call_telemetry_agent_role_idx
      ON mcp_call_telemetry (agent_role);
  `);
  await client.query("COMMIT");
  console.log("Database migration complete");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Database migration failed");
  throw error;
} finally {
  client.release();
  await pool.end();
}
