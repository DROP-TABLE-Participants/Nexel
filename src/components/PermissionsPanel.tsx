"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { AgentPolicy, Artifact, ConnectorName } from "@/lib/types";

const connectorOptions: ConnectorName[] = [
  "gmail",
  "notion",
  "google_drive",
  "teftero_erp",
];

const departmentOptions: Artifact["access"]["department"][] = [
  "sales",
  "support",
  "erp",
  "finance",
  "general",
  "restricted",
];

const sensitivityOptions: Artifact["access"]["sensitivity"][] = [
  "public",
  "internal",
  "customer_safe",
  "finance",
  "restricted",
];

function toggle<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function ToggleGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase text-slate-500">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                checked
                  ? "border-teal-600 bg-teal-50 text-teal-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggle(selected, option))}
                className="h-4 w-4 accent-teal-700"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PermissionsPanel({ initialPolicies }: { initialPolicies: AgentPolicy[] }) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  async function save(policy: AgentPolicy) {
    setSavingRole(policy.role);
    try {
      const response = await fetch("/api/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentRole: policy.role,
          allowedConnectors: policy.allowedConnectors,
          allowedDepartments: policy.allowedDepartments,
          allowedSensitivity: policy.allowedSensitivity,
          forbiddenSourceTypes: policy.forbiddenSourceTypes,
          allowedActions: policy.allowedActions,
          maxSources: policy.maxSources,
          maxContextTokens: policy.maxContextTokens,
        }),
      });
      const result = (await response.json()) as { permissions: AgentPolicy };
      setPolicies((current) =>
        current.map((item) => (item.role === policy.role ? result.permissions : item)),
      );
    } finally {
      setSavingRole(null);
    }
  }

  function update(role: string, patch: Partial<AgentPolicy>) {
    setPolicies((current) =>
      current.map((policy) => (policy.role === role ? { ...policy, ...patch } : policy)),
    );
  }

  return (
    <div className="grid gap-5">
      {policies.map((policy) => (
        <section key={policy.role} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700">{policy.role}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {policy.displayName}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {policy.jobDescription}
              </p>
            </div>
            <button
              onClick={() => save(policy)}
              disabled={savingRole === policy.role}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {savingRole === policy.role ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <ToggleGroup
              label="Connectors"
              options={connectorOptions}
              selected={policy.allowedConnectors}
              onChange={(allowedConnectors) => update(policy.role, { allowedConnectors })}
            />
            <ToggleGroup
              label="Departments"
              options={departmentOptions}
              selected={policy.allowedDepartments}
              onChange={(allowedDepartments) => update(policy.role, { allowedDepartments })}
            />
            <ToggleGroup
              label="Sensitivity"
              options={sensitivityOptions}
              selected={policy.allowedSensitivity}
              onChange={(allowedSensitivity) => update(policy.role, { allowedSensitivity })}
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Max sources
              <input
                type="number"
                min={1}
                max={20}
                value={policy.maxSources}
                onChange={(event) =>
                  update(policy.role, { maxSources: Number(event.target.value) })
                }
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-600"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Max context tokens
              <input
                type="number"
                min={200}
                max={20000}
                value={policy.maxContextTokens}
                onChange={(event) =>
                  update(policy.role, { maxContextTokens: Number(event.target.value) })
                }
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-600"
              />
            </label>
          </div>
        </section>
      ))}
    </div>
  );
}
