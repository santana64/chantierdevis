import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" &&
          "bg-primary text-white shadow-sm ring-1 ring-primary/10 hover:bg-[#162d47] active:bg-[#111f30]",
        variant === "secondary" &&
          "border border-border bg-white text-foreground shadow-sm hover:border-[#c0c9d8] hover:bg-[#fffdf8] active:bg-gray-50",
        variant === "ghost" &&
          "text-primary hover:bg-white/80 hover:text-[#162d47]",
        variant === "danger" &&
          "bg-danger text-white shadow-sm hover:bg-red-800 active:bg-red-900",
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" &&
          "bg-primary text-white shadow-sm ring-1 ring-primary/10 hover:bg-[#162d47] active:bg-[#111f30]",
        variant === "secondary" &&
          "border border-border bg-white text-foreground shadow-sm hover:border-[#c0c9d8] hover:bg-[#fffdf8] active:bg-gray-50",
        variant === "ghost" &&
          "text-primary hover:bg-white/80 hover:text-[#162d47]",
        variant === "danger" &&
          "bg-danger text-white shadow-sm hover:bg-red-800 active:bg-red-900",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card shadow-[0_1px_0_rgba(26,35,50,0.04),0_8px_24px_rgba(26,35,50,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-white/55 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-normal text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "min-h-10 rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-slate-400 focus:border-accent focus:outline-2 focus:outline-accent/25 hover:border-[#c0c9d8]";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white/60 p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function WarningNotice({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <strong className="block font-semibold text-amber-900">{title}</strong>
      <div className="mt-1 text-amber-800">{children}</div>
    </div>
  );
}

export function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
      {children}
    </div>
  );
}

export function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
      {children}
    </div>
  );
}

export function DangerNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      {children}
    </div>
  );
}

export function LegalDisclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      {children}
    </div>
  );
}

export function SectionDivider({ label }: { label?: string }) {
  if (!label) return <hr className="border-border" />;
  return (
    <div className="flex items-center gap-4">
      <hr className="flex-1 border-border" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  );
}
