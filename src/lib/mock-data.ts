export const tokenUsageData = [
  { day: "Jun 1",  tokens: 1200000, unoptimized: 2100000,  cost: 1.44 },
  { day: "Jun 2",  tokens: 980000,  unoptimized: 1720000,  cost: 1.18 },
  { day: "Jun 3",  tokens: 1450000, unoptimized: 2530000,  cost: 1.74 },
  { day: "Jun 4",  tokens: 2100000, unoptimized: 3780000,  cost: 2.52 },
  { day: "Jun 5",  tokens: 1870000, unoptimized: 3270000,  cost: 2.24 },
  { day: "Jun 6",  tokens: 2340000, unoptimized: 4090000,  cost: 2.81 },
  { day: "Jun 7",  tokens: 1960000, unoptimized: 3430000,  cost: 2.35 },
  { day: "Jun 8",  tokens: 3100000, unoptimized: 5420000,  cost: 3.72 },
  { day: "Jun 9",  tokens: 2780000, unoptimized: 4860000,  cost: 3.34 },
  { day: "Jun 10", tokens: 2450000, unoptimized: 4290000,  cost: 2.94 },
  { day: "Jun 11", tokens: 1890000, unoptimized: 3310000,  cost: 2.27 },
  { day: "Jun 12", tokens: 3250000, unoptimized: 5690000,  cost: 3.90 },
  { day: "Jun 13", tokens: 2900000, unoptimized: 5070000,  cost: 3.48 },
  { day: "Jun 14", tokens: 3400000, unoptimized: 5950000,  cost: 4.08 },
  { day: "Jun 15", tokens: 2800000, unoptimized: 4900000,  cost: 3.36 },
  { day: "Jun 16", tokens: 3600000, unoptimized: 6300000,  cost: 4.32 },
  { day: "Jun 17", tokens: 3100000, unoptimized: 5430000,  cost: 3.72 },
  { day: "Jun 18", tokens: 4200000, unoptimized: 7350000,  cost: 5.04 },
  { day: "Jun 19", tokens: 3800000, unoptimized: 6650000,  cost: 4.56 },
  { day: "Jun 20", tokens: 4100000, unoptimized: 7180000,  cost: 4.92 },
  { day: "Jun 21", tokens: 3500000, unoptimized: 6130000,  cost: 4.20 },
  { day: "Jun 22", tokens: 4800000, unoptimized: 8400000,  cost: 5.76 },
  { day: "Jun 23", tokens: 4300000, unoptimized: 7530000,  cost: 5.16 },
  { day: "Jun 24", tokens: 5100000, unoptimized: 8930000,  cost: 6.12 },
  { day: "Jun 25", tokens: 4600000, unoptimized: 8050000,  cost: 5.52 },
  { day: "Jun 26", tokens: 5400000, unoptimized: 9450000,  cost: 6.48 },
  { day: "Jun 27", tokens: 4900000, unoptimized: 8580000,  cost: 5.88 },
  { day: "Jun 28", tokens: 5800000, unoptimized: 10150000, cost: 6.96 },
  { day: "Jun 29", tokens: 5200000, unoptimized: 9100000,  cost: 6.24 },
  { day: "Jun 30", tokens: 6100000, unoptimized: 10680000, cost: 7.32 },
];

export const connectorStatuses = [
  { name: "Slack", status: "healthy" as const, lastSync: "2 min ago" },
  { name: "Notion", status: "healthy" as const, lastSync: "5 min ago" },
  { name: "Google Drive", status: "healthy" as const, lastSync: "12 min ago" },
  { name: "Jira", status: "warning" as const, lastSync: "1 hr ago" },
  { name: "Discord", status: "healthy" as const, lastSync: "8 min ago" },
  { name: "GitHub", status: "healthy" as const, lastSync: "3 min ago" },
];

export interface ActivityItem {
  id: number;
  type: "agent_query" | "sync" | "warning";
  label: string;
  time: string;
  agent: string | null;
  detail?: {
    tokens: string;
    tokensOptimized: string;
    costSaved: string;
    duration: string;
    contexts: string[];
  };
}

export const recentActivity: ActivityItem[] = [
  {
    id: 1, type: "agent_query", label: "Sales Assistant queried Customer context", time: "1 min ago", agent: "Sales Assistant",
    detail: { tokens: "124,300", tokensOptimized: "89,400", costSaved: "$0.09", duration: "1.2s", contexts: ["Customers", "Finance"] },
  },
  { id: 2, type: "sync", label: "Slack synced 1,243 new messages", time: "2 min ago", agent: null },
  {
    id: 3, type: "agent_query", label: "Support Bot queried Tickets + Docs context", time: "4 min ago", agent: "Support Bot",
    detail: { tokens: "98,700", tokensOptimized: "61,200", costSaved: "$0.06", duration: "0.9s", contexts: ["Knowledge", "Projects"] },
  },
  { id: 4, type: "sync", label: "Notion synced 48 updated pages", time: "8 min ago", agent: null },
  {
    id: 5, type: "agent_query", label: "Dev Assistant queried Code + Docs context", time: "11 min ago", agent: "Dev Assistant",
    detail: { tokens: "211,500", tokensOptimized: "143,800", costSaved: "$0.14", duration: "1.7s", contexts: ["Development", "Knowledge", "Projects"] },
  },
  { id: 6, type: "warning", label: "Jira sync delayed — retrying", time: "1 hr ago", agent: null },
  {
    id: 7, type: "agent_query", label: "Sales Assistant queried Invoices context", time: "1 hr ago", agent: "Sales Assistant",
    detail: { tokens: "87,200", tokensOptimized: "52,100", costSaved: "$0.05", duration: "0.8s", contexts: ["Finance", "Customers"] },
  },
];
