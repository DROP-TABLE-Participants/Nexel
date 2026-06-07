import type { AgentRole } from "@/lib/types";

const knownEntities = {
  people: ["Maya Petrova"],
  companies: ["FinPay", "Acme", "BetaCo"],
  customers: ["Acme", "BetaCo"],
  products: ["Checkout", "Company Brain"],
  invoices: ["INV-1007", "INV-2002"],
  industries: ["fintech", "SaaS"],
};

export function resolveEntities(
  text: string,
  explicit: Record<string, string[]> = {},
): Record<string, string[]> {
  const lower = text.toLowerCase();
  const resolved = Object.entries(knownEntities).reduce<Record<string, string[]>>(
    (acc, [key, values]) => {
      const matches = values.filter((value) => lower.includes(value.toLowerCase()));
      if (matches.length) acc[key] = matches;
      return acc;
    },
    {},
  );

  for (const [key, values] of Object.entries(explicit)) {
    resolved[key] = Array.from(new Set([...(resolved[key] ?? []), ...values]));
  }

  return resolved;
}

export function flattenResolvedEntities(entities: Record<string, string[]>) {
  return Object.values(entities).flat().filter(Boolean);
}

export function inferQueryForAgent(role: AgentRole, task: string) {
  if (role === "sales_outreach") return `${task} approved sales template ICP value proposition case study lead profile`;
  if (role === "teftero") return `${task} customer incoming invoice overdue payment terms ERP process task`;
  return `${task} checkout support customer safe support issue customer record escalation task`;
}
