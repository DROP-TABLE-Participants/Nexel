import type { AgentPolicy } from "@/lib/types";

export const salesOutreachPolicy: AgentPolicy = {
  role: "sales_outreach",
  displayName: "Sales Outreach",
  jobDescription:
    "Sales outreach AI employee that drafts personalized, approved Gmail outreach from Drive sales knowledge.",
  allowedConnectors: ["gmail", "google_drive", "local_mock"],
  allowedDepartments: ["sales", "general"],
  allowedSensitivity: ["public", "internal", "customer_safe"],
  forbiddenSourceTypes: [
    "erp_invoice",
    "restricted_doc",
    "voice_transcript",
  ],
  requiredContextTypes: [
    "lead profile",
    "approved sales template",
    "ICP notes",
    "relevant case study",
    "product value proposition",
  ],
  allowedActions: ["gmail.createDraft", "mock.crmLog", "mock.followUpTask"],
  maxSources: 6,
  maxContextTokens: 3000,
};
