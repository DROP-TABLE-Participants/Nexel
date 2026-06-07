import type { AgentPolicy } from "@/lib/types";

export const tefteroPolicy: AgentPolicy = {
  role: "teftero",
  displayName: "Teftero",
  jobDescription:
    "ERP operations AI employee that inspects custom ERP data and creates operational tasks.",
  allowedConnectors: ["teftero_erp", "google_drive", "local_mock"],
  allowedDepartments: ["erp", "finance", "general"],
  allowedSensitivity: ["internal", "finance", "customer_safe"],
  forbiddenSourceTypes: ["restricted_doc", "voice_transcript"],
  requiredContextTypes: [
    "customer record",
    "incoming invoice state",
    "ERP process policy",
    "relevant operational history",
    "recommended ERP action",
  ],
  allowedActions: ["erp.createTask"],
  maxSources: 7,
  maxContextTokens: 3500,
};
