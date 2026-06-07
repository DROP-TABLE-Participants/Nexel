"use client";

import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-8 p-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Manage your workspace preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--foreground)]">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Dark mode</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Switch between light and dark theme</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--foreground)]">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Workspace name</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Acme Corp</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Plan</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Pro · Billed monthly</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Role</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Admin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
