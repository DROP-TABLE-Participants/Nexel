import { getGmailAdapter } from "@/lib/connectors/gmail";
import { getTefteroErpAdapter } from "@/lib/connectors/tefteroErp";
import { synthesizeVoice } from "@/lib/voice";
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
  const erp = getTefteroErpAdapter();
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

      if (tool === "erp.createTask") {
        const erpTask =
          outputAt<{ title?: string; description?: string; priority?: string }>(
            output,
            "erpTask",
          ) ??
          outputAt<{ title?: string; description?: string; priority?: string }>(
            output,
            "supportTicket",
          ) ??
          {};
        const result = await erp.createTask({
          title: String(input.title ?? erpTask.title ?? "ERP task"),
          description: String(erpTask.description ?? input.description ?? ""),
          customerId: String(input.customerId ?? input.customer ?? "Acme"),
          priority: String(input.priority ?? erpTask.priority ?? "normal"),
        });
        actions.push({
          tool,
          status: result.mocked ? "mocked" : "success",
          input,
          output: result,
        });
        continue;
      }

      if (tool === "voice.synthesize") {
        const result = await synthesizeVoice({
          text: String(output.voiceResponseText ?? ""),
          voice: String(input.voice ?? "support-custom"),
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
