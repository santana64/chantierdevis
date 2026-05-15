"use client";

import { useEffect } from "react";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function AppError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
        <TriangleAlert aria-hidden className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-foreground">Une erreur est survenue</h2>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Impossible de charger cette page. Réessayez ou revenez à l&apos;accueil.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-muted/50">Réf. {error.digest}</p>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white transition hover:bg-[#cc5810]"
        >
          <RefreshCw aria-hidden className="h-3.5 w-3.5" />
          Réessayer
        </button>
        <Link
          href="/app"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-slate-50"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
