"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { tokenUsageData } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

const showEvery = 5;

export function TokenChart() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Token usage</CardTitle>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded-md">June 2026</span>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">98.5M</span>
          <span className="text-sm text-[var(--muted-foreground)]">tokens this month</span>
          <span className="ml-auto text-sm font-medium text-emerald-600 dark:text-emerald-400">↑ 34% vs last month</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={tokenUsageData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6338fe" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6338fe" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="unoptGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#71717a" stopOpacity={0.10} />
                <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval={showEvery - 1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTokens}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--foreground)",
              }}
              formatter={(val, name) => [
                `${formatTokens(Number(val))} tokens`,
                name === "tokens" ? "With Nexel" : "Without Nexel",
              ]}
              labelStyle={{ color: "var(--muted-foreground)" }}
              cursor={{ stroke: "var(--border)" }}
            />
            {/* Grey "without optimization" line — rendered first so it sits behind */}
            <Area
              type="monotone"
              dataKey="unoptimized"
              stroke="#a1a1aa"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="url(#unoptGradient)"
              dot={false}
              activeDot={{ r: 3, fill: "#a1a1aa", strokeWidth: 0 }}
            />
            {/* Purple optimized line on top */}
            <Area
              type="monotone"
              dataKey="tokens"
              stroke="#6338fe"
              strokeWidth={2}
              fill="url(#tokenGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#6338fe", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
