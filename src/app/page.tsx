import { Bot, Zap, Sparkles, DollarSign } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TokenChart } from "@/components/dashboard/token-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Home</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">June 2026 · All systems overview</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Tokens consumed"
          value="98.5M"
          sub="sent to agents this month"
          icon={Zap}
          trend={{ value: "34%", up: true }}
        />
        <MetricCard
          title="Tokens Saved"
          value="47.2M"
          sub="32% of full context saved"
          icon={Sparkles}
          trend={{ value: "32%", up: true }}
        />
        <MetricCard
          title="Money saved"
          value="$4,821"
          sub="from optimized tokens"
          icon={DollarSign}
          accent
          trend={{ value: "28%", up: true }}
        />
        <MetricCard
          title="Active agents"
          value="3"
          sub="using data layer"
          icon={Bot}
        />
      </div>

      <TokenChart />

      <ActivityFeed />
    </div>
  );
}
