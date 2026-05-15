"use client";

import { useEffect } from "react";
import { ArrowLeft, Hammer, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f4] px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
        <Hammer aria-hidden className="h-8 w-8 text-red-400" />
      </div>
      <h1 className="mt-6 text-2xl font-black text-foreground">Une erreur est survenue</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Quelque chose s&apos;est mal passé. Réessayez ou retournez au tableau de bord.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-muted/50">Réf. {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-white transition hover:bg-[#cc5810]"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/app"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-semibold text-foreground transition hover:bg-slate-50"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Tableau de bord
        </Link>
      </div>
    </main>
  );
}
