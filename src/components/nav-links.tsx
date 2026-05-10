"use client";

import {
  BookOpenText,
  CreditCard,
  FileText,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/app", label: "Cockpit", icon: LayoutDashboard, exact: true },
  { href: "/app/quotes", label: "Devis", icon: FileText, exact: false },
  { href: "/app/invoices", label: "Factures", icon: ReceiptText, exact: false },
  { href: "/app/clients", label: "Clients", icon: Users, exact: false },
  { href: "/app/items", label: "Ouvrages", icon: BookOpenText, exact: false },
];

const settingsNavItems = [
  { href: "/app/billing", label: "Abonnement", icon: CreditCard, exact: false },
  { href: "/app/data", label: "Données", icon: ShieldCheck, exact: false },
  { href: "/app/settings", label: "Entreprise", icon: Settings, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  pathname: string;
}) {
  const active = isActive(pathname, href, exact);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active
          ? "bg-white/12 text-white"
          : "text-[#c8d4e0] hover:bg-white/7 hover:text-white",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function SidebarNavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="sidebar-nav flex-1 space-y-0.5 px-3 py-2">
      <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/35">
        Activité
      </p>
      {mainNavItems.map((item) => (
        <NavItem key={item.href} {...item} pathname={pathname} />
      ))}
      <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
        Compte
      </p>
      {settingsNavItems.map((item) => (
        <NavItem key={item.href} {...item} pathname={pathname} />
      ))}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();
  const allItems = [...mainNavItems, ...settingsNavItems];
  return (
    <>
      {allItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-card text-foreground hover:border-[#c0c9d8] hover:text-primary",
            )}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
