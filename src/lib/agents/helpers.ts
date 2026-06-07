import type { EvidencePack, RetrievedSource } from "@/lib/types";
import { evidencePackToPrompt } from "@/lib/serialization/tson";

type ActionLike = {
  t?: unknown;
  i?: unknown;
  tool?: unknown;
  input?: unknown;
};

export function contextToPrompt(context: string | EvidencePack) {
  if (typeof context === "string") return context;
  return evidencePackToPrompt(context);
}

export function sourceIdsFromContext(context: string | EvidencePack, sources: RetrievedSource[]) {
  if (typeof context !== "string") return context.sources.map((source) => source.id);
  return sources.map((source) => source.artifactId);
}

export function hasEvidencePack(context: string | EvidencePack): context is EvidencePack {
  return typeof context !== "string";
}

export function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function normalizeActions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((action): { tool: string; input: Record<string, unknown> } | null => {
      if (!action || typeof action !== "object") return null;
      const record = action as ActionLike;
      const input = record.i ?? record.input;
      return {
        tool: stringValue(record.t ?? record.tool),
        input: input && typeof input === "object" ? (input as Record<string, unknown>) : {},
      };
    })
    .filter((action): action is { tool: string; input: Record<string, unknown> } =>
      Boolean(action?.tool),
    );
}
