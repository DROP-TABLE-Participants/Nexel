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
import { invoiceOpsSystemPrompt } from "@/lib/agents/prompts";
import { getNotionAdapter } from "@/lib/connectors/notion";
import type {
  AgentExecutionResult,
  EvidencePack,
  RetrievedSource,
  Scenario,
} from "@/lib/types";

const invoiceOpsOutputSchema = {
  type: "object",
  properties: {
    s: { type: "string", description: "Short summary." },
    e: {
      type: "object",
      description: "Email draft when needed.",
      properties: {
        to: { type: "string" },
        sub: { type: "string", description: "Email subject." },
        body: { type: "string" },
      },
      additionalProperties: false,
    },
    upd: {
      type: "object",
      description: "Invoice status update when an invoice is closed.",
      properties: {
        invoice: { type: "string" },
        status: { type: "string" },
        paidAt: { type: "string" },
      },
      additionalProperties: false,
    },
    rows: {
      type: "array",
      description: "Invoice rows for data retrieval scenarios.",
      items: {
        type: "object",
        properties: {
          inv: { type: "string" },
          cust: { type: "string" },
          email: { type: "string" },
          issue: { type: "string" },
          due: { type: "string" },
          month: { type: "string" },
          amt: { type: "number" },
          cur: { type: "string" },
          st: { type: "string" },
        },
        additionalProperties: false,
      },
    },
    src: { type: "array", items: { type: "string" }, description: "Used source IDs." },
    conf: { type: "number", description: "Confidence from 0 to 1." },
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
  required: ["s", "src", "conf", "a"],
  additionalProperties: false,
};

type CompactRow = {
  inv?: unknown;
  cust?: unknown;
  email?: unknown;
  issue?: unknown;
  due?: unknown;
  month?: unknown;
  amt?: unknown;
  cur?: unknown;
  st?: unknown;
};

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const compact = objectValue(row) as CompactRow;
    return {
      invoiceNumber: stringValue(compact.inv),
      customerName: stringValue(compact.cust),
      customerEmail: stringValue(compact.email),
      issueDate: stringValue(compact.issue),
      dueDate: stringValue(compact.due),
      month: stringValue(compact.month),
      amount: numberValue(compact.amt),
      currency: stringValue(compact.cur),
      status: stringValue(compact.st),
    };
  });
}

function normalizeInvoiceOpsResult(result: AgentExecutionResult): AgentExecutionResult {
  const output = result.output;
  const email = objectValue(output.e);
  const update = objectValue(output.upd);
  const normalized: Record<string, unknown> = {
    summary: stringValue(output.s),
    usedSources: stringArray(output.src),
    confidence: numberValue(output.conf),
    actions: normalizeActions(output.a),
  };

  if (email.to || email.sub || email.body) {
    normalized.emailDraft = {
      to: stringValue(email.to),
      subject: stringValue(email.sub),
      body: stringValue(email.body),
    };
  }

  if (update.invoice || update.status || update.paidAt) {
    normalized.invoiceStatusUpdate = {
      invoiceNumber: stringValue(update.invoice),
      status: stringValue(update.status),
      paidAt: stringValue(update.paidAt),
    };
  }

  const rows = normalizeRows(output.rows);
  if (rows.length > 0) normalized.invoiceRows = rows;
  if (
    normalized.emailDraft &&
    Array.isArray(normalized.actions) &&
    normalized.actions.length === 0
  ) {
    const draft = normalized.emailDraft as { to?: string; subject?: string };
    normalized.actions = [
      {
        tool: "gmail.createDraft",
        input: {
          to: draft.to,
          subject: draft.subject,
        },
      },
    ];
  }

  return {
    ...result,
    output: normalized,
  };
}

async function invoiceForScenario(scenario: Scenario) {
  const invoiceNumber = String(scenario.input.invoiceNumber ?? "");
  if (!invoiceNumber) return null;
  return (await getNotionAdapter().listInvoices({ invoiceNumber }))[0] ?? null;
}

async function enforceInvoiceEmailRecipient(
  scenario: Scenario,
  result: AgentExecutionResult,
): Promise<AgentExecutionResult> {
  const invoice = await invoiceForScenario(scenario);
  if (!invoice) return result;
  const output = { ...result.output };
  const draft = objectValue(output.emailDraft);
  output.emailDraft = {
    ...draft,
    to: invoice.customerEmail,
  };
  output.actions = Array.isArray(output.actions)
    ? output.actions.map((action) => {
        if (!action || typeof action !== "object") return action;
        const record = action as { tool?: unknown; input?: unknown };
        if (record.tool !== "gmail.createDraft") return action;
        const actionInput = objectValue(record.input);
        return {
          ...record,
          input: {
            ...actionInput,
            to: invoice.customerEmail,
          },
        };
      })
    : output.actions;

  return {
    ...result,
    output,
  };
}

async function fallbackEmail(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  const invoice = await invoiceForScenario(input.scenario);
  const sourceIds = sourceIdsFromContext(input.context, input.sources);
  const scoped = hasEvidencePack(input.context);
  const customerName = invoice?.customerName ?? String(input.scenario.input.customerName ?? "Customer");
  const invoiceNumber = invoice?.invoiceNumber ?? String(input.scenario.input.invoiceNumber ?? "Invoice");
  const amount = invoice ? `${invoice.amount} ${invoice.currency}` : "the outstanding amount";
  const dueDate = invoice?.dueDate ?? "the due date";

  return {
    output: {
      summary: scoped
        ? `Drafted a scoped unpaid-invoice email for ${customerName} using Notion invoice and customer context.`
        : `Drafted an unpaid-invoice email, but the broad baseline may include unrelated Notion invoice context.`,
      emailDraft: {
        to: invoice?.customerEmail ?? String(input.scenario.input.customerEmail ?? "billing@example.test"),
        subject: `Payment reminder for ${invoiceNumber}`,
        body: `Hi ${customerName} team,\n\nI am following up on ${invoiceNumber} for ${amount}, which was due on ${dueDate}. Could you confirm the expected payment timing or let us know if anything else is needed from our side?\n\nBest,\nInvoice Operations`,
      },
      usedSources: sourceIds,
      confidence: scoped ? 0.92 : 0.72,
      actions: [
        {
          tool: "gmail.createDraft",
          input: {
            to: invoice?.customerEmail ?? String(input.scenario.input.customerEmail ?? "billing@example.test"),
            subject: `Payment reminder for ${invoiceNumber}`,
          },
        },
      ],
    },
  };
}

async function fallbackMarkPaid(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  const invoice = await invoiceForScenario(input.scenario);
  const sourceIds = sourceIdsFromContext(input.context, input.sources);
  const invoiceNumber = invoice?.invoiceNumber ?? String(input.scenario.input.invoiceNumber ?? "Invoice");

  return {
    output: {
      summary: `${invoice?.customerName ?? "Customer"} invoice ${invoiceNumber} was marked paid in Notion.`,
      invoiceStatusUpdate: {
        invoiceNumber,
        status: "paid",
      },
      usedSources: sourceIds,
      confidence: hasEvidencePack(input.context) ? 0.93 : 0.7,
      actions: [
        {
          tool: "notion.markInvoicePaid",
          input: {
            invoiceNumber,
          },
        },
      ],
    },
  };
}

async function fallbackMayRows(input: {
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  const rows = await getNotionAdapter().listInvoiceRows({
    month: "2026-05",
    status: "unpaid",
  });

  return {
    output: {
      summary: "Returned unpaid May 2026 invoice rows for the MCP client as data only.",
      invoiceRows: rows,
      usedSources: sourceIdsFromContext(input.context, input.sources),
      confidence: hasEvidencePack(input.context) ? 0.95 : 0.74,
      actions: [],
    },
  };
}

export async function runInvoiceOperationsAgent(input: {
  scenario: Scenario;
  context: string | EvidencePack;
  sources: RetrievedSource[];
}): Promise<AgentExecutionResult> {
  if (input.scenario.id === "invoice_unpaid_may_report") {
    return fallbackMayRows(input);
  }
  if (input.scenario.id === "invoice_mark_paid") {
    return fallbackMarkPaid(input);
  }

  const openAiResult = await generateJsonWithOpenAI({
    systemPrompt: invoiceOpsSystemPrompt,
    schemaName: "invoice_ops_output",
    schema: invoiceOpsOutputSchema,
    userPrompt: `Task: ${input.scenario.task}
Context:
${contextToPrompt(input.context)}

Return schema-compliant JSON only. Compact key map: s=summary, e=email, sub=subject, upd=status update, rows=invoice rows, src=used source IDs, conf=confidence, a=actions, t=tool, i=input. Allowed tools: gmail.createDraft, notion.markInvoicePaid. Keep e.body under 700 characters.`,
  });
  if (openAiResult) {
    const normalized = normalizeInvoiceOpsResult(openAiResult);
    if (input.scenario.id === "invoice_send_email") {
      return enforceInvoiceEmailRecipient(input.scenario, normalized);
    }
    return normalized;
  }

  return fallbackEmail(input);
}
