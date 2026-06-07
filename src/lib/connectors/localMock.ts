import { dataFilePath, readJsonFile } from "@/lib/storage/fileStore";
import type { AgentRole, Artifact } from "@/lib/types";

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  email: string;
  allowedAgents: AgentRole[];
};

export async function listLocalMockArtifacts(): Promise<Artifact[]> {
  const leads = await readJsonFile<Lead[]>(dataFilePath("local_mock", "leads.json"), []);
  return leads.map((lead) => ({
    id: lead.id,
    connector: "local_mock",
    sourceType: "drive_doc",
    title: `Lead profile: ${lead.name} at ${lead.company}`,
    text: `${lead.name} is ${lead.title} at ${lead.company}. ${lead.company} is in ${lead.industry}. Email: ${lead.email}.`,
    entities: {
      people: [lead.name],
      companies: [lead.company],
      industries: [lead.industry],
    },
    metadata: lead,
    access: {
      allowedAgents: lead.allowedAgents,
      sensitivity: "customer_safe",
      department: "sales",
    },
  }));
}
