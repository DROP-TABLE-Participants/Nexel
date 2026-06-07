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
  await Promise.all(
    Object.values(policies).map((policy) =>
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
        [
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
        ],
      ),
    ),
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
  return result.rows.map(rowToPolicy);
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
