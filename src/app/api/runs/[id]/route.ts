import { getRunById } from "@/lib/runs";

export async function GET(_request: Request, context: RouteContext<"/api/runs/[id]">) {
  const { id } = await context.params;
  const run = await getRunById(id);
  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  return Response.json(run);
}
