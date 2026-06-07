import type { AgentPolicy } from "@/lib/types";

export const voiceSupportPolicy: AgentPolicy = {
  role: "voice_support",
  displayName: "Voice Support",
  jobDescription:
    "Customer support AI employee that handles voice/text issues, creates Teftero follow-up tasks, drafts Gmail replies, and responds in a custom voice.",
  allowedConnectors: ["gmail", "google_drive", "teftero_erp", "local_mock"],
  allowedDepartments: ["support", "general", "erp"],
  allowedSensitivity: ["public", "internal", "customer_safe"],
  forbiddenSourceTypes: ["restricted_doc"],
  requiredContextTypes: [
    "customer issue",
    "known support article",
    "support policy",
    "customer-safe workaround",
    "ERP customer record if relevant",
    "escalation rule",
  ],
  allowedActions: [
    "erp.createTask",
    "gmail.createDraft",
    "voice.transcribe",
    "voice.synthesize",
  ],
  maxSources: 7,
  maxContextTokens: 3500,
};
