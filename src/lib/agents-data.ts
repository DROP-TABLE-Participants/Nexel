export type AgentStatus = "healthy" | "warning" | "error";

export interface Agent {
  id: string;
  name: string;
  model: string;
  connection: string;
  status: AgentStatus;
  tokens: string;
  cost: string;
  saved: string;
  dataUnits: string;
  iconColor: string;
  activeContexts: string[];
  sourcesAccess: string[];
}

export const FULL_CONTEXTS = [
  { name: "Communication", value: 30, color: "#6338fe" },
  { name: "Knowledge",     value: 22, color: "#0ea5e9" },
  { name: "Customers",     value: 18, color: "#10b981" },
  { name: "Development",   value: 14, color: "#f59e0b" },
  { name: "Projects",      value: 9,  color: "#ec4899" },
  { name: "Finance",       value: 5,  color: "#8b5cf6" },
  { name: "HR",            value: 2,  color: "#f97316" },
];

// How much of each context the agent actually uses (for active ones)
export const AGENT_CONTEXT_USAGE: Record<string, Record<string, number>> = {
  invoice_ops: {
    Communication: 52,
    Knowledge:     80,
    Customers:     76,
    Projects:      28,
    Finance:       92,
  },
  mcp_reporter: {
    Knowledge:     68,
    Customers:     62,
    Finance:       86,
    Communication: 24,
  },
  collections: {
    Communication: 70,
    Knowledge:     42,
    Customers:     80,
    Finance:       74,
  },
};

export interface ContextUnit {
  id: string;
  name: string;
  parent: string;
  color: string;
}

export const CONTEXT_UNITS: ContextUnit[] = [
  // Communication
  { id: "emails",        name: "Emails",           parent: "Communication", color: "#6338fe" },
  { id: "slack-msgs",    name: "Slack Messages",   parent: "Communication", color: "#6338fe" },
  { id: "discord-chats", name: "Discord Chats",    parent: "Communication", color: "#6338fe" },
  { id: "meeting-notes", name: "Meeting Notes",    parent: "Communication", color: "#6338fe" },
  // Knowledge
  { id: "documents",     name: "Documents",        parent: "Knowledge",     color: "#0ea5e9" },
  { id: "wiki-pages",    name: "Wiki Pages",       parent: "Knowledge",     color: "#0ea5e9" },
  { id: "runbooks",      name: "Runbooks",         parent: "Knowledge",     color: "#0ea5e9" },
  { id: "product-specs", name: "Product Specs",    parent: "Knowledge",     color: "#0ea5e9" },
  // Customers
  { id: "crm-contacts",  name: "CRM Contacts",     parent: "Customers",     color: "#10b981" },
  { id: "cust-feedback", name: "Feedback",         parent: "Customers",     color: "#10b981" },
  { id: "support-tickets", name: "Support Tickets", parent: "Customers",   color: "#10b981" },
  // Development
  { id: "code-repos",    name: "Code Repos",       parent: "Development",   color: "#f59e0b" },
  { id: "pull-requests", name: "Pull Requests",    parent: "Development",   color: "#f59e0b" },
  { id: "bug-reports",   name: "Bug Reports",      parent: "Development",   color: "#f59e0b" },
  { id: "ci-logs",       name: "CI/CD Logs",       parent: "Development",   color: "#f59e0b" },
  // Projects
  { id: "tasks",         name: "Tasks",            parent: "Projects",      color: "#ec4899" },
  { id: "sprints",       name: "Sprints",          parent: "Projects",      color: "#ec4899" },
  { id: "roadmaps",      name: "Roadmaps",         parent: "Projects",      color: "#ec4899" },
  // Finance
  { id: "invoices",      name: "Invoices",         parent: "Finance",       color: "#8b5cf6" },
  { id: "expenses",      name: "Expenses",         parent: "Finance",       color: "#8b5cf6" },
  { id: "contracts",     name: "Contracts",        parent: "Finance",       color: "#8b5cf6" },
  { id: "rev-reports",   name: "Revenue Reports",  parent: "Finance",       color: "#8b5cf6" },
  // HR
  { id: "emp-profiles",  name: "Employee Profiles", parent: "HR",           color: "#f97316" },
  { id: "org-chart",     name: "Org Chart",        parent: "HR",            color: "#f97316" },
  { id: "job-postings",  name: "Job Postings",     parent: "HR",            color: "#f97316" },
];

export const AGENT_ACTIVE_UNITS: Record<string, string[]> = {
  invoice_ops: [
    "emails", "slack-msgs",
    "documents", "wiki-pages", "runbooks",
    "crm-contacts", "cust-feedback",
    "tasks",
    "invoices", "expenses", "contracts", "rev-reports",
  ],
  mcp_reporter: [
    "documents", "wiki-pages", "runbooks",
    "crm-contacts",
    "invoices", "rev-reports",
  ],
  collections: [
    "emails", "meeting-notes",
    "documents", "runbooks",
    "crm-contacts", "cust-feedback",
    "invoices", "contracts",
  ],
};

export const ALL_SOURCES = [
  { id: "notion",  name: "Notion" },
  { id: "gdrive",  name: "Google Drive" },
  { id: "teftero", name: "Teftero ERP" },
  { id: "gmail",   name: "Gmail" },
];

export const AGENTS: Agent[] = [
  {
    id: "invoice_ops",
    name: "Invoice Operations",
    model: "GPT-5.2",
    connection: "MCP",
    status: "healthy",
    tokens: "12.8M",
    cost: "$384",
    saved: "$912",
    dataUnits: "4,180",
    iconColor: "#000000",
    activeContexts: ["Finance", "Customers", "Knowledge", "Communication"],
    sourcesAccess: ["notion", "gdrive", "teftero", "gmail"],
  },
  {
    id: "mcp_reporter",
    name: "MCP Report Client",
    model: "Claude Desktop",
    connection: "MCP",
    status: "healthy",
    tokens: "6.4M",
    cost: "$128",
    saved: "$476",
    dataUnits: "1,620",
    iconColor: "#d97706",
    activeContexts: ["Finance", "Knowledge", "Customers"],
    sourcesAccess: ["notion", "gdrive", "teftero"],
  },
  {
    id: "collections",
    name: "Collections Assistant",
    model: "GPT-5.2",
    connection: "Connector",
    status: "warning",
    tokens: "9.1M",
    cost: "$246",
    saved: "$608",
    dataUnits: "2,740",
    iconColor: "#d97706",
    activeContexts: ["Finance", "Customers", "Communication", "Knowledge"],
    sourcesAccess: ["notion", "gdrive", "gmail"],
  },
];
