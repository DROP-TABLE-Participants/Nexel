import { dumps } from "@zenoaihq/tson";
import type { TSONValue } from "@zenoaihq/tson";
import type { EvidencePack } from "@/lib/types";

export const TSON_CONTEXT_LEGEND =
  "CTX TSON keys: f[{c=claim,s=sourceId}], src[source ids], act[allowed actions], miss[missing info].";

export function compactEvidencePack(pack: EvidencePack): TSONValue {
  const compact: Record<string, TSONValue> = {
    f: pack.facts.map((fact) => ({
      c: fact.claim,
      s: fact.sourceId,
    })),
    src: pack.sources.map((source) => source.id),
    act: pack.recommendedActions,
  };

  if (pack.missingInfo.length > 0) {
    compact.miss = pack.missingInfo;
  }

  return compact;
}

export function legacyEvidencePackPrompt(pack: EvidencePack) {
  return JSON.stringify({
    summary: pack.summary,
    facts: pack.facts.map((fact) => ({
      claim: fact.claim,
      sourceId: fact.sourceId,
    })),
    recommendedActions: pack.recommendedActions,
    sources: pack.sources.map((source) => ({
      id: source.id,
      title: source.title,
    })),
    missingInfo: pack.missingInfo,
  });
}

export function toTsonText(value: unknown, fallbackLabel = "JSON") {
  try {
    return dumps(value as TSONValue);
  } catch (error) {
    console.warn(`TSON serialization failed; falling back to ${fallbackLabel}.`, error);
    return JSON.stringify(value);
  }
}

export function evidencePackToPrompt(pack: EvidencePack) {
  return `${TSON_CONTEXT_LEGEND}\n${toTsonText(compactEvidencePack(pack), "compact evidence JSON")}`;
}
