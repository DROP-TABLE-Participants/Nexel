import { getContextPack } from "@/lib/companyBrain/contextPackBuilder";
import type { AgentRole } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    agentRole: AgentRole;
    task: string;
    query: string;
    entities?: Record<string, string[]>;
  };
  const result = await getContextPack(body);
  return Response.json(result);
}
