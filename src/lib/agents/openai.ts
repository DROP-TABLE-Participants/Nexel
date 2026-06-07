import type { AgentModelUsage } from "@/lib/types";

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  const output = response.output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => {
      if (!content || typeof content !== "object") return "";
      const maybeText = content as { text?: unknown };
      return typeof maybeText.text === "string" ? maybeText.text : "";
    })
    .join("\n");
}

function usageFromResponse(response: Record<string, unknown>): AgentModelUsage | undefined {
  const usage = response.usage;
  if (!usage || typeof usage !== "object") return undefined;
  const data = usage as {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  return {
    inputTokens: data.input_tokens,
    outputTokens: data.output_tokens,
    totalTokens: data.total_tokens,
  };
}

function maxOutputTokens() {
  const parsed = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return 1200;
}

export async function generateJsonWithOpenAI(input: {
  systemPrompt: string;
  userPrompt: string;
  schemaName?: string;
  schema?: Record<string, unknown>;
}): Promise<{ output: Record<string, unknown>; modelUsage?: AgentModelUsage } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        instructions: input.systemPrompt,
        input: `Return valid json only.\n\n${input.userPrompt}`,
        text: {
          format: input.schema
            ? {
                type: "json_schema",
                name: input.schemaName ?? "agent_output",
                strict: false,
                schema: input.schema,
              }
            : {
                type: "json_object",
              },
        },
        max_output_tokens: maxOutputTokens(),
      }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as Record<string, unknown>;
    const outputText = extractOutputText(payload);
    if (!outputText) return null;
    return {
      output: JSON.parse(outputText) as Record<string, unknown>,
      modelUsage: usageFromResponse(payload),
    };
  } catch {
    return null;
  }
}
