import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction, resendVerificationEmailAction } from "@/server/auth-actions";
import type { User } from "@prisma/client";
import { MobileNavLinks, SidebarNavLinks } from "./nav-links";

export function AppShell({ children, user }: { children: ReactNode; user: User }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[rgba(255,255,255,0.09)] bg-[#13243a] text-white lg:flex"
        aria-label="Navigation latérale"
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[rgba(255,255,255,0.09)] px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Building2 aria-hidden className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-white">
              ChantierDevis
            </p>
            <p className="text-[10px] text-white/45 uppercase tracking-wider">Cockpit BTP</p>
          </div>
        </div>

        {/* Nav */}
        <SidebarNavLinks />

        {/* User + logout */}
        <div className="shrink-0 border-t border-[rgba(255,255,255,0.09)] p-4">
          <p className="truncate text-sm font-semibold text-white">
            {user.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/50">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button
              className="text-xs font-semibold text-white/60 underline-offset-4 transition hover:text-white/90 hover:underline"
              type="submit"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border bg-[#fffdf8]/95 backdrop-blur-sm">
          <div className="flex min-h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Mobile: logo */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary lg:hidden"
            >
              <Building2 aria-hidden className="h-5 w-5 text-accent" />
              ChantierDevis
            </Link>
            {/* Desktop: context label */}
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-muted">Espace artisan</p>
            </div>
            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/app/quotes/new"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cc5810] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-[#b54d0e]"
              >
                <Plus aria-hidden className="h-4 w-4" />
                Nouveau devis
              </Link>
            </div>
          </div>
          {/* Mobile nav */}
          <nav
            aria-label="Navigation mobile"
            className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden"
          >
            <MobileNavLinks />
          </nav>
        </header>

        {/* Email verification banner */}
        {!user.emailVerifiedAt ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Email non vérifié.</span>{" "}
                Vérifiez votre adresse pour sécuriser les envois de devis.
              </p>
              <form action={resendVerificationEmailAction}>
                <button
                  className="shrink-0 text-sm font-semibold text-amber-900 underline underline-offset-4"
                  type="submit"
                >
                  Renvoyer l&apos;email
                </button>
              </form>
            </div>
          </div>
        ) : null}

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
