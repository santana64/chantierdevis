import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  accent?: "green" | "amber" | "red" | "blue";
}) {
  const accentBar: Record<string, string> = {
    green: "border-l-4 border-l-green-600",
    amber: "border-l-4 border-l-amber-500",
    red: "border-l-4 border-l-red-600",
    blue: "border-l-4 border-l-primary",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white p-5 shadow-[0_1px_0_rgba(26,35,50,0.04),0_8px_22px_rgba(26,35,50,0.035)]",
        accent && accentBar[accent],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
            {value}
          </p>
          {detail ? (
            <p className="mt-1 truncate text-xs text-muted">{detail}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-[#f8fafc] text-primary">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
