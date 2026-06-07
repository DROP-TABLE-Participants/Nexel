import type { AgentModelUsage } from "@/lib/types";

const inputUsdPerMillion = Number(process.env.MODEL_INPUT_USD_PER_1M ?? "2.5");
const outputUsdPerMillion = Number(process.env.MODEL_OUTPUT_USD_PER_1M ?? "10");

export function estimateCostUsd(usage: AgentModelUsage) {
  const inputCost = ((usage.inputTokens ?? 0) / 1_000_000) * inputUsdPerMillion;
  const outputCost = ((usage.outputTokens ?? 0) / 1_000_000) * outputUsdPerMillion;
  const totalOnlyCost =
    usage.inputTokens || usage.outputTokens
      ? 0
      : ((usage.totalTokens ?? 0) / 1_000_000) *
        ((inputUsdPerMillion + outputUsdPerMillion) / 2);

  return Number((inputCost + outputCost + totalOnlyCost).toFixed(6));
}

export function moneySavedUsd(baselineUsage: AgentModelUsage, scopedUsage: AgentModelUsage) {
  return Number(
    Math.max(0, estimateCostUsd(baselineUsage) - estimateCostUsd(scopedUsage)).toFixed(6),
  );
}
