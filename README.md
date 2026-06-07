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

- `/agents/invoices`: invoice operations demo using Notion rows with Teftero ERP and Google Drive evidence.
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
NOTION_API_KEY=
NOTION_INVOICE_DATABASE_ID=
NOTION_USE_REAL_API=false
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

Missing non-database credentials never crash the demo. OpenAI, Gmail, Notion, Google Drive, and Teftero ERP keep mock fallbacks unless credentials and explicit enable flags are present.

`OPENAI_MAX_OUTPUT_TOKENS` defaults to `1200` when unset. Company Brain evidence is serialized into compact TSON before model calls to reduce scoped prompt tokens while naive mode remains the broad baseline.

Money-saved estimates use `MODEL_INPUT_USD_PER_1M` and `MODEL_OUTPUT_USD_PER_1M`; update them for the model pricing you want to demonstrate.

## Docker Deployment

Build and run the app plus Postgres:

```bash
docker compose up --build
```

The app container runs `node scripts/migrate-db.mjs` before starting the standalone Next server. The Postgres data volume is `pgdata`.

## GitOps Deployment

Production deploys from the `main` branch through `.github/workflows/nexel-deploy.yml`.

The workflow builds and pushes:

- `gluckit/nexel:prod-YYYYMMDD-HHMM-SHORTSHA`
- `gluckit/nexel:prod-latest`

It then updates `DROP-TABLE-Participants/Nexel.Deployment` at `k8s/nexel/prod/nexel/deployment.yaml` so Argo CD can sync the immutable image tag.

Required GitHub secrets:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `PERSONAL_ACCESS_TOKEN`

## Token Optimization Check

Run the TSON prompt savings check:

```bash
npm run test:token-optimization
```

The check compares legacy JSON evidence prompts to the compact TSON prompt for invoice email, invoice closure, and unpaid May invoice row fixtures. It fails if any fixture saves less than 20%.

## Invoice Mock Data

The adapter boundary is in `src/lib/connectors/notion.ts`.

Seed invoices live in `data/notion_mock/invoices.json`. Supporting mock evidence lives in `data/erp_mock` and `data/drive_mock`. Runtime status changes are written to ignored `data/notion_mock/invoice_updates.json`, so demo actions do not mutate seed fixtures.

The active scenarios are:

- `invoice_send_email`: draft a Gmail email for an unpaid Notion invoice using Google Drive email guidance and Teftero status evidence.
- `invoice_mark_paid`: record a mock Notion status update for a specific invoice after Teftero shows payment received evidence.
- `invoice_unpaid_may_report`: return unpaid May 2026 invoice rows for an MCP client, with supporting Teftero and Google Drive evidence. The app does not generate Excel files.

`get_company_context` accepts `responseFormat: "invoice_rows"` for scoped table retrieval. The response returns only row data, source IDs, filters, row count, and blocked-source count. Telemetry is omitted from MCP tool responses unless `includeTelemetry: true`, but it is always persisted for the dashboard.

## Other Connections

Google Drive and Teftero ERP remain available as connector adapters in `src/lib/connectors/googleDrive.ts` and `src/lib/connectors/tefteroErp.ts`. The old UI demos for those systems were removed, but the connections and env placeholders are preserved for future workflows.

MCP context tools omit telemetry from tool responses by default to reduce client token load. Pass `includeTelemetry: true` to `get_company_context` or `run_demo_agent` only when debugging; telemetry is still persisted for the dashboard either way.
