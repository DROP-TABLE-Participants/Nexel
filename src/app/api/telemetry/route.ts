import { getMcpTelemetryDashboard, listMcpTelemetry } from "@/lib/telemetry/mcpTelemetry";

export async function GET() {
  const [dashboard, calls] = await Promise.all([
    getMcpTelemetryDashboard(),
    listMcpTelemetry(50),
  ]);
  return Response.json({ dashboard, calls });
}
