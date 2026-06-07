import { AgentDemo } from "@/components/AgentDemo";
import { getPolicy } from "@/lib/policies";
import { defaultScenarioId, getScenario } from "@/lib/scenarios";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; compare?: string }>;
}) {
  const params = await searchParams;
  const scenarioId = params.scenario ?? defaultScenarioId("sales_outreach");
  const scenario = await getScenario(scenarioId);
  const policy = getPolicy("sales_outreach");

  return (
    <AgentDemo
      agentRole="sales_outreach"
      displayName={policy.displayName}
      scenarioId={scenarioId}
      defaultTask={scenario?.task ?? ""}
      initialCompare={params.compare === "1"}
    />
  );
}
