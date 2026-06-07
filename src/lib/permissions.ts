import { db, ensureDatabase } from "@/lib/db/postgres";
import { getPolicy, policies } from "@/lib/policies";
import type { AgentPolicy, AgentRole, Artifact, ConnectorName } from "@/lib/types";

type PermissionRow = {
  role: AgentRole;
  display_name: string;
  job_description: string;
  allowed_connectors: ConnectorName[];
  allowed_departments: Artifact["access"]["department"][];
  allowed_sensitivity: Artifact["access"]["sensitivity"][];
  forbidden_source_types: Artifact["sourceType"][];
  required_context_types: string[];
  allowed_actions: string[];
  max_sources: number;
  max_context_tokens: number;
};

function rowToPolicy(row: PermissionRow): AgentPolicy {
  return {
    role: row.role,
    displayName: row.display_name,
    jobDescription: row.job_description,
    allowedConnectors: row.allowed_connectors,
    allowedDepartments: row.allowed_departments,
    allowedSensitivity: row.allowed_sensitivity,
    forbiddenSourceTypes: row.forbidden_source_types,
    requiredContextTypes: row.required_context_types,
    allowedActions: row.allowed_actions,
    maxSources: row.max_sources,
    maxContextTokens: row.max_context_tokens,
  };
}

export async function seedDefaultPermissions() {
  await ensureDatabase();
  const pool = db();
  const policyRows = Object.values(policies).map((policy): unknown[] => [
    policy.role,
    policy.displayName,
    policy.jobDescription,
    JSON.stringify(policy.allowedConnectors),
    JSON.stringify(policy.allowedDepartments),
    JSON.stringify(policy.allowedSensitivity),
    JSON.stringify(policy.forbiddenSourceTypes),
    JSON.stringify(policy.requiredContextTypes),
    JSON.stringify(policy.allowedActions),
    policy.maxSources,
    policy.maxContextTokens,
  ]);

  await Promise.all(
    policyRows.map((params) =>
      pool.query(
        `
          INSERT INTO agent_permissions (
            role,
            display_name,
            job_description,
            allowed_connectors,
            allowed_departments,
            allowed_sensitivity,
            forbidden_source_types,
            required_context_types,
            allowed_actions,
            max_sources,
            max_context_tokens
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (role) DO NOTHING
        `,
        params,
      ),
    ),
  );

  const invoiceOps = policies.invoice_ops;
  await pool.query(
    `
      UPDATE agent_permissions
      SET
        display_name = $2,
        job_description = $3,
        allowed_connectors = $4,
        allowed_departments = $5,
        allowed_sensitivity = $6,
        forbidden_source_types = $7,
        required_context_types = $8,
        allowed_actions = $9,
        max_sources = $10,
        max_context_tokens = $11,
        updated_at = now()
      WHERE role = $1
        AND max_sources <= 6
        AND NOT (allowed_connectors @> $12::jsonb)
        AND NOT (allowed_connectors @> $13::jsonb)
        AND NOT (required_context_types @> $14::jsonb)
    `,
    [
      invoiceOps.role,
      invoiceOps.displayName,
      invoiceOps.jobDescription,
      JSON.stringify(invoiceOps.allowedConnectors),
      JSON.stringify(invoiceOps.allowedDepartments),
      JSON.stringify(invoiceOps.allowedSensitivity),
      JSON.stringify(invoiceOps.forbiddenSourceTypes),
      JSON.stringify(invoiceOps.requiredContextTypes),
      JSON.stringify(invoiceOps.allowedActions),
      invoiceOps.maxSources,
      invoiceOps.maxContextTokens,
      JSON.stringify(["google_drive"]),
      JSON.stringify(["teftero_erp"]),
      JSON.stringify(["payment status"]),
    ],
  );
}

export async function listAgentPermissions() {
  await seedDefaultPermissions();
  const result = await db().query<PermissionRow>(
    `
      SELECT
        role,
        display_name,
        job_description,
        allowed_connectors,
        allowed_departments,
        allowed_sensitivity,
        forbidden_source_types,
        required_context_types,
        allowed_actions,
        max_sources,
        max_context_tokens
      FROM agent_permissions
      ORDER BY role
    `,
  );
  const activeRoles = new Set(Object.keys(policies));
  return result.rows
    .filter((row) => activeRoles.has(row.role))
    .map(rowToPolicy);
}

export async function getEffectivePolicy(role: AgentRole) {
  await seedDefaultPermissions();
  const result = await db().query<PermissionRow>(
    `
      SELECT
        role,
        display_name,
        job_description,
        allowed_connectors,
        allowed_departments,
        allowed_sensitivity,
        forbidden_source_types,
        required_context_types,
        allowed_actions,
        max_sources,
        max_context_tokens
      FROM agent_permissions
      WHERE role = $1
    `,
    [role],
  );

  return result.rows[0] ? rowToPolicy(result.rows[0]) : getPolicy(role);
}

export async function updateAgentPermissions(
  role: AgentRole,
  patch: Partial<
    Pick<
      AgentPolicy,
      | "allowedConnectors"
      | "allowedDepartments"
      | "allowedSensitivity"
      | "forbiddenSourceTypes"
      | "allowedActions"
      | "maxSources"
      | "maxContextTokens"
    >
  >,
) {
  const current = await getEffectivePolicy(role);
  const next: AgentPolicy = {
    ...current,
    ...patch,
  };

  await db().query(
    `
      UPDATE agent_permissions
      SET
        allowed_connectors = $2,
        allowed_departments = $3,
        allowed_sensitivity = $4,
        forbidden_source_types = $5,
        allowed_actions = $6,
        max_sources = $7,
        max_context_tokens = $8,
        updated_at = now()
      WHERE role = $1
    `,
    [
      role,
      JSON.stringify(next.allowedConnectors),
      JSON.stringify(next.allowedDepartments),
      JSON.stringify(next.allowedSensitivity),
      JSON.stringify(next.forbiddenSourceTypes),
      JSON.stringify(next.allowedActions),
      next.maxSources,
      next.maxContextTokens,
    ],
  );

  return next;
}
