import { appendJsonArray, dataFilePath, readJsonFile } from "@/lib/storage/fileStore";
import type { Artifact } from "@/lib/types";

export interface GmailAdapter {
  createDraft(input: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ id: string; url?: string; mocked: boolean }>;
  listRecentEmails?(query?: string): Promise<Artifact[]>;
}

type GmailDraft = {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
  mocked: boolean;
};

const draftsPath = () => dataFilePath("outbox", "gmail_drafts.json");

function rawMimeMessage(input: { to: string; subject: string; body: string }) {
  return [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ].join("\r\n");
}

function base64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

class MockGmailAdapter implements GmailAdapter {
  async createDraft(input: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ id: string; url?: string; mocked: boolean }> {
    const draft: GmailDraft = {
      ...input,
      id: `gmail:draft_${Date.now()}`,
      createdAt: new Date().toISOString(),
      mocked: true,
    };
    await appendJsonArray(draftsPath(), draft);
    return { id: draft.id, url: "mock-gmail://drafts", mocked: true };
  }

  async listRecentEmails(query = ""): Promise<Artifact[]> {
    if (!query.trim()) return [];
    const drafts = await readJsonFile<GmailDraft[]>(draftsPath(), []);
    return drafts.map((draft) => ({
      id: draft.id,
      connector: "gmail",
      sourceType: "email",
      title: `Draft: ${draft.subject}`,
      text: `${draft.to}\n${draft.body}`,
      createdAt: draft.createdAt,
      entities: {
        people: [],
        companies: query ? [query] : [],
      },
      metadata: { mocked: true },
      access: {
        allowedAgents: ["sales_outreach", "voice_support"],
        sensitivity: "customer_safe",
        department: "general",
      },
    }));
  }
}

class RealGmailAdapter extends MockGmailAdapter {
  async createDraft(input: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ id: string; url?: string; mocked: boolean }> {
    const token = process.env.GMAIL_ACCESS_TOKEN;
    const userId = process.env.GMAIL_USER_ID || "me";
    const enabled = process.env.GMAIL_ENABLE_REAL_DRAFTS === "true";

    if (!token || !enabled) {
      return super.createDraft(input);
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(userId)}/drafts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { raw: base64Url(rawMimeMessage(input)) },
        }),
      },
    );

    if (!response.ok) {
      return super.createDraft(input);
    }

    const draft = (await response.json()) as { id?: string; message?: { id?: string } };
    return {
      id: draft.id ?? draft.message?.id ?? `gmail:draft_${Date.now()}`,
      url: "https://mail.google.com/mail/u/0/#drafts",
      mocked: false,
    };
  }
}

export function getGmailAdapter(): GmailAdapter {
  if (process.env.GMAIL_ACCESS_TOKEN) return new RealGmailAdapter();
  return new MockGmailAdapter();
}
