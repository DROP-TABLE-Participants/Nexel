import { AgentDemo } from "@/components/AgentDemo";
import { getPolicy } from "@/lib/policies";
import { defaultScenarioId, getScenario } from "@/lib/scenarios";

export default async function TefteroPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; compare?: string }>;
}) {
  const params = await searchParams;
  const scenarioId = params.scenario ?? defaultScenarioId("teftero");
  const scenario = await getScenario(scenarioId);
  const policy = getPolicy("teftero");

  return (
    <AgentDemo
      agentRole="teftero"
      displayName={policy.displayName}
      scenarioId={scenarioId}
      defaultTask={scenario?.task ?? ""}
      initialCompare={params.compare === "1"}
    />
  );
}
