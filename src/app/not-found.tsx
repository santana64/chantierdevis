import { ArrowLeft, Hammer } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <Hammer aria-hidden className="h-8 w-8 text-accent" />
      </div>
      <h1 className="mt-6 text-6xl font-black tabular-nums text-foreground">404</h1>
      <p className="mt-3 text-xl font-bold text-foreground">Page introuvable</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Cette page n&apos;existe pas ou a été déplacée. Retournez au tableau de bord.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/app"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-white transition hover:bg-[#cc5810]"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Tableau de bord
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-white"
        >
          Accueil
        </Link>
      </div>
    </main>
  );
}
