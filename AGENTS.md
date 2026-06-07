<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` or the official Next.js docs before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Guidance

- Do not modify adapter interfaces without updating all usages.
- Preserve the generic MCP server at `/mcp`; do not introduce chatbot-branded agent routes.
- Keep the active demo profile as `invoice_ops` and the route as `/agents/invoices`.
- Keep runs, MCP telemetry, and permissions backed by the real database.
- Preserve telemetry for every MCP tool call, including usage, data used, blocked sources, permissions, and money-saved fields.
- Keep mock fallback behavior for Gmail, Notion, Google Drive, Teftero ERP, OpenAI text, and OpenAI embeddings.
- Preserve the naive vs `company_brain` comparison.
- Preserve evaluation metrics and the quality score formula.
- Prefer small, understandable code over broad abstractions.
- Do not send real emails unless explicitly enabled by `SEND_REAL_EMAILS=true`.
- Do not create real Gmail drafts unless `GMAIL_ENABLE_REAL_DRAFTS=true` and credentials are present.
- Keep restricted documents blocked in middleware mode.
- Keep the Notion adapter boundary in `src/lib/connectors/notion.ts`; real Notion API calls should use the existing interface and keep mock fallback behavior.
- Keep the Google Drive and Teftero ERP adapter boundaries available as connections even though their old UI demos are removed.
- Do not mutate `data/notion_mock/invoices.json`; runtime invoice status changes belong in ignored `data/notion_mock/invoice_updates.json`.
