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
    id: "sales",
    summary: "Company Brain selected sales-safe sources for FinPay outreach.",
    facts: [
      { claim: "Maya Petrova is CTO at FinPay.", sourceId: "mock:lead_finpay" },
      { claim: "FinPay is a fintech company.", sourceId: "mock:lead_finpay" },
      { claim: "Use the approved SDR template for outbound email.", sourceId: "drive:approved_sdr_template" },
      { claim: "The fintech case study is approved for customer-safe outreach.", sourceId: "drive:fintech_case_study" },
      { claim: "Company Brain scopes context by role, task, permissions, and source.", sourceId: "drive:product_value_props" },
    ],
    recommendedActions: ["gmail.createDraft", "mock.crmLog", "mock.followUpTask"],
    sources: [
      { id: "mock:lead_finpay", title: "Lead profile: Maya Petrova at FinPay" },
      { id: "drive:approved_sdr_template", title: "Approved SDR Template" },
      { id: "drive:sales_icp", title: "Sales ICP" },
      { id: "drive:fintech_case_study", title: "Fintech Case Study" },
      { id: "drive:product_value_props", title: "Product Value Props" },
    ],
    missingInfo: [],
  },
  {
    id: "teftero",
    summary: "Company Brain selected ERP invoice and customer sources for Acme.",
    facts: [
      { claim: "Acme invoice INV-1007 is overdue by 12 days.", sourceId: "erp:invoice_inv_1007" },
      { claim: "Acme is a strategic customer with account owner Elena.", sourceId: "erp:customer_acme" },
      { claim: "For overdue invoices, create an ERP task assigned to the account owner.", sourceId: "drive:erp_invoice_process" },
      { claim: "Strategic customers should receive friendly internal follow-up before escalation.", sourceId: "drive:payment_terms_policy" },
    ],
    recommendedActions: ["erp.createTask"],
    sources: [
      { id: "erp:invoice_inv_1007", title: "Invoice INV-1007 for Acme" },
      { id: "drive:erp_invoice_process", title: "ERP Invoice Process" },
      { id: "erp:customer_acme", title: "ERP Customer: Acme" },
      { id: "drive:payment_terms_policy", title: "Payment Terms Policy" },
    ],
    missingInfo: [],
  },
  {
    id: "support",
    summary: "Company Brain selected support-safe Acme checkout context.",
    facts: [
      { claim: "Acme is a strategic customer.", sourceId: "erp:customer_acme" },
      { claim: "Some EU checkout failures may be related to payment validation.", sourceId: "drive:checkout_eu_issue" },
      { claim: "Support should collect region, browser/device, and payment confirmation details.", sourceId: "drive:support_known_issues" },
      { claim: "Customer-safe replies should avoid internal root-cause speculation.", sourceId: "drive:customer_safe_support_template" },
      { claim: "Company Brain scopes context by role, task, permissions, and data source.", sourceId: "drive:product_value_props" },
    ],
    recommendedActions: ["erp.createTask", "gmail.createDraft", "voice.synthesize"],
    sources: [
      { id: "erp:customer_acme", title: "ERP Customer: Acme" },
      { id: "drive:checkout_eu_issue", title: "Checkout EU Issue" },
      { id: "drive:support_known_issues", title: "Support Known Issues" },
      { id: "drive:customer_safe_support_template", title: "Customer Safe Support Template" },
      { id: "drive:product_value_props", title: "Product Value Props" },
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
