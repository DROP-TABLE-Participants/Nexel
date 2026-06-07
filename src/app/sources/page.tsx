"use client";

import { useState } from "react";
import { Plus, Search, RefreshCw, Settings2, Copy, Eye, EyeOff, RotateCcw } from "lucide-react";
import {
  SiSlack, SiNotion, SiGoogledrive, SiJira, SiDiscord, SiGithub,
  SiLinear, SiHubspot, SiSalesforce, SiConfluence, SiGmail,
  SiAsana, SiZendesk, SiIntercom, SiDropbox, SiTrello, SiAirtable, SiFigma,
} from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type IconType } from "react-icons";

type ConnectorStatus = "healthy" | "warning" | "error";

interface Connector {
  id: string;
  name: string;
  category: string;
  status: ConnectorStatus;
  lastSync: string;
  records: string;
  Icon: IconType;
  color: string;
  apiKey: string;
  accessToken: string;
  authType: string;
  syncFrequency: string;
  nextSync: string;
  syncHistory: { time: string; records: string }[];
}

const connectors: Connector[] = [
  {
    id: "slack", name: "Slack", category: "Communication", status: "healthy",
    lastSync: "2 min ago", records: "142,830 messages", Icon: SiSlack, color: "#4A154B",
    apiKey: "sk-slack-a1b2c3d4e5f6", accessToken: "xoxb-7890-abcdef-ghijkl",
    authType: "OAuth 2.0", syncFrequency: "Every 5 min", nextSync: "in 3 min",
    syncHistory: [
      { time: "Jun 7, 10:42 AM", records: "1,243 new messages" },
      { time: "Jun 7, 10:37 AM", records: "892 new messages" },
      { time: "Jun 7, 10:32 AM", records: "2,104 new messages" },
      { time: "Jun 7, 10:27 AM", records: "567 new messages" },
      { time: "Jun 7, 10:22 AM", records: "1,890 new messages" },
      { time: "Jun 7, 10:17 AM", records: "334 new messages" },
      { time: "Jun 7, 10:12 AM", records: "721 new messages" },
    ],
  },
  {
    id: "notion", name: "Notion", category: "Knowledge", status: "healthy",
    lastSync: "5 min ago", records: "3,241 pages", Icon: SiNotion, color: "#000000",
    apiKey: "secret_notion_k9l8m7n6", accessToken: "ntn-o5p4q3r2s1t0",
    authType: "API Key", syncFrequency: "Every 10 min", nextSync: "in 5 min",
    syncHistory: [
      { time: "Jun 7, 10:40 AM", records: "48 updated pages" },
      { time: "Jun 7, 10:30 AM", records: "12 updated pages" },
      { time: "Jun 7, 10:20 AM", records: "31 updated pages" },
      { time: "Jun 7, 10:10 AM", records: "7 updated pages" },
    ],
  },
  {
    id: "gdrive", name: "Google Drive", category: "Storage", status: "healthy",
    lastSync: "12 min ago", records: "8,902 files", Icon: SiGoogledrive, color: "#1FA463",
    apiKey: "AIza-gdrive-u9v8w7x6y5z4", accessToken: "ya29.gdrive-access-token",
    authType: "OAuth 2.0", syncFrequency: "Every 15 min", nextSync: "in 3 min",
    syncHistory: [
      { time: "Jun 7, 10:33 AM", records: "204 new files" },
      { time: "Jun 7, 10:18 AM", records: "89 new files" },
      { time: "Jun 7, 10:03 AM", records: "341 new files" },
      { time: "Jun 7, 9:48 AM", records: "56 new files" },
    ],
  },
  {
    id: "jira", name: "Jira", category: "Project Management", status: "warning",
    lastSync: "1 hr ago", records: "4,120 tickets", Icon: SiJira, color: "#0052CC",
    apiKey: "jira-api-a2b3c4d5e6f7", accessToken: "jira-tok-g8h9i0j1k2l3",
    authType: "API Token", syncFrequency: "Every 10 min", nextSync: "Retrying...",
    syncHistory: [
      { time: "Jun 7, 9:45 AM", records: "Sync failed — timeout" },
      { time: "Jun 7, 9:35 AM", records: "34 updated tickets" },
      { time: "Jun 7, 9:25 AM", records: "12 updated tickets" },
      { time: "Jun 7, 9:15 AM", records: "78 updated tickets" },
    ],
  },
  {
    id: "discord", name: "Discord", category: "Communication", status: "healthy",
    lastSync: "8 min ago", records: "89,410 messages", Icon: SiDiscord, color: "#5865F2",
    apiKey: "discord-bot-m4n5o6p7q8r9", accessToken: "discord-tok-s0t1u2v3w4x5",
    authType: "Bot Token", syncFrequency: "Every 5 min", nextSync: "in 2 min",
    syncHistory: [
      { time: "Jun 7, 10:37 AM", records: "3,891 new messages" },
      { time: "Jun 7, 10:32 AM", records: "2,104 new messages" },
      { time: "Jun 7, 10:27 AM", records: "4,560 new messages" },
      { time: "Jun 7, 10:22 AM", records: "1,230 new messages" },
    ],
  },
  {
    id: "github", name: "GitHub", category: "Development", status: "healthy",
    lastSync: "3 min ago", records: "12,004 events", Icon: SiGithub, color: "#24292F",
    apiKey: "ghp_y6z7a8b9c0d1e2f3g4h5", accessToken: "ghs-i6j7k8l9m0n1o2p3",
    authType: "Personal Access Token", syncFrequency: "Every 5 min", nextSync: "in 2 min",
    syncHistory: [
      { time: "Jun 7, 10:42 AM", records: "87 new events" },
      { time: "Jun 7, 10:37 AM", records: "34 new events" },
      { time: "Jun 7, 10:32 AM", records: "112 new events" },
      { time: "Jun 7, 10:27 AM", records: "45 new events" },
    ],
  },
  {
    id: "gmail", name: "Gmail", category: "Communication", status: "healthy",
    lastSync: "4 min ago", records: "28,340 emails", Icon: SiGmail, color: "#EA4335",
    apiKey: "AIza-gmail-q1w2e3r4t5y6", accessToken: "ya29.gmail-access-token",
    authType: "OAuth 2.0", syncFrequency: "Every 5 min", nextSync: "in 1 min",
    syncHistory: [
      { time: "Jun 7, 10:41 AM", records: "312 new emails" },
      { time: "Jun 7, 10:36 AM", records: "187 new emails" },
      { time: "Jun 7, 10:31 AM", records: "443 new emails" },
      { time: "Jun 7, 10:26 AM", records: "98 new emails" },
    ],
  },
];

const catalogConnectors = [
  { id: "linear", name: "Linear", category: "Project Management", Icon: SiLinear, color: "#5E6AD2" },
  { id: "hubspot", name: "HubSpot", category: "CRM", Icon: SiHubspot, color: "#FF7A59" },
  { id: "salesforce", name: "Salesforce", category: "CRM", Icon: SiSalesforce, color: "#00A1E0" },
  { id: "confluence", name: "Confluence", category: "Knowledge", Icon: SiConfluence, color: "#0052CC" },
  { id: "gmail", name: "Gmail", category: "Communication", Icon: SiGmail, color: "#EA4335" },
  { id: "asana", name: "Asana", category: "Project Management", Icon: SiAsana, color: "#FC636B" },
  { id: "zendesk", name: "Zendesk", category: "Support", Icon: SiZendesk, color: "#03363D" },
  { id: "intercom", name: "Intercom", category: "Support", Icon: SiIntercom, color: "#1F8EED" },
  { id: "dropbox", name: "Dropbox", category: "Storage", Icon: SiDropbox, color: "#0061FF" },
  { id: "trello", name: "Trello", category: "Project Management", Icon: SiTrello, color: "#0052CC" },
  { id: "airtable", name: "Airtable", category: "Database", Icon: SiAirtable, color: "#18BFFF" },
  { id: "figma", name: "Figma", category: "Design", Icon: SiFigma, color: "#A259FF" },
];

const statusConfig = {
  healthy: { label: "Live", variant: "success" as const, dot: "bg-emerald-500" },
  warning: { label: "Delayed", variant: "warning" as const, dot: "bg-amber-400" },
  error: { label: "Error", variant: "destructive" as const, dot: "bg-red-500" },
};

function BrandIcon({ Icon, color, size = "md" }: { Icon: IconType; color: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-12 w-12" : size === "md" ? "h-9 w-9" : "h-7 w-7";
  const iconSize = size === "lg" ? 24 : size === "md" ? 18 : 14;
  return (
    <div
      className={cn("flex items-center justify-center rounded-lg flex-shrink-0", dims)}
      style={{ backgroundColor: `${color}18` }}
    >
      <Icon style={{ color, fontSize: iconSize }} />
    </div>
  );
}

function MaskedField({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const display = revealed ? value : value.slice(0, 4) + "●●●●●●●●" + value.slice(-4);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2">
        <code className="flex-1 text-xs font-mono text-[var(--foreground)] truncate">{display}</code>
        <button onClick={() => setRevealed(!revealed)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-shrink-0">
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button onClick={copy} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-shrink-0">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      {copied && <p className="text-xs text-[var(--primary)]">Copied!</p>}
    </div>
  );
}

const FREQUENCIES = ["Every 1 min", "Every 5 min", "Every 10 min", "Every 15 min", "Every 30 min", "Every hour", "Every 6 hours", "Daily"];

function ConnectorSheet({ connector, open, onClose }: { connector: Connector; open: boolean; onClose: () => void }) {
  const status = statusConfig[connector.status];
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [frequency, setFrequency] = useState(connector.syncFrequency);
  const HISTORY_PREVIEW = 4;
  const hasMore = connector.syncHistory.length > HISTORY_PREVIEW;
  const visibleHistory = showAllHistory ? connector.syncHistory : connector.syncHistory.slice(0, HISTORY_PREVIEW);
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        <SheetTitle>{connector.name}</SheetTitle>
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <BrandIcon Icon={connector.Icon} color={connector.color} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{connector.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">{connector.category}</p>
          </div>
          <Badge variant={status.variant} className="gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", status.dot)} />
            {status.label}
          </Badge>
        </div>

        <Separator />

        <div className="p-6 space-y-6">
          {/* Credentials */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Credentials</p>
            <div className="space-y-1 text-sm">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide font-medium">Auth type</span>
              <p className="text-sm text-[var(--foreground)]">{connector.authType}</p>
            </div>
            <MaskedField label="API Key" value={connector.apiKey} />
            <MaskedField label="Access Token" value={connector.accessToken} />
            <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Re-authenticate
            </Button>
          </div>

          <Separator />

          {/* Sync info */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Sync</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Last sync", value: connector.lastSync },
                { label: "Records",   value: connector.records   },
                { label: "Next sync", value: connector.nextSync  },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2.5">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>
            {/* Fetch frequency */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Fetch frequency</p>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          {/* Sync history */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Sync history</p>
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              showAllHistory ? "max-h-48 overflow-y-auto" : "max-h-none"
            )}>
              {visibleHistory.map((entry, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs text-[var(--muted-foreground)]">{entry.time}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    entry.records.includes("failed") ? "text-red-500" : "text-[var(--foreground)]"
                  )}>
                    {entry.records}
                  </span>
                </div>
              ))}
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="h-7 px-2 text-xs text-[var(--muted-foreground)]"
              >
                {showAllHistory ? "Show less" : `Show ${connector.syncHistory.length - HISTORY_PREVIEW} more`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddConnectorModal() {
  const [search, setSearch] = useState("");
  const filtered = catalogConnectors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DialogContent className="max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Add data source</DialogTitle>
        <p className="text-sm text-[var(--muted-foreground)]">Connect a new data source to your Nexel layer.</p>
      </DialogHeader>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input placeholder="Search integrations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="max-h-[340px] overflow-y-auto -mx-1 px-1 space-y-1">
        {filtered.map((c) => (
          <button key={c.id} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--muted)] transition-colors text-left">
            <BrandIcon Icon={c.Icon} color={c.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">{c.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{c.category}</p>
            </div>
            <span className="text-xs text-[var(--primary)] font-medium">Connect</span>
          </button>
        ))}
      </div>
    </DialogContent>
  );
}

export default function SourcesPage() {
  const [selected, setSelected] = useState<Connector | null>(null);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Data Sources</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {connectors.length} connected · {connectors.filter((c) => c.status === "healthy").length} healthy
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add source
            </Button>
          </DialogTrigger>
          <AddConnectorModal />
        </Dialog>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--muted)]/40">
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Source</span>
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Status</span>
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Last sync</span>
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Records</span>
          <span />
        </div>

        {connectors.map((connector, i) => {
          const status = statusConfig[connector.status];
          return (
            <div
              key={connector.id}
              onClick={() => setSelected(connector)}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-[var(--muted)]/40 transition-colors cursor-pointer",
                i < connectors.length - 1 && "border-b border-[var(--border)]"
              )}
            >
              <div className="flex items-center gap-3">
                <BrandIcon Icon={connector.Icon} color={connector.color} />
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{connector.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{connector.category}</p>
                </div>
              </div>

              <div>
                <Badge variant={status.variant} className="gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", status.dot)} />
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                <RefreshCw className="h-3.5 w-3.5" />
                {connector.lastSync}
              </div>

              <p className="text-sm text-[var(--muted-foreground)]">{connector.records}</p>

              <button
                onClick={(e) => { e.stopPropagation(); setSelected(connector); }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 rounded"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {selected && (
        <ConnectorSheet connector={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
