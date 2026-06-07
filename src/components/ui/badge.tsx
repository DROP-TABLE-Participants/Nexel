import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-white",
        secondary: "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]",
        outline: "border-[var(--border)] text-[var(--foreground)]",
        success: "border border-emerald-200 bg-[#ffffff] text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400",
        warning: "border border-amber-200 bg-[#ffffff] text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",
        destructive: "border border-red-200 bg-[#ffffff] text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
