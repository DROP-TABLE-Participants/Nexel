import { dumps } from "@zenoaihq/tson";

const TSON_CONTEXT_LEGEND =
  "CTX TSON keys: f[{c=claim,s=sourceId}], src[source ids], act[allowed actions], miss[missing info].";

function estimateTokens(input) {
  return Math.max(1, Math.ceil(input.length / 4));
}

function legacyPrompt(pack) {
  return JSON.stringify({
    summary: pack.summary,
    facts: pack.facts.map((fact) => ({
      claim: fact.claim,
      sourceId: fact.sourceId,
    })),
    recommendedActions: pack.recommendedActions,
    sources: pack.sources.map((source) => ({
      id: source.id,
      title: source.title,
    })),
    missingInfo: pack.missingInfo,
  });
}

function compactPrompt(pack) {
  const compact = {
    f: pack.facts.map((fact) => ({
      c: fact.claim,
      s: fact.sourceId,
    })),
    src: pack.sources.map((source) => source.id),
    act: pack.recommendedActions,
  };
  if (pack.missingInfo.length > 0) compact.miss = pack.missingInfo;
  return `${TSON_CONTEXT_LEGEND}\n${dumps(compact)}`;
}

const packs = [
  {
    id: "invoice_send_email",
    summary: "Company Brain selected Notion, Teftero ERP, and Drive sources for Acme Labs.",
    facts: [
      { claim: "Acme Labs invoice INV-2026-0503 is unpaid.", sourceId: "notion:invoice_inv_2026_0503" },
      { claim: "The customer billing email is ap@acmelabs.example.", sourceId: "notion:customer_acme_labs" },
      { claim: "The amount due is 4200 USD.", sourceId: "notion:invoice_inv_2026_0503" },
      { claim: "Use the customer-safe unpaid invoice email template.", sourceId: "notion:template_unpaid_invoice_email" },
      { claim: "Google Drive guidance says to mention invoice number, amount, due date, and payment timing only.", sourceId: "drive:invoice_unpaid_email_guidance" },
      { claim: "Teftero ERP status for INV-2026-0503 is unpaid.", sourceId: "erp:invoice_inv_2026_0503" },
    ],
    recommendedActions: ["gmail.createDraft", "notion.markInvoicePaid"],
    sources: [
      { id: "notion:invoice_inv_2026_0503", title: "Invoice INV-2026-0503 - Acme Labs" },
      { id: "notion:customer_acme_labs", title: "Customer Acme Labs" },
      { id: "notion:template_unpaid_invoice_email", title: "Unpaid invoice email template" },
      { id: "drive:invoice_unpaid_email_guidance", title: "Unpaid Invoice Email Guidance" },
      { id: "erp:invoice_inv_2026_0503", title: "Invoice INV-2026-0503 for Acme Labs" },
      { id: "erp:customer_acme_labs", title: "ERP Customer: Acme Labs" },
    ],
    missingInfo: [],
  },
  {
    id: "invoice_mark_paid",
    summary: "Company Brain selected Notion closure target, Teftero payment evidence, and Drive SOP.",
    facts: [
      { claim: "Laguna Services invoice INV-2026-0419 is unpaid before closure.", sourceId: "notion:invoice_inv_2026_0419" },
      { claim: "The invoice can be marked paid by invoice number.", sourceId: "notion:invoice_inv_2026_0419" },
      { claim: "Laguna Services billing contact is billing@laguna.example.", sourceId: "notion:customer_laguna_services" },
      { claim: "Teftero ERP shows payment received for INV-2026-0419.", sourceId: "erp:invoice_inv_2026_0419" },
      { claim: "The Drive closure SOP says to update Notion when ERP shows payment received.", sourceId: "drive:invoice_closure_sop" },
    ],
    recommendedActions: ["notion.markInvoicePaid"],
    sources: [
      { id: "notion:invoice_inv_2026_0419", title: "Invoice INV-2026-0419 - Laguna Services" },
      { id: "notion:customer_laguna_services", title: "Customer Laguna Services" },
      { id: "drive:invoice_closure_sop", title: "Invoice Closure SOP" },
      { id: "erp:invoice_inv_2026_0419", title: "Invoice INV-2026-0419 for Laguna Services" },
      { id: "erp:customer_laguna_services", title: "ERP Customer: Laguna Services" },
    ],
    missingInfo: [],
  },
  {
    id: "invoice_unpaid_may_report",
    summary: "Company Brain selected unpaid May 2026 rows plus ERP and Drive support.",
    facts: [
      { claim: "Acme Labs invoice INV-2026-0503 is unpaid in May 2026.", sourceId: "notion:invoice_inv_2026_0503" },
      { claim: "Northstar Retail invoice INV-2026-0507 is unpaid in May 2026.", sourceId: "notion:invoice_inv_2026_0507" },
      { claim: "Bluebird Health invoice INV-2026-0511 is unpaid in May 2026.", sourceId: "notion:invoice_inv_2026_0511" },
      { claim: "Teftero ERP also shows INV-2026-0503, INV-2026-0507, and INV-2026-0511 as unpaid.", sourceId: "erp:invoice_inv_2026_0503" },
      { claim: "Drive report rules require data rows only and no generated spreadsheet file.", sourceId: "drive:may_unpaid_invoice_report_rules" },
      { claim: "Paid and non-May invoices are excluded from invoice rows.", sourceId: "notion:invoice_inv_2026_0503" },
      { claim: "Rows are returned as data only.", sourceId: "notion:invoice_inv_2026_0503" },
    ],
    recommendedActions: [],
    sources: [
      { id: "notion:invoice_inv_2026_0503", title: "Invoice INV-2026-0503 - Acme Labs" },
      { id: "notion:invoice_inv_2026_0507", title: "Invoice INV-2026-0507 - Northstar Retail" },
      { id: "notion:invoice_inv_2026_0511", title: "Invoice INV-2026-0511 - Bluebird Health" },
      { id: "drive:may_unpaid_invoice_report_rules", title: "May Unpaid Invoice Report Rules" },
      { id: "erp:invoice_inv_2026_0503", title: "Invoice INV-2026-0503 for Acme Labs" },
      { id: "erp:invoice_inv_2026_0507", title: "Invoice INV-2026-0507 for Northstar Retail" },
      { id: "erp:invoice_inv_2026_0511", title: "Invoice INV-2026-0511 for Bluebird Health" },
    ],
    missingInfo: [],
  },
];

let failed = false;
for (const pack of packs) {
  const legacyTokens = estimateTokens(legacyPrompt(pack));
  const compactTokens = estimateTokens(compactPrompt(pack));
  const reduction = 1 - compactTokens / legacyTokens;
  const reductionPct = Math.round(reduction * 100);
  console.log(`${pack.id}: ${legacyTokens} -> ${compactTokens} tokens (${reductionPct}% reduction)`);
  if (reduction < 0.2) failed = true;
}

if (failed) {
  throw new Error("TSON context prompt reduction must be at least 20% for every fixture.");
}
