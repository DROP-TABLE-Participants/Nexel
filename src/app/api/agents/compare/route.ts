import { compareAgent } from "@/lib/agents";
import type { AgentRole } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    agentRole: AgentRole;
    scenarioId: string;
  };
  const result = await compareAgent(body);
  return Response.json(result);
}
