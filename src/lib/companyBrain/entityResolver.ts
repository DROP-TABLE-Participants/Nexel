import type { AgentRole } from "@/lib/types";

const knownEntities = {
  companies: [
    "Acme Labs",
    "Northstar Retail",
    "Bluebird Health",
    "Orion Systems",
    "Laguna Services",
    "Meridian Foods",
  ],
  customers: [
    "Acme Labs",
    "Northstar Retail",
    "Bluebird Health",
    "Orion Systems",
    "Laguna Services",
    "Meridian Foods",
  ],
  invoices: [
    "INV-2026-0503",
    "INV-2026-0507",
    "INV-2026-0511",
    "INV-2026-0501",
    "INV-2026-0419",
    "INV-2026-0602",
  ],
  months: ["2026-04", "April 2026", "2026-05", "May 2026", "2026-06", "June 2026"],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesEntity(text: string, value: string) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(value.toLowerCase())}($|[^a-z0-9])`);
  return pattern.test(text);
}

export function resolveEntities(
  text: string,
  explicit: Record<string, string[]> = {},
): Record<string, string[]> {
  const lower = text.toLowerCase();
  const resolved = Object.entries(knownEntities).reduce<Record<string, string[]>>(
    (acc, [key, values]) => {
      const matches = values.filter((value) => includesEntity(lower, value));
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
  if (role === "invoice_ops") {
    return `${task} notion invoice customer email invoice status month amount due date payment template teftero erp google drive sop policy report`;
  }
  return task;
}
