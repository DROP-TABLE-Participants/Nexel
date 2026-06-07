import { AgentDemo } from "@/components/AgentDemo";
import { getPolicy } from "@/lib/policies";
import { defaultScenarioId, getScenario } from "@/lib/scenarios";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; compare?: string }>;
}) {
  const params = await searchParams;
  const scenarioId = params.scenario ?? defaultScenarioId("invoice_ops");
  const scenario = await getScenario(scenarioId);
  const policy = getPolicy("invoice_ops");

  return (
    <AgentDemo
      agentRole="invoice_ops"
      displayName={policy.displayName}
      scenarioId={scenarioId}
      defaultTask={scenario?.task ?? ""}
      initialCompare={params.compare === "1"}
    />
  );
}
