import { salesOutreachPolicy } from "@/lib/policies/salesOutreach";
import { tefteroPolicy } from "@/lib/policies/teftero";
import { voiceSupportPolicy } from "@/lib/policies/voiceSupport";
import type { AgentPolicy, AgentRole } from "@/lib/types";

export const policies: Record<AgentRole, AgentPolicy> = {
  sales_outreach: salesOutreachPolicy,
  teftero: tefteroPolicy,
  voice_support: voiceSupportPolicy,
};

export function getPolicy(role: AgentRole) {
  return policies[role];
}

export const agentOrder: AgentRole[] = ["sales_outreach", "teftero", "voice_support"];
