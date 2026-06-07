import { dataFilePath, readJsonFile, writeJsonFile } from "@/lib/storage/fileStore";
import type { AgentRole, Artifact } from "@/lib/types";

export type NotionInvoiceStatus = "unpaid" | "paid";

export type NotionInvoice = {
  id: string;
  notionPageId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  month: string;
  amount: number;
  currency: string;
  status: NotionInvoiceStatus;
  description: string;
  allowedAgents: AgentRole[];
  paidAt?: string;
};

type InvoiceUpdate = {
  invoiceNumber: string;
  status: NotionInvoiceStatus;
  paidAt: string;
  updatedAt: string;
};

export type InvoiceRow = {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  month: string;
  amount: number;
  currency: string;
  status: NotionInvoiceStatus;
  notionPageId: string;
};

export interface NotionAdapter {
  listInvoices(filters?: {
    month?: string;
    status?: NotionInvoiceStatus;
    invoiceNumber?: string;
  }): Promise<NotionInvoice[]>;
  listInvoiceRows(filters?: {
    month?: string;
    status?: NotionInvoiceStatus;
  }): Promise<InvoiceRow[]>;
  listInvoiceArtifacts(): Promise<Artifact[]>;
  markInvoicePaid(input: {
    invoiceNumber: string;
    paidAt?: string;
  }): Promise<{ id: string; invoiceNumber: string; status: "paid"; paidAt: string; mocked: boolean }>;
}

const invoicesPath = () => dataFilePath("notion_mock", "invoices.json");
const updatesPath = () => dataFilePath("notion_mock", "invoice_updates.json");

function slug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function monthLabel(month: string) {
  if (month === "2026-05") return "May 2026";
  if (month === "2026-04") return "April 2026";
  if (month === "2026-06") return "June 2026";
  return month;
}

function rowFromInvoice(invoice: NotionInvoice): InvoiceRow {
  return {
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    month: invoice.month,
    amount: invoice.amount,
    currency: invoice.currency,
    status: invoice.status,
    notionPageId: invoice.notionPageId,
  };
}

function invoiceArtifact(invoice: NotionInvoice): Artifact {
  const label = monthLabel(invoice.month);
  return {
    id: invoice.id,
    connector: "notion",
    sourceType: "notion_invoice",
    title: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
    text: [
      `Invoice ${invoice.invoiceNumber} for ${invoice.customerName}.`,
      `Customer email: ${invoice.customerEmail}.`,
      `Status: ${invoice.status}.`,
      `Month: ${invoice.month} (${label}).`,
      `Amount: ${invoice.amount} ${invoice.currency}.`,
      `Issue date: ${invoice.issueDate}. Due date: ${invoice.dueDate}.`,
      invoice.paidAt ? `Paid at: ${invoice.paidAt}.` : "",
      `Description: ${invoice.description}`,
    ].filter(Boolean).join(" "),
    entities: {
      companies: [invoice.customerName],
      customers: [invoice.customerName],
      invoices: [invoice.invoiceNumber],
      months: [invoice.month, label],
    },
    metadata: {
      notionPageId: invoice.notionPageId,
      invoiceNumber: invoice.invoiceNumber,
      month: invoice.month,
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      customerEmail: invoice.customerEmail,
      paidAt: invoice.paidAt,
    },
    access: {
      allowedAgents: invoice.allowedAgents,
      sensitivity: "finance",
      department: "finance",
    },
  };
}

function customerArtifacts(invoices: NotionInvoice[]): Artifact[] {
  const customers = new Map<string, NotionInvoice>();
  for (const invoice of invoices) {
    if (!customers.has(invoice.customerName)) customers.set(invoice.customerName, invoice);
  }

  return Array.from(customers.values()).map((invoice) => ({
    id: `notion:customer_${slug(invoice.customerName)}`,
    connector: "notion",
    sourceType: "notion_customer",
    title: `Customer ${invoice.customerName}`,
    text: [
      `${invoice.customerName} billing contact is ${invoice.customerEmail}.`,
      `Invoices are managed in Notion using invoice numbers and monthly status fields.`,
    ].join(" "),
    entities: {
      companies: [invoice.customerName],
      customers: [invoice.customerName],
    },
    metadata: {
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
    },
    access: {
      allowedAgents: ["invoice_ops"],
      sensitivity: "customer_safe",
      department: "finance",
    },
  }));
}

function supportArtifacts(): Artifact[] {
  return [
    {
      id: "notion:template_unpaid_invoice_email",
      connector: "notion",
      sourceType: "notion_template",
      title: "Unpaid invoice email template",
      text: "Use a concise and customer-safe tone. Mention invoice number, amount, due date, and a request to confirm payment timing. Do not include other customer invoices or internal finance notes.",
      entities: {
        months: ["2026-05", "May 2026"],
      },
      metadata: {
        templateType: "unpaid_invoice_email",
      },
      access: {
        allowedAgents: ["invoice_ops"],
        sensitivity: "customer_safe",
        department: "general",
      },
    },
    {
      id: "notion:restricted_margin_notes",
      connector: "notion",
      sourceType: "restricted_doc",
      title: "Restricted invoice margin notes",
      text: "Internal-only margin and discount notes that must never be returned to invoice operations demos.",
      entities: {
        months: ["2026-05", "May 2026"],
      },
      metadata: {
        restricted: true,
      },
      access: {
        allowedAgents: [],
        forbiddenAgents: ["invoice_ops"],
        sensitivity: "restricted",
        department: "restricted",
      },
    },
  ];
}

class MockNotionAdapter implements NotionAdapter {
  private async listMergedInvoices() {
    const invoices = await readJsonFile<NotionInvoice[]>(invoicesPath(), []);
    const updates = await readJsonFile<InvoiceUpdate[]>(updatesPath(), []);
    const latestByInvoice = new Map<string, InvoiceUpdate>();

    for (const update of updates) {
      const current = latestByInvoice.get(update.invoiceNumber);
      if (!current || current.updatedAt < update.updatedAt) {
        latestByInvoice.set(update.invoiceNumber, update);
      }
    }

    return invoices.map((invoice) => {
      const update = latestByInvoice.get(invoice.invoiceNumber);
      if (!update) return invoice;
      return {
        ...invoice,
        status: update.status,
        paidAt: update.paidAt,
      };
    });
  }

  async listInvoices(filters: {
    month?: string;
    status?: NotionInvoiceStatus;
    invoiceNumber?: string;
  } = {}) {
    const invoices = await this.listMergedInvoices();
    return invoices.filter((invoice) => {
      if (filters.month && invoice.month !== filters.month) return false;
      if (filters.status && invoice.status !== filters.status) return false;
      if (filters.invoiceNumber && invoice.invoiceNumber !== filters.invoiceNumber) return false;
      return true;
    });
  }

  async listInvoiceRows(filters: {
    month?: string;
    status?: NotionInvoiceStatus;
  } = {}) {
    return (await this.listInvoices(filters)).map(rowFromInvoice);
  }

  async listInvoiceArtifacts() {
    const invoices = await this.listMergedInvoices();
    return [
      ...invoices.map(invoiceArtifact),
      ...customerArtifacts(invoices),
      ...supportArtifacts(),
    ];
  }

  async markInvoicePaid(input: { invoiceNumber: string; paidAt?: string }) {
    const invoice = (await this.listInvoices({ invoiceNumber: input.invoiceNumber }))[0];
    if (!invoice) throw new Error(`Unknown Notion invoice: ${input.invoiceNumber}`);

    const paidAt = input.paidAt ?? new Date().toISOString();
    const update: InvoiceUpdate = {
      invoiceNumber: invoice.invoiceNumber,
      status: "paid",
      paidAt,
      updatedAt: paidAt,
    };
    const updates = await readJsonFile<InvoiceUpdate[]>(updatesPath(), []);
    await writeJsonFile(updatesPath(), [update, ...updates]);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: "paid" as const,
      paidAt,
      mocked: true,
    };
  }
}

class RealNotionAdapter extends MockNotionAdapter {
  // Real API integration is intentionally deferred. The adapter boundary is
  // stable so future work can replace these mock reads with Notion database calls.
}

export function getNotionAdapter(): NotionAdapter {
  const enabled = process.env.NOTION_USE_REAL_API === "true";
  if (enabled && process.env.NOTION_API_KEY && process.env.NOTION_INVOICE_DATABASE_ID) {
    return new RealNotionAdapter();
  }
  return new MockNotionAdapter();
}
