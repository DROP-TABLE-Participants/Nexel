import { dataFilePath, readJsonFile } from "@/lib/storage/fileStore";
import type { AgentRole, Scenario } from "@/lib/types";

const fallbackScenarios: Scenario[] = [];

export async function listScenarios() {
  return readJsonFile<Scenario[]>(dataFilePath("ground_truth.json"), fallbackScenarios);
}

export async function getScenario(id: string) {
  const scenarios = await listScenarios();
  return scenarios.find((scenario) => scenario.id === id) ?? null;
}

export async function getDefaultScenarioForAgent(agentRole: AgentRole) {
  const scenarios = await listScenarios();
  return scenarios.find((scenario) => scenario.agentRole === agentRole) ?? null;
}

export function defaultScenarioId(agentRole: AgentRole) {
  if (agentRole === "sales_outreach") return "sales_01";
  if (agentRole === "teftero") return "teftero_01";
  return "support_01";
}
