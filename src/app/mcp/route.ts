import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createCompanyBrainMcpServer } from "@/lib/mcp/companyBrainServer";

export const dynamic = "force-dynamic";

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleMcpRequest(request: Request) {
  const server = createCompanyBrainMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  const response = await transport.handleRequest(request);
  void server.close();
  return withCors(response);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function GET(request: Request) {
  if (!request.headers.get("accept")?.includes("text/event-stream")) {
    return Response.json({
      name: "company-brain-middleware",
      transport: "MCP Streamable HTTP",
      endpoint: "/mcp",
      tools: [
        "get_company_context",
        "run_demo_agent",
        "list_agent_permissions",
        "update_agent_permissions",
      ],
    });
  }

  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id",
    },
  });
}
