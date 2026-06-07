import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { PermissionsPanel } from "@/components/PermissionsPanel";
import { listAgentPermissions } from "@/lib/permissions";

export default async function PermissionsPage() {
  await connection();
  const permissions = await listAgentPermissions();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600">
        <ArrowLeft size={16} /> Home
      </Link>
      <div className="mt-6">
        <p className="text-sm font-semibold uppercase text-teal-700">Access controls</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          MCP client permissions
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Limit which connectors, departments, and data sensitivity levels each client
          profile can retrieve through Company Brain.
        </p>
      </div>
      <section className="mt-8">
        <PermissionsPanel initialPolicies={permissions} />
      </section>
    </main>
  );
}
