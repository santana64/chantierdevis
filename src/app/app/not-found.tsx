import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 border border-border">
        <Search aria-hidden className="h-7 w-7 text-muted" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-foreground">Page introuvable</h2>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Ce document n&apos;existe pas ou ne vous appartient pas.
      </p>
      <Link
        href="/app"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white transition hover:bg-[#cc5810]"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
        Tableau de bord
      </Link>
    </div>
  );
}
