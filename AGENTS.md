<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` or the official Next.js docs before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Guidance

- Do not modify adapter interfaces without updating all usages.
- Preserve the generic MCP server at `/mcp`; do not reintroduce chatbot-branded agent routes.
- Keep the sales workflow as a generic `sales_outreach` profile, not a Claude-specific agent.
- Keep runs, MCP telemetry, and permissions backed by the real database.
- Preserve telemetry for every MCP tool call, including usage, data used, blocked sources, permissions, and money-saved fields.
- Keep mock fallback behavior for Gmail, Google Drive, Teftero ERP, OpenAI text, OpenAI embeddings, transcription, and speech.
- Preserve the naive vs `company_brain` comparison.
- Preserve evaluation metrics and the quality score formula.
- Prefer small, understandable code over broad abstractions.
- Do not send real emails unless explicitly enabled by `SEND_REAL_EMAILS=true`.
- Do not create real Gmail drafts unless `GMAIL_ENABLE_REAL_DRAFTS=true` and credentials are present.
- Keep restricted documents blocked in middleware mode.
- Keep the ERP adapter boundary in `src/lib/connectors/tefteroErp.ts` so future work can wire the real Teftero API without changing agents or UI.
