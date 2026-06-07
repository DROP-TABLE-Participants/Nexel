import {
  contextToPrompt,
  hasEvidencePack,
  normalizeActions,
  numberValue,
  sourceIdsFromContext,
  stringArray,
  stringValue,
} from "@/lib/agents/helpers";
import { generateJsonWithOpenAI } from "@/lib/agents/openai";
import { salesOutreachSystemPrompt } from "@/lib/agents/prompts";
import type { AgentExecutionResult, EvidencePack, RetrievedSource, Scenario } from "@/lib/types";

const salesOutreachOutputSchema = {
  type: "object",
  properties: {
    s: { type: "string", description: "Summary of the sales output." },
    e: {
      type: "object",
      description: "Email draft.",
      properties: {
        to: { type: "string" },
        sub: { type: "string", description: "Email subject." },
        body: { type: "string" },
      },
      required: ["to", "sub", "body"],
      additionalProperties: false,
    },
    crm: { type: "string", description: "CRM note." },
    fu: { type: "string", description: "Follow-up task." },
    src: { type: "array", items: { type: "string" }, description: "Used source IDs." },
    conf: { type: "number", description: "Confidence score from 0 to 1." },
    a: {
      type: "array",
      description: "Actions to execute.",
      items: {
        type: "object",
        properties: {
          t: { type: "string", description: "Tool name." },
          i: { type: "object", description: "Tool input.", additionalProperties: true },
        },
        required: ["t", "i"],
        additionalProperties: false,
      },
    },
  },
  required: ["s", "e", "crm", "fu", "src", "conf", "a"],
  additionalProperties: false,
};

function normalizeSalesOutreachResult(result: AgentExecutionResult): AgentExecutionResult {
  const output = result.output;
  const email = output.e && typeof output.e === "object" ? output.e as Record<string, unknown> : {};
  return {
    ...result,
    output: {
      summary: stringValue(output.s),
      emailDraft: {
        to: stringValue(email.to, "maya.petrova@finpay.example"),
        subject: stringValue(email.sub),
        body: stringValue(email.body),
      },
      crmNote: stringValue(output.crm),
      followUpTask: stringValue(output.fu),
      usedSources: stringArray(output.src),
      confidence: numberValue(output.conf),
      actions: normalizeActions(output.a),
    },
  };
}

export async function runSalesOutreachAgent(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  const openAiResult = await generateJsonWithOpenAI({
    systemPrompt: salesOutreachSystemPrompt,
    schemaName: "sales_outreach_output",
    schema: salesOutreachOutputSchema,
    userPrompt: `Task: ${input.scenario.task}
Context:
${contextToPrompt(input.context)}

Return schema-compliant JSON only. Compact key map: s=summary, e=email draft, crm=CRM note, fu=follow-up task, src=used source IDs, conf=confidence, a=actions, t=tool, i=input. Allowed tools: gmail.createDraft, mock.crmLog. Keep e.body under 900 characters.`,
  });
  if (openAiResult) return normalizeSalesOutreachResult(openAiResult);

  const lead = input.scenario.input;
  const to = String(lead.email ?? "maya.petrova@finpay.example");
  const company = String(lead.company ?? "FinPay");
  const name = String(lead.leadName ?? "Maya Petrova");
  const sourceIds = sourceIdsFromContext(input.context, input.sources);
  const scoped = hasEvidencePack(input.context);

  return {
    output: {
      summary: scoped
        ? "Company Brain used only approved sales knowledge, FinPay lead context, the approved SDR template, and customer-safe value props."
        : "Naive retrieval found useful sales context but also returned unrelated operational and restricted material that should not guide outreach.",
      emailDraft: {
        to,
        subject: "Connecting AI employees to the right company context",
        body: `Hi ${name.split(" ")[0]},\n\nI saw ${company} is a fintech team, and CTOs in this space often need AI workflows that reduce manual work without opening every system to every agent.\n\nOur Company Brain middleware scopes each AI employee by role, task, permissions, and source, so teams can connect workflows to business systems while keeping outreach grounded in approved templates and customer-safe proof points.\n\nWould a 15-minute conversation next week be useful?\n\nBest,\nSales Team`,
      },
      crmNote:
        "FinPay is fintech; Maya is CTO. Used approved SDR template and fintech value proposition. Did not mention internal incidents, invoices, or restricted material.",
      followUpTask: "Follow up with Maya Petrova in three business days.",
      usedSources: sourceIds,
      confidence: scoped ? 0.91 : 0.68,
      actions: [
        {
          tool: "gmail.createDraft",
          input: {
            to,
            subject: "Connecting AI employees to the right company context",
          },
        },
        {
          tool: "mock.crmLog",
          input: {
            company,
            note: "Approved SDR outreach drafted.",
          },
        },
      ],
    },
  };
}
