import type { AgentPolicy } from "@/lib/types";

export const invoiceOpsPolicy: AgentPolicy = {
  role: "invoice_ops",
  displayName: "Invoice Operations",
  jobDescription:
    "Handles invoice follow-up, payment closure, and scoped invoice-table retrieval from Notion, supported by ERP status and Google Drive SOP evidence without exposing unrelated customer records.",
  allowedConnectors: ["notion", "gmail", "google_drive", "teftero_erp"],
  allowedDepartments: ["finance", "general", "erp"],
  allowedSensitivity: ["internal", "customer_safe", "finance"],
  forbiddenSourceTypes: ["restricted_doc"],
  requiredContextTypes: [
    "invoice number",
    "customer email",
    "invoice amount",
    "invoice status",
    "invoice month",
    "payment status",
    "invoice workflow rule",
  ],
  allowedActions: ["gmail.createDraft", "notion.markInvoicePaid"],
  maxSources: 10,
  maxContextTokens: 1200,
};
