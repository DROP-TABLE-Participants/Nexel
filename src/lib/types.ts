export type AgentRole = "sales_outreach" | "teftero" | "voice_support";

export type DemoMode = "naive" | "company_brain";

export type ConnectorName =
  | "gmail"
  | "google_drive"
  | "teftero_erp"
  | "local_mock";

export type Artifact = {
  id: string;
  connector: ConnectorName;
  sourceType:
    | "email"
    | "drive_doc"
    | "erp_customer"
    | "erp_invoice"
    | "erp_task"
    | "voice_transcript"
    | "policy"
    | "template"
    | "restricted_doc";
  title: string;
  text: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  entities: {
    people?: string[];
    companies?: string[];
    customers?: string[];
    products?: string[];
    invoices?: string[];
    orders?: string[];
    tickets?: string[];
    industries?: string[];
  };
  metadata: Record<string, unknown>;
  access: {
    allowedAgents: AgentRole[];
    forbiddenAgents?: AgentRole[];
    sensitivity: "public" | "internal" | "customer_safe" | "finance" | "restricted";
    department: "sales" | "support" | "erp" | "finance" | "general" | "restricted";
  };
};

export type Chunk = {
  id: string;
  artifactId: string;
  text: string;
  embedding?: number[];
  metadata: {
    connector: ConnectorName;
    sourceType: Artifact["sourceType"];
    title: string;
    allowedAgents: AgentRole[];
    sensitivity: Artifact["access"]["sensitivity"];
    department: Artifact["access"]["department"];
    entities: string[];
  };
};

export type AgentPolicy = {
  role: AgentRole;
  displayName: string;
  jobDescription: string;
  allowedConnectors: ConnectorName[];
  allowedDepartments: Artifact["access"]["department"][];
  allowedSensitivity: Artifact["access"]["sensitivity"][];
  forbiddenSourceTypes: Artifact["sourceType"][];
  requiredContextTypes: string[];
  allowedActions: string[];
  maxSources: number;
  maxContextTokens: number;
};

export type EvidenceFact = {
  claim: string;
  sourceId: string;
  sourceTitle: string;
  confidence: number;
};

export type EvidencePack = {
  mode: "company_brain";
  agentRole: AgentRole;
  task: string;
  resolvedEntities: Record<string, string[]>;
  requiredContext: string[];
  summary: string;
  facts: EvidenceFact[];
  recommendedActions: string[];
  sources: {
    id: string;
    title: string;
    connector: ConnectorName;
    sourceType: string;
    relevance: number;
  }[];
  blockedSources: {
    id: string;
    title: string;
    reason: string;
  }[];
  missingInfo: string[];
};

export type AgentAction = {
  tool: string;
  status: "success" | "mocked" | "failed" | "pending_approval";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type RunMetrics = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
  contextCharacters: number;
  sourcesRetrieved: number;
  relevantSources: number;
  forbiddenSourcesReturned: number;
  forbiddenSourcesBlocked: number;
  sourcePrecision: number;
  actionSuccessRate: number;
  qualityScore: number;
  runtimeMs: number;
  tokenUsageKind: "measured" | "estimated";
};

export type AgentRun = {
  id: string;
  scenarioId: string;
  mode: DemoMode;
  agentRole: AgentRole;
  task: string;
  context: string | EvidencePack;
  output: Record<string, unknown>;
  actions: AgentAction[];
  metrics: RunMetrics;
  createdAt: string;
};

export type RetrievedSource = {
  chunkId: string;
  artifactId: string;
  title: string;
  connector: ConnectorName;
  sourceType: Artifact["sourceType"];
  department: Artifact["access"]["department"];
  sensitivity: Artifact["access"]["sensitivity"];
  relevance: number;
  text: string;
};

export type Scenario = {
  id: string;
  agentRole: AgentRole;
  title: string;
  task: string;
  input: Record<string, unknown>;
  expectedSources: string[];
  forbiddenSources: string[];
  expectedActions: string[];
  expectedFacts: string[];
};

export type AgentModelUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AgentExecutionResult = {
  output: Record<string, unknown>;
  modelUsage?: AgentModelUsage;
};

export type DataUsageItem = {
  sourceId: string;
  title: string;
  connector: ConnectorName;
  sourceType: Artifact["sourceType"] | string;
  department: Artifact["access"]["department"] | string;
  sensitivity: Artifact["access"]["sensitivity"] | string;
  characters: number;
  estimatedTokens: number;
  relevance?: number;
};

export type McpCallTelemetry = {
  id: string;
  toolName: string;
  clientName: string;
  agentRole: AgentRole | "system";
  mode?: DemoMode;
  scenarioId?: string;
  task: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  usage: AgentModelUsage & {
    totalTokens: number;
    tokenUsageKind: "measured" | "estimated";
    estimatedCostUsd: number;
    baselineTokens?: number;
    baselineCostUsd?: number;
    moneySavedUsd: number;
  };
  dataUsed: DataUsageItem[];
  blockedSources: EvidencePack["blockedSources"];
  permissionSnapshot: AgentPolicy | Record<string, unknown>;
  createdAt: string;
};
