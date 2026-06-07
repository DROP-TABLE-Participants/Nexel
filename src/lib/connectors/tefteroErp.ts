import { dataFilePath, readJsonFile, writeJsonFile } from "@/lib/storage/fileStore";
import type { AgentRole, Artifact } from "@/lib/types";

export interface TefteroErpAdapter {
  getCustomer(customerNameOrId: string): Promise<Artifact | null>;
  getInvoices(customerId?: string): Promise<Artifact[]>;
  createTask(input: {
    title: string;
    description: string;
    customerId?: string;
    priority?: string;
  }): Promise<{ id: string; mocked: boolean }>;
}

type MockCustomer = {
  id: string;
  name: string;
  status: string;
  accountOwner: string;
  allowedAgents: AgentRole[];
};

type MockInvoice = {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  currency: string;
  status: string;
  daysOverdue: number;
  allowedAgents: AgentRole[];
};

type MockTask = {
  id: string;
  title: string;
  description: string;
  customerId?: string;
  priority?: string;
  createdAt: string;
};

const erpPath = (file: string) => dataFilePath("erp_mock", file);
type UnknownRecord = Record<string, unknown>;

function customerArtifact(customer: MockCustomer): Artifact {
  return {
    id: customer.id,
    connector: "teftero_erp",
    sourceType: "erp_customer",
    title: `ERP Customer: ${customer.name}`,
    text: `${customer.name} is a ${customer.status} customer. Account owner: ${customer.accountOwner}.`,
    entities: {
      customers: [customer.name],
      companies: [customer.name],
    },
    metadata: customer,
    access: {
      allowedAgents: customer.allowedAgents,
      sensitivity: "customer_safe",
      department: "erp",
    },
  };
}

function invoiceArtifact(invoice: MockInvoice): Artifact {
  return {
    id: invoice.id,
    connector: "teftero_erp",
    sourceType: "erp_invoice",
    title: `Invoice ${invoice.invoiceNumber} for ${invoice.customer}`,
    text: `${invoice.customer} invoice ${invoice.invoiceNumber} is ${invoice.status}. Amount ${invoice.amount} ${invoice.currency}. Days overdue: ${invoice.daysOverdue}.`,
    entities: {
      customers: [invoice.customer],
      companies: [invoice.customer],
      invoices: [invoice.invoiceNumber],
    },
    metadata: invoice,
    access: {
      allowedAgents: invoice.allowedAgents,
      sensitivity: "finance",
      department: "finance",
    },
  };
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["items", "data", "result", "results", "rows"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function realCompanyArtifact(company: UnknownRecord): Artifact {
  const id = textValue(company.id ?? company.companyId, `erp:company_${Date.now()}`);
  const name = textValue(company.name ?? company.companyName, "Unknown company");
  const businessCategory = textValue(company.businessCategoryName);
  const city = textValue(company.city);
  const country = textValue(company.country);
  const accountText = [businessCategory, city, country].filter(Boolean).join(", ");

  return {
    id,
    connector: "teftero_erp",
    sourceType: "erp_customer",
    title: `Teftero company: ${name}`,
    text: `${name}${accountText ? ` (${accountText})` : ""}. UIC: ${textValue(company.uic, "unknown")}.`,
    entities: {
      customers: [name],
      companies: [name],
    },
    metadata: company,
    access: {
      allowedAgents: ["teftero", "voice_support"],
      sensitivity: "customer_safe",
      department: "erp",
    },
  };
}

function realIncomingInvoiceArtifact(invoice: UnknownRecord): Artifact {
  const invoiceNumber = textValue(invoice.invoiceNumber, "unknown");
  const supplier = textValue(invoice.supplierCompanyName);
  const receiver = textValue(invoice.receiverCompanyName);
  const customer = supplier || receiver || "Unknown company";
  const totalAmount = numberValue(invoice.totalAmount ?? invoice.remainingAmount);
  const remainingAmount = numberValue(invoice.remainingAmount, totalAmount);
  const status = textValue(invoice.paymentStatus, "unknown");
  const currency = String(invoice.currency ?? "EUR");

  return {
    id: textValue(invoice.id, `erp:incoming_invoice_${invoiceNumber}`),
    connector: "teftero_erp",
    sourceType: "erp_invoice",
    title: `Incoming invoice ${invoiceNumber} for ${customer}`,
    text: `${customer} incoming invoice ${invoiceNumber} is ${status}. Total ${totalAmount} ${currency}. Remaining ${remainingAmount} ${currency}. Due date: ${textValue(invoice.dueDate, "not set")}.`,
    entities: {
      customers: [customer],
      companies: [customer, supplier, receiver].filter(Boolean),
      invoices: [invoiceNumber],
    },
    metadata: invoice,
    access: {
      allowedAgents: ["teftero"],
      sensitivity: "finance",
      department: "finance",
    },
  };
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function toTaskPriority(priority?: string) {
  const normalized = priority?.trim().toLowerCase();
  if (normalized === "globalhigh" || normalized === "global_high") return "GlobalHigh";
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  return "Normal";
}

function buildTaskPayload(input: {
  title: string;
  description: string;
  customerId?: string;
  priority?: string;
}) {
  const date = todayDateOnly();
  const description = [input.title, input.description, input.customerId ? `Customer: ${input.customerId}` : ""]
    .filter(Boolean)
    .join("\n\n");

  return {
    contractId: null,
    offerId: null,
    activityId: process.env.TEFTERO_ERP_TASK_ACTIVITY_ID ?? "",
    description,
    startDate: date,
    endDate: date,
    priority: toTaskPriority(input.priority),
    accountableEmployeeId: process.env.TEFTERO_ERP_TASK_ACCOUNTABLE_EMPLOYEE_ID ?? "",
    isAcceptedByAccountable: false,
    status: "ToDo",
    recurrenceType: "None",
    plannedWorkHours: numberValue(process.env.TEFTERO_ERP_TASK_PLANNED_HOURS, 1),
    blockedByTaskIds: [],
    blockingTaskIds: [],
  };
}

class MockTefteroErpAdapter implements TefteroErpAdapter {
  async getCustomer(customerNameOrId: string): Promise<Artifact | null> {
    const customers = await readJsonFile<MockCustomer[]>(erpPath("customers.json"), []);
    const target = customerNameOrId.toLowerCase();
    const customer = customers.find(
      (item) =>
        item.id.toLowerCase() === target || item.name.toLowerCase() === target,
    );
    return customer ? customerArtifact(customer) : null;
  }

  async getInvoices(customerId?: string): Promise<Artifact[]> {
    const invoices = await readJsonFile<MockInvoice[]>(erpPath("invoices.json"), []);
    return invoices
      .filter((invoice) =>
        customerId
          ? invoice.customer.toLowerCase().includes(customerId.toLowerCase()) ||
            invoice.id === customerId
          : true,
      )
      .map(invoiceArtifact);
  }

  async createTask(input: {
    title: string;
    description: string;
    customerId?: string;
    priority?: string;
  }): Promise<{ id: string; mocked: boolean }> {
    const tasks = await readJsonFile<MockTask[]>(erpPath("tasks.json"), []);
    const task = {
      ...input,
      id: `erp:task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await writeJsonFile(erpPath("tasks.json"), [task, ...tasks]);
    return { id: task.id, mocked: true };
  }
}

class RealTefteroErpAdapter extends MockTefteroErpAdapter {
  private baseUrl = process.env.TEFTERO_ERP_BASE_URL;
  private tenant = process.env.TEFTERO_ERP_TENANT;
  private token = process.env.TEFTERO_ERP_TOKEN;
  private permTicket =
    process.env.TEFTERO_ERP_PERM_TICKET ?? process.env.TEFTERO_ERP_PERMISSION_TICKET;

  private get enabled() {
    return (
      process.env.TEFTERO_USE_REAL_API === "true" &&
      Boolean(this.baseUrl && this.tenant && this.token)
    );
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T | null> {
    if (!this.enabled || !this.baseUrl || !this.token || !this.tenant) return null;
    const baseUrl = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    const url = new URL(path.replace(/^\//, ""), baseUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      Cookie: `accessToken=${this.token}`,
      "x-tenant-slug": this.tenant,
      ...(this.permTicket ? { "X-Perm-Ticket": this.permTicket } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    };

    try {
      const response = await fetch(url, {
        ...init,
        headers,
      });
      if (!response.ok) return null;
      const text = await response.text();
      return (text ? JSON.parse(text) : {}) as T;
    } catch {
      return null;
    }
  }

  async createTask(input: {
    title: string;
    description: string;
    customerId?: string;
    priority?: string;
  }): Promise<{ id: string; mocked: boolean }> {
    // Teftero source reference:
    // ERP.Web/src/app/api/[tenant]/task-management/tasks/route.ts posts to
    // /api/{tenant}/task-management/tasks after sanitizing TaskIm payloads.
    // Keep this method boundary stable while mapping the MVP shape to TaskIm.
    const result = await this.request<UnknownRecord>(
      `/api/${this.tenant}/task-management/tasks`,
      {
        method: "POST",
        body: JSON.stringify(buildTaskPayload(input)),
      },
    );
    const id = textValue(result?.id ?? result?.taskId ?? result?.taskItemId);
    if (id) return { id, mocked: false };
    return super.createTask(input);
  }

  async getCustomer(customerNameOrId: string): Promise<Artifact | null> {
    // Teftero source reference:
    // ERP.Web/src/app/api/[tenant]/contacts/companies/route.ts exposes
    // /api/{tenant}/contacts/companies and /api/{tenant}/contacts/companies/{id}.
    const byId = await this.request<UnknownRecord>(
      `/api/${this.tenant}/contacts/companies/${encodeURIComponent(customerNameOrId)}`,
    );
    if (byId?.id) return realCompanyArtifact(byId);

    const companies = asArray<UnknownRecord>(
      await this.request<UnknownRecord[] | { items?: UnknownRecord[] }>(
        `/api/${this.tenant}/contacts/companies`,
      ),
    );
    const target = customerNameOrId.toLowerCase();
    const company = companies.find((item) => {
      const id = textValue(item.id ?? item.companyId).toLowerCase();
      const name = textValue(item.name ?? item.companyName).toLowerCase();
      return id === target || name === target || name.includes(target);
    });
    if (company) return realCompanyArtifact(company);
    return super.getCustomer(customerNameOrId);
  }

  async getInvoices(customerId?: string): Promise<Artifact[]> {
    // Teftero source reference:
    // ERP.Web/src/app/api/[tenant]/finance/incoming-invoice/route.ts exposes
    // /api/{tenant}/finance/incoming-invoice for invoice lists.
    const invoices = asArray<UnknownRecord>(
      await this.request<UnknownRecord[] | { items?: UnknownRecord[] }>(
        `/api/${this.tenant}/finance/incoming-invoice`,
      ),
    );
    const artifacts = invoices.map(realIncomingInvoiceArtifact).filter((artifact) => {
      if (!customerId) return true;
      const target = customerId.toLowerCase();
      return (
        artifact.id.toLowerCase() === target ||
        artifact.text.toLowerCase().includes(target) ||
        artifact.title.toLowerCase().includes(target)
      );
    });
    if (artifacts.length) return artifacts;
    return super.getInvoices(customerId);
  }
}

export function getTefteroErpAdapter(): TefteroErpAdapter {
  if (process.env.TEFTERO_USE_REAL_API === "true") {
    return new RealTefteroErpAdapter();
  }
  return new MockTefteroErpAdapter();
}

export async function listErpArtifacts() {
  const adapter = getTefteroErpAdapter();
  const customers = await Promise.all(
    ["Acme", "BetaCo"].map((customer) => adapter.getCustomer(customer)),
  );
  return [
    ...customers.filter((customer): customer is Artifact => Boolean(customer)),
    ...(await adapter.getInvoices()),
  ];
}
