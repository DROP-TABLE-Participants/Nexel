import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FULL_TOKENS = 145.7;
const CONSUMED_TOKENS = 98.5;
const SAVED_TOKENS = 47.2;
const SAVED_PCT = Math.round((SAVED_TOKENS / FULL_TOKENS) * 100);
const CONSUMED_PCT = 100 - SAVED_PCT;

function fmt(n: number) {
  return `${n.toFixed(1)}M`;
}

export function SavingsWaterfall() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Context optimization</CardTitle>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded-md">
            June 2026
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Flow labels */}
        <div className="flex items-stretch gap-0">
          {/* Full context */}
          <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
              Full context
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-[var(--foreground)]">{fmt(FULL_TOKENS)}</span>
              <span className="text-xs text-[var(--muted-foreground)]">tokens</span>
            </div>
            <span className="text-sm font-medium text-[var(--muted-foreground)]">$9,242</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center px-4 text-[var(--border)]">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
              <path d="M0 8H20M20 8L14 2M20 8L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Nexel optimization */}
          <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide">
              Nexel cuts
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-[var(--primary)]">−{fmt(SAVED_TOKENS)}</span>
              <span className="text-xs text-[var(--primary)]/70">tokens</span>
            </div>
            <span className="text-sm font-medium text-[var(--primary)]/80">−$4,821</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center px-4 text-[var(--border)]">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
              <path d="M0 8H20M20 8L14 2M20 8L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Delivered */}
          <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
              Agents receive
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-[var(--foreground)]">{fmt(CONSUMED_TOKENS)}</span>
              <span className="text-xs text-[var(--muted-foreground)]">tokens</span>
            </div>
            <span className="text-sm font-medium text-[var(--muted-foreground)]">$4,421</span>
          </div>
        </div>

        {/* Bar */}
        <div className="space-y-1.5">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-l-full bg-[var(--foreground)]/15 transition-all"
              style={{ width: `${CONSUMED_PCT}%` }}
            />
            <div
              className="h-full flex-1 rounded-r-full bg-[var(--primary)]"
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>{CONSUMED_PCT}% delivered to agents</span>
            <span className="text-[var(--primary)] font-medium">{SAVED_PCT}% optimized away</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
