import { listAgentPermissions, updateAgentPermissions } from "@/lib/permissions";
import type { AgentRole } from "@/lib/types";

export async function GET() {
  return Response.json({ permissions: await listAgentPermissions() });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    agentRole: AgentRole;
    allowedConnectors?: string[];
    allowedDepartments?: string[];
    allowedSensitivity?: string[];
    forbiddenSourceTypes?: string[];
    allowedActions?: string[];
    maxSources?: number;
    maxContextTokens?: number;
  };

  const permissions = await updateAgentPermissions(body.agentRole, {
    allowedConnectors: body.allowedConnectors as never,
    allowedDepartments: body.allowedDepartments as never,
    allowedSensitivity: body.allowedSensitivity as never,
    forbiddenSourceTypes: body.forbiddenSourceTypes as never,
    allowedActions: body.allowedActions,
    maxSources: body.maxSources,
    maxContextTokens: body.maxContextTokens,
  });

  return Response.json({ permissions });
}
