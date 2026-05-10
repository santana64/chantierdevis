"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createInvoicePaymentLinkAction } from "@/server/actions";

export default function InvoicePaymentLinkButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createInvoicePaymentLinkAction(invoiceId);
      if (result.ok) {
        setUrl(result.data);
      } else {
        setError(result.message);
      }
    });
  }

  if (url) {
    return (
      <div className="space-y-2">
        <p className="break-all rounded bg-gray-50 px-3 py-2 text-xs font-mono text-muted">{url}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-primary underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir le lien
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-gray-50 disabled:opacity-50"
      >
        <Link2 className="h-4 w-4" />
        {isPending ? "Création du lien…" : "Créer un lien de paiement"}
      </button>
    </div>
  );
}
