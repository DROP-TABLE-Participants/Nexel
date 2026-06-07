import { runAgent } from "@/lib/agents";
import type { AgentRole, DemoMode } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    agentRole: AgentRole;
    mode: DemoMode;
    scenarioId: string;
    task?: string;
    input?: Record<string, unknown>;
  };
  const result = await runAgent(body);
  return Response.json(result);
}
