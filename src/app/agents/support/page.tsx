import { AgentDemo } from "@/components/AgentDemo";
import { getPolicy } from "@/lib/policies";
import { defaultScenarioId, getScenario } from "@/lib/scenarios";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; compare?: string }>;
}) {
  const params = await searchParams;
  const scenarioId = params.scenario ?? defaultScenarioId("voice_support");
  const scenario = await getScenario(scenarioId);
  const policy = getPolicy("voice_support");

  return (
    <AgentDemo
      agentRole="voice_support"
      displayName={policy.displayName}
      scenarioId={scenarioId}
      defaultTask={scenario?.task ?? ""}
      initialCompare={params.compare === "1"}
    />
  );
}
