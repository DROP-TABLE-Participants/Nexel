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
import { tefteroSystemPrompt } from "@/lib/agents/prompts";
import type { AgentExecutionResult, EvidencePack, RetrievedSource, Scenario } from "@/lib/types";

const tefteroOutputSchema = {
  type: "object",
  properties: {
    s: { type: "string", description: "ERP summary." },
    f: {
      type: "array",
      description: "ERP findings.",
      items: {
        type: "object",
        properties: {
          c: { type: "string", description: "Claim." },
          sid: { type: "string", description: "Source ID." },
        },
        required: ["c", "sid"],
        additionalProperties: false,
      },
    },
    rec: { type: "string", description: "Recommended ERP action." },
    task: {
      type: "object",
      description: "ERP task to create.",
      properties: {
        t: { type: "string", description: "Task title." },
        d: { type: "string", description: "Task description." },
        p: { type: "string", description: "Task priority." },
      },
      required: ["t", "d", "p"],
      additionalProperties: false,
    },
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
  required: ["s", "f", "rec", "task", "src", "conf", "a"],
  additionalProperties: false,
};

function normalizeTefteroResult(result: AgentExecutionResult): AgentExecutionResult {
  const output = result.output;
  const task = output.task && typeof output.task === "object"
    ? output.task as Record<string, unknown>
    : {};
  const findings = Array.isArray(output.f)
    ? output.f.map((finding) => {
        const record = finding && typeof finding === "object"
          ? finding as Record<string, unknown>
          : {};
        return {
          claim: stringValue(record.c),
          sourceId: stringValue(record.sid),
        };
      })
    : [];

  return {
    ...result,
    output: {
      summary: stringValue(output.s),
      erpFindings: findings,
      recommendedErpAction: stringValue(output.rec),
      erpTask: {
        title: stringValue(task.t),
        description: stringValue(task.d),
        priority: stringValue(task.p),
      },
      usedSources: stringArray(output.src),
      confidence: numberValue(output.conf),
      actions: normalizeActions(output.a),
    },
  };
}

function stripUnsupportedTefteroWrites(text: unknown) {
  if (typeof text !== "string") return text;
  return text
    .replace(
      /\b(?:add|create|record|update)[^.?!]*(?:note|notes)[^.?!]*[.?!]?/gi,
      "Capture follow-up status and next steps in the task.",
    )
    .replace(/\bERP notes?\b/gi, "the ERP task")
    .replace(/\bcustomer account notes?\b/gi, "the ERP task")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeTefteroResult(result: AgentExecutionResult): AgentExecutionResult {
  const output = { ...result.output };
  output.summary = stripUnsupportedTefteroWrites(output.summary);
  output.recommendedErpAction = stripUnsupportedTefteroWrites(output.recommendedErpAction);

  if (output.erpTask && typeof output.erpTask === "object") {
    const erpTask = output.erpTask as Record<string, unknown>;
    output.erpTask = {
      ...erpTask,
      title: stripUnsupportedTefteroWrites(erpTask.title),
      description: stripUnsupportedTefteroWrites(erpTask.description),
    };
  }

  if (Array.isArray(output.actions)) {
    output.actions = output.actions.filter((action) => (
      action &&
      typeof action === "object" &&
      String((action as { tool?: unknown }).tool ?? "") === "erp.createTask"
    ));
  }

  return { ...result, output };
}

export async function runTefteroAgent(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  const openAiResult = await generateJsonWithOpenAI({
    systemPrompt: tefteroSystemPrompt,
    schemaName: "teftero_output",
    schema: tefteroOutputSchema,
    userPrompt: `Task: ${input.scenario.task}
Context:
${contextToPrompt(input.context)}

Return schema-compliant JSON only. Compact key map: s=summary, f=findings, c=claim, sid=source ID, rec=recommended action, task=ERP task, t=title/tool, d=description, p=priority, src=used source IDs, conf=confidence, a=actions, i=input. Allowed tool: erp.createTask. Keep task.d under 700 characters. Do not mention ERP notes, note updates, orders, or support tickets.`,
  });
  if (openAiResult) return sanitizeTefteroResult(normalizeTefteroResult(openAiResult));

  const sourceIds = sourceIdsFromContext(input.context, input.sources);
  const scoped = hasEvidencePack(input.context);

  return {
    output: {
      summary: scoped
        ? "Acme is a strategic customer with overdue invoice INV-1007. Company Brain selected the customer record, the matching invoice, and ERP follow-up policy."
        : "Naive retrieval found the Acme invoice issue but mixed it with unrelated or sales/support-only sources.",
      erpFindings: [
        {
          claim: "Acme has overdue invoice INV-1007, 12 days overdue.",
          sourceId: "erp:invoice_inv_1007",
        },
        {
          claim: "ERP invoice policy says strategic customers should receive friendly internal follow-up before escalation.",
          sourceId: "drive:erp_invoice_process",
        },
      ],
      recommendedErpAction:
        "Create an internal ERP task for the account owner to follow up on the overdue Acme invoice.",
      erpTask: {
        title: "Follow up on Acme overdue invoice INV-1007",
        description:
          "Acme has overdue invoice INV-1007. Use the ERP invoice follow-up process and friendly strategic-customer handling before external escalation.",
        priority: "high",
      },
      usedSources: sourceIds,
      confidence: scoped ? 0.93 : 0.71,
      actions: [
        {
          tool: "erp.createTask",
          input: {
            title: "Follow up on Acme overdue invoice INV-1007",
            customerId: "erp:customer_acme",
            priority: "high",
          },
        },
      ],
    },
  };
}
