import { invoiceOpsPolicy } from "@/lib/policies/invoiceOps";
import type { AgentPolicy, AgentRole } from "@/lib/types";

export const policies: Record<AgentRole, AgentPolicy> = {
  invoice_ops: invoiceOpsPolicy,
};

export function getPolicy(role: AgentRole) {
  return policies[role];
}

export const agentOrder: AgentRole[] = ["invoice_ops"];
