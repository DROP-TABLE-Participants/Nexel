import { getGmailAdapter } from "@/lib/connectors/gmail";
import { getNotionAdapter } from "@/lib/connectors/notion";
import type { AgentAction } from "@/lib/types";

type RequestedAction = {
  tool?: unknown;
  input?: unknown;
};

type DraftLike = {
  to?: string;
  subject?: string;
  body?: string;
};

function outputAt<T>(output: Record<string, unknown>, key: string): T | null {
  const value = output[key];
  return value && typeof value === "object" ? (value as T) : null;
}

export async function executeToolActions(output: Record<string, unknown>) {
  const requested = Array.isArray(output.actions)
    ? (output.actions as RequestedAction[])
    : [];
  const gmail = getGmailAdapter();
  const notion = getNotionAdapter();
  const actions: AgentAction[] = [];

  for (const action of requested) {
    const tool = String(action.tool ?? "");
    const input =
      action.input && typeof action.input === "object"
        ? (action.input as Record<string, unknown>)
        : {};

    try {
      if (tool === "gmail.createDraft") {
        const emailDraft =
          outputAt<DraftLike>(
            output,
            "emailDraft",
          ) ?? outputAt<DraftLike>(output, "customerReply");
        const result = await gmail.createDraft({
          to: String(input.to ?? emailDraft?.to ?? "customer@example.test"),
          subject: String(input.subject ?? emailDraft?.subject ?? "Draft"),
          body: String(emailDraft?.body ?? input.body ?? ""),
        });
        actions.push({
          tool,
          status: result.mocked ? "mocked" : "success",
          input,
          output: result,
        });
        continue;
      }

      if (tool === "notion.markInvoicePaid") {
        const update = outputAt<{ invoiceNumber?: string; paidAt?: string }>(
          output,
          "invoiceStatusUpdate",
        );
        const result = await notion.markInvoicePaid({
          invoiceNumber: String(input.invoiceNumber ?? update?.invoiceNumber ?? ""),
          paidAt: input.paidAt ? String(input.paidAt) : update?.paidAt,
        });
        actions.push({
          tool,
          status: result.mocked ? "mocked" : "success",
          input,
          output: result,
        });
        continue;
      }

      if (tool.startsWith("mock.")) {
        actions.push({
          tool,
          status: "mocked",
          input,
          output: { id: `${tool}_${Date.now()}`, mocked: true },
        });
        continue;
      }

      actions.push({
        tool,
        status: "pending_approval",
        input,
        output: { reason: "Tool is not implemented in the MVP." },
      });
    } catch (error) {
      actions.push({
        tool,
        status: "failed",
        input,
        output: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  return actions;
}
