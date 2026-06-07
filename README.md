# Company Brain MCP Server

Next.js MVP for a Company Brain middleware that exposes governed company context through a generic MCP server. ChatGPT, Claude, or another MCP-capable client can connect to the same endpoint and request scoped data through reusable client profiles.

The app compares:

- **Naive retrieval**: broad retrieval across available company data.
- **Company Brain retrieval**: permission-scoped context packs based on profile, task, connectors, departments, sensitivity, source type, and entities.

It persists runs, MCP calls, telemetry, permissions, usage, blocked sources, and heatmap data in Postgres.

## Install

```bash
npm install
```

## Local Setup

Copy the environment template and add credentials as needed:

```bash
cp .env.example .env.local
```

Start Postgres and run the schema migration:

```bash
docker compose up -d postgres
npm run db:migrate
```

Run the app:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5435/nexel npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MCP Endpoint

The MCP server is available at:

```text
http://localhost:3000/mcp
```

Transport: MCP Streamable HTTP.

Tools:

- `get_company_context`: returns naive or Company Brain scoped context and records telemetry.
- `run_demo_agent`: runs a built-in demo profile and stores the run.
- `list_agent_permissions`: lists persisted access policies.
- `update_agent_permissions`: limits a profile's connectors, departments, sensitivity, actions, and source count.

For JSON-response clients, include:

```http
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2025-11-25
```

## Product Areas

- `/agents/sales`: sales outreach profile demo.
- `/agents/teftero`: ERP operations profile demo.
- `/agents/support`: voice support profile demo.
- `/permissions`: edit profile access limits.
- `/dashboard`: view runs, MCP usage, source heatmap, blocked sources, and estimated money saved.
- `/runs/[id]`: inspect a saved run trace.

## Environment Variables

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5435/nexel
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MAX_OUTPUT_TOKENS=1200
MODEL_INPUT_USD_PER_1M=2.5
MODEL_OUTPUT_USD_PER_1M=10
GMAIL_ACCESS_TOKEN=
GMAIL_USER_ID=me
GMAIL_ENABLE_REAL_DRAFTS=false
GOOGLE_DRIVE_ACCESS_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
TEFTERO_ERP_BASE_URL=
TEFTERO_ERP_TENANT=
TEFTERO_ERP_TOKEN=
TEFTERO_ERP_PERM_TICKET=
TEFTERO_ERP_TASK_ACTIVITY_ID=
TEFTERO_ERP_TASK_ACCOUNTABLE_EMPLOYEE_ID=
TEFTERO_ERP_TASK_PLANNED_HOURS=1
TEFTERO_USE_REAL_API=false
SEND_REAL_EMAILS=false
```

Missing non-database credentials never crash the demo. OpenAI, Gmail, Google Drive, Teftero ERP, transcription, and speech keep mock fallbacks unless credentials and explicit enable flags are present.

`OPENAI_MAX_OUTPUT_TOKENS` defaults to `1200` when unset. Company Brain evidence is serialized into compact TSON before model calls to reduce scoped prompt tokens while naive mode remains the broad baseline.

Money-saved estimates use `MODEL_INPUT_USD_PER_1M` and `MODEL_OUTPUT_USD_PER_1M`; update them for the model pricing you want to demonstrate.

## Docker Deployment

Build and run the app plus Postgres:

```bash
docker compose up --build
```

The app container runs `node scripts/migrate-db.mjs` before starting the standalone Next server. The Postgres data volume is `pgdata`.

## Token Optimization Check

Run the TSON prompt savings check:

```bash
npm run test:token-optimization
```

The check compares legacy JSON evidence prompts to the compact TSON prompt for the sales, Teftero, and support fixtures and fails if any fixture saves less than 20%.

## Teftero ERP Adapter

The adapter boundary is in `src/lib/connectors/tefteroErp.ts`.

Current real API patterns found in `/Users/sivanov/Documents/Projects/ERP`:

- Companies: `/api/{tenant}/contacts/companies`
- Tasks: `/api/{tenant}/task-management/tasks`
- Incoming invoices: `/api/{tenant}/finance/incoming-invoice`

The checked ERP.Web app does not expose generic orders, note-write, or support-ticket endpoints, so the demo uses Teftero tasks for ERP follow-up work. Real calls send the access token as both `Authorization: Bearer ...` and an `accessToken` cookie because ERP.Web route guards read the cookie. Set `TEFTERO_ERP_PERM_TICKET` if your ERP.Web session also requires the permission ticket header.

Task creation maps the demo task into ERP.Web `TaskIm` shape. Set `TEFTERO_ERP_TASK_ACTIVITY_ID` and `TEFTERO_ERP_TASK_ACCOUNTABLE_EMPLOYEE_ID` for real task writes; if Teftero rejects a request or credentials are missing, the adapter preserves mock fallback behavior.

MCP context tools omit telemetry from tool responses by default to reduce client token load. Pass `includeTelemetry: true` to `get_company_context` or `run_demo_agent` only when debugging; telemetry is still persisted for the dashboard either way.
