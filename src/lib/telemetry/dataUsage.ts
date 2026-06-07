import { estimateTokens } from "@/lib/companyBrain/scoring";
import type { DataUsageItem, EvidencePack, RetrievedSource } from "@/lib/types";

export function dataUsageFromSources(sources: RetrievedSource[]): DataUsageItem[] {
  return sources.map((source) => ({
    sourceId: source.artifactId,
    title: source.title,
    connector: source.connector,
    sourceType: source.sourceType,
    department: source.department,
    sensitivity: source.sensitivity,
    characters: source.text.length,
    estimatedTokens: estimateTokens(source.text),
    relevance: source.relevance,
  }));
}

export function dataUsageFromEvidencePack(pack: EvidencePack): DataUsageItem[] {
  return pack.sources.map((source) => {
    const text = `${source.title} ${source.id}`;
    return {
      sourceId: source.id,
      title: source.title,
      connector: source.connector,
      sourceType: source.sourceType,
      department: "general",
      sensitivity: "internal",
      characters: text.length,
      estimatedTokens: estimateTokens(text),
      relevance: source.relevance,
    };
  });
}
