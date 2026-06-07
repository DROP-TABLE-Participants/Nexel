import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AgentRole, Artifact } from "@/lib/types";

export interface GoogleDriveAdapter {
  listKnowledgeDocs(): Promise<Artifact[]>;
  getFileText(fileId: string): Promise<string>;
}

type Frontmatter = Record<string, string>;

const driveMockDir = () => path.join(process.cwd(), "data", "drive_mock");

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const fmText = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const frontmatter = fmText.split("\n").reduce<Frontmatter>((acc, line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return acc;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    acc[key] = value;
    return acc;
  }, {});

  return { frontmatter, body };
}

function parseAgents(value?: string): AgentRole[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) as AgentRole[];
}

function inferDriveSourceType(fileName: string, fm: Frontmatter): Artifact["sourceType"] {
  if (fm.sensitivity === "restricted") return "restricted_doc";
  if (fileName.includes("template")) return "template";
  if (fileName.includes("policy") || fileName.includes("process")) return "policy";
  return "drive_doc";
}

function extractEntities(text: string, title: string): Artifact["entities"] {
  const joined = `${title} ${text}`;
  return {
    people: ["Maya Petrova"].filter((name) => joined.includes(name)),
    companies: ["FinPay", "Acme", "BetaCo"].filter((name) => joined.includes(name)),
    customers: ["Acme", "BetaCo"].filter((name) => joined.includes(name)),
    products: ["Checkout", "Company Brain"].filter((name) =>
      joined.toLowerCase().includes(name.toLowerCase()),
    ),
    industries: ["fintech", "SaaS"].filter((name) =>
      joined.toLowerCase().includes(name.toLowerCase()),
    ),
  };
}

function artifactFromMarkdown(fileName: string, raw: string): Artifact {
  const { frontmatter, body } = parseFrontmatter(raw);
  const title =
    frontmatter.title ??
    fileName
      .replace(/\.md$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const allowedAgents = parseAgents(frontmatter.allowedAgents);
  const sensitivity =
    (frontmatter.sensitivity as Artifact["access"]["sensitivity"] | undefined) ??
    "internal";
  const department =
    (frontmatter.department as Artifact["access"]["department"] | undefined) ??
    "general";

  return {
    id: frontmatter.id ?? `drive:${fileName.replace(/\.md$/, "")}`,
    connector: "google_drive",
    sourceType: inferDriveSourceType(fileName, frontmatter),
    title,
    text: body,
    url: `mock-drive://${fileName}`,
    entities: extractEntities(body, title),
    metadata: { fileName, mock: true },
    access: {
      allowedAgents,
      sensitivity,
      department,
    },
  };
}

class MockGoogleDriveAdapter implements GoogleDriveAdapter {
  async listKnowledgeDocs(): Promise<Artifact[]> {
    const entries = await readdir(driveMockDir());
    const markdownFiles = entries.filter((entry) => entry.endsWith(".md"));
    const docs = await Promise.all(
      markdownFiles.map(async (fileName) => {
        const raw = await readFile(path.join(driveMockDir(), fileName), "utf8");
        return artifactFromMarkdown(fileName, raw);
      }),
    );
    return docs;
  }

  async getFileText(fileId: string): Promise<string> {
    const docs = await this.listKnowledgeDocs();
    return docs.find((doc) => doc.id === fileId)?.text ?? "";
  }
}

class RealGoogleDriveAdapter extends MockGoogleDriveAdapter {
  async listKnowledgeDocs(): Promise<Artifact[]> {
    // TODO: Replace this placeholder with Google Drive API listing when
    // GOOGLE_DRIVE_ACCESS_TOKEN and GOOGLE_DRIVE_FOLDER_ID are configured.
    return super.listKnowledgeDocs();
  }
}

export function getGoogleDriveAdapter(): GoogleDriveAdapter {
  if (process.env.GOOGLE_DRIVE_ACCESS_TOKEN && process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return new RealGoogleDriveAdapter();
  }
  return new MockGoogleDriveAdapter();
}
