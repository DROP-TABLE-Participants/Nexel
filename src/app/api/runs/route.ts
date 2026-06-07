import { listRuns } from "@/lib/runs";

export async function GET() {
  return Response.json({ runs: await listRuns() });
}
