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
  sales: {
    Communication: 62,
    Knowledge:     44,
    Customers:     88,
    Projects:      35,
    Finance:       71,
  },
  support: {
    Knowledge:     80,
    Communication: 55,
    Customers:     70,
    Projects:      28,
  },
  dev: {
    Development:   90,
    Knowledge:     60,
    Projects:      75,
    Communication: 30,
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
  sales: [
    "emails", "slack-msgs", "meeting-notes",
    "documents", "product-specs",
    "crm-contacts", "cust-feedback",
    "tasks",
    "invoices", "contracts", "rev-reports",
  ],
  support: [
    "emails", "slack-msgs",
    "documents", "wiki-pages", "runbooks",
    "cust-feedback", "support-tickets",
    "tasks", "sprints",
  ],
  dev: [
    "slack-msgs", "discord-chats",
    "documents", "wiki-pages", "product-specs", "runbooks",
    "code-repos", "pull-requests", "bug-reports", "ci-logs",
    "tasks", "sprints", "roadmaps",
  ],
};

export const ALL_SOURCES = [
  { id: "slack",   name: "Slack" },
  { id: "notion",  name: "Notion" },
  { id: "gdrive",  name: "Google Drive" },
  { id: "jira",    name: "Jira" },
  { id: "discord", name: "Discord" },
  { id: "github",  name: "GitHub" },
  { id: "gmail",   name: "Gmail" },
];

export const AGENTS: Agent[] = [
  {
    id: "sales",
    name: "Sales Assistant",
    model: "GPT-4o",
    connection: "MCP",
    status: "healthy",
    tokens: "41.2M",
    cost: "$1,892",
    saved: "$2,105",
    dataUnits: "12,400",
    iconColor: "#000000",
    activeContexts: ["Customers", "Communication", "Knowledge", "Projects", "Finance"],
    sourcesAccess: ["slack", "notion", "gdrive", "jira"],
  },
  {
    id: "support",
    name: "Support Bot",
    model: "Claude Sonnet",
    connection: "Connector",
    status: "healthy",
    tokens: "38.7M",
    cost: "$1,780",
    saved: "$1,943",
    dataUnits: "11,200",
    iconColor: "#d97706",
    activeContexts: ["Knowledge", "Communication", "Customers", "Projects"],
    sourcesAccess: ["slack", "notion", "jira", "discord"],
  },
  {
    id: "dev",
    name: "Dev Assistant",
    model: "Claude Opus",
    connection: "MCP",
    status: "healthy",
    tokens: "18.6M",
    cost: "$749",
    saved: "$773",
    dataUnits: "5,800",
    iconColor: "#d97706",
    activeContexts: ["Development", "Knowledge", "Projects", "Communication"],
    sourcesAccess: ["github", "notion", "jira", "slack"],
  },
];
