"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexelLogo } from "@/components/ui/nexel-logo";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/sources", label: "Data Sources", icon: Database },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] flex-shrink-0">
      <div className="flex h-14 items-center px-4">
        <NexelLogo />
      </div>

      <Separator />

      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  : "text-[var(--sidebar-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
