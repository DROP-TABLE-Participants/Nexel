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
import { voiceSupportSystemPrompt } from "@/lib/agents/prompts";
import type { AgentExecutionResult, EvidencePack, RetrievedSource, Scenario } from "@/lib/types";

const voiceSupportOutputSchema = {
  type: "object",
  properties: {
    tr: { type: "string", description: "Transcript." },
    cls: { type: "string", description: "Issue classification." },
    reply: {
      type: "object",
      description: "Customer reply.",
      properties: {
        sub: { type: "string", description: "Reply subject." },
        body: { type: "string" },
      },
      required: ["sub", "body"],
      additionalProperties: false,
    },
    task: {
      type: "object",
      description: "ERP follow-up task.",
      properties: {
        t: { type: "string", description: "Task title." },
        d: { type: "string", description: "Task description." },
        p: { type: "string", description: "Task priority." },
      },
      required: ["t", "d", "p"],
      additionalProperties: false,
    },
    voice: { type: "string", description: "Spoken response text." },
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
  required: ["tr", "cls", "reply", "task", "voice", "src", "conf", "a"],
  additionalProperties: false,
};

function normalizeVoiceSupportResult(result: AgentExecutionResult): AgentExecutionResult {
  const output = result.output;
  const reply = output.reply && typeof output.reply === "object"
    ? output.reply as Record<string, unknown>
    : {};
  const task = output.task && typeof output.task === "object"
    ? output.task as Record<string, unknown>
    : {};

  return {
    ...result,
    output: {
      transcript: stringValue(output.tr),
      issueClassification: stringValue(output.cls),
      customerReply: {
        subject: stringValue(reply.sub),
        body: stringValue(reply.body),
      },
      erpTask: {
        title: stringValue(task.t),
        description: stringValue(task.d),
        priority: stringValue(task.p),
      },
      voiceResponseText: stringValue(output.voice),
      usedSources: stringArray(output.src),
      confidence: numberValue(output.conf),
      actions: normalizeActions(output.a),
    },
  };
}

function replaceUnsupportedTicketText(text: unknown) {
  if (typeof text !== "string") return text;
  return text
    .replace(/\border attempts?\b/gi, "checkout attempts")
    .replace(/\border records?\b/gi, "checkout records")
    .replace(/\bsupport tickets?\b/gi, "support follow-up tasks")
    .replace(/\btickets?\b/gi, "follow-up tasks")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeVoiceSupportResult(result: AgentExecutionResult): AgentExecutionResult {
  const output = { ...result.output };
  if (!output.erpTask && output.supportTicket) {
    output.erpTask = output.supportTicket;
  }
  delete output.supportTicket;

  output.issueClassification = replaceUnsupportedTicketText(output.issueClassification);
  output.voiceResponseText = replaceUnsupportedTicketText(output.voiceResponseText);

  if (output.customerReply && typeof output.customerReply === "object") {
    const customerReply = output.customerReply as Record<string, unknown>;
    output.customerReply = {
      ...customerReply,
      subject: replaceUnsupportedTicketText(customerReply.subject),
      body: replaceUnsupportedTicketText(customerReply.body),
    };
  }

  if (output.erpTask && typeof output.erpTask === "object") {
    const erpTask = output.erpTask as Record<string, unknown>;
    output.erpTask = {
      ...erpTask,
      title: replaceUnsupportedTicketText(erpTask.title),
      description: replaceUnsupportedTicketText(erpTask.description),
    };
  }

  if (Array.isArray(output.actions)) {
    output.actions = output.actions
      .map((action) => {
        if (!action || typeof action !== "object") return action;
        const record = action as Record<string, unknown>;
        if (record.tool === "erp.createSupportTicket") {
          return { ...record, tool: "erp.createTask" };
        }
        return record;
      })
      .filter((action) => {
        if (!action || typeof action !== "object") return false;
        return ["erp.createTask", "gmail.createDraft", "voice.synthesize"].includes(
          String((action as { tool?: unknown }).tool ?? ""),
        );
      });
  }

  return { ...result, output };
}

export async function runVoiceSupportAgent(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  const openAiResult = await generateJsonWithOpenAI({
    systemPrompt: voiceSupportSystemPrompt,
    schemaName: "voice_support_output",
    schema: voiceSupportOutputSchema,
    userPrompt: `Task: ${input.scenario.task}
Context:
${contextToPrompt(input.context)}

Return schema-compliant JSON only. Compact key map: tr=transcript, cls=classification, reply=customer reply, sub=subject, task=ERP follow-up task, t=title/tool, d=description, p=priority, voice=spoken response, src=used source IDs, conf=confidence, a=actions, i=input. Allowed tools: erp.createTask, gmail.createDraft, voice.synthesize. Keep reply.body under 900 characters and voice under 350 characters. Do not mention support tickets or order records; say support follow-up task and checkout attempts.`,
  });
  if (openAiResult) return sanitizeVoiceSupportResult(normalizeVoiceSupportResult(openAiResult));

  const sourceIds = sourceIdsFromContext(input.context, input.sources);
  const scoped = hasEvidencePack(input.context);

  return {
    output: {
      transcript: "Hi, checkout is failing for our EU users. Can you help?",
      issueClassification: "checkout/payment validation issue affecting Acme EU users",
      customerReply: {
        subject: "We created a support follow-up for the EU checkout issue",
        body: "Hi Acme team,\n\nThanks for flagging this. I am sorry your EU users are seeing checkout failures. We created a high-priority internal support follow-up task and our team is investigating the payment validation path. Please send browser/device details and whether the failure happens before or after payment confirmation if available.\n\nWe will keep the reply customer-safe and avoid unsupported root-cause claims until confirmed.",
      },
      erpTask: {
        title: "Acme EU checkout failures",
        description:
          "Customer reports checkout failures for EU users. Collect diagnostic details and investigate payment validation. Do not expose restricted internal incident details.",
        priority: "high",
      },
      voiceResponseText:
        "Thanks for reporting this. I created a high-priority support follow-up task for Acme and drafted a customer-safe reply asking for any missing diagnostic details.",
      usedSources: sourceIds,
      confidence: scoped ? 0.9 : 0.66,
      actions: [
        {
          tool: "erp.createTask",
          input: {
            customer: "Acme",
            priority: "high",
          },
        },
        {
          tool: "gmail.createDraft",
          input: {
            to: "support-contact@acme.example",
            subject: "We created a support follow-up for the EU checkout issue",
          },
        },
        {
          tool: "voice.synthesize",
          input: {
            voice: "support-custom",
          },
        },
      ],
      retrievalNote: scoped
        ? "Company Brain blocked restricted incident and HR material before retrieval."
        : "Naive retrieval can surface private incident material alongside support articles.",
    },
  };
}
