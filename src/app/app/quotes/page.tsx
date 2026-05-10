import { Copy, Eye, FileDown, Receipt, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { ComplianceBadge, MarginBadge, QuoteStatusBadge } from "@/components/badges";
import { Button, Card, EmptyState, LinkButton, inputClass } from "@/components/ui";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import {
  changeQuoteStatusAction,
  duplicateQuoteAction,
  generateQuoteDocumentAction,
} from "@/server/actions";
import { getQuoteListData } from "@/server/queries";

export const dynamic = "force-dynamic";

const statuses = ["ALL", "DRAFT", "READY", "SENT", "ACCEPTED", "REFUSED", "EXPIRED", "ARCHIVED"];
const trades = [
  "ALL", "PLUMBING", "ELECTRICITY", "PAINTING", "MASONRY", "ROOFING",
  "CARPENTRY", "TILING", "HEATING", "INSULATION", "GENERAL_RENOVATION", "OTHER",
];

const statusLabels: Record<string, string> = {
  ALL: "Tous statuts", DRAFT: "Brouillon", READY: "Prêt", SENT: "Envoyé",
  ACCEPTED: "Accepté", REFUSED: "Refusé", EXPIRED: "Expiré", ARCHIVED: "Archivé",
};

const tradeLabels: Record<string, string> = {
  ALL: "Tous métiers", PLUMBING: "Plomberie", ELECTRICITY: "Électricité",
  PAINTING: "Peinture", MASONRY: "Maçonnerie", ROOFING: "Couverture",
  CARPENTRY: "Menuiserie", TILING: "Carrelage", HEATING: "Chauffage",
  INSULATION: "Isolation", GENERAL_RENOVATION: "Rénovation générale", OTHER: "Autre",
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] : entry ?? "";
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    q: value(params, "q"),
    status: value(params, "status"),
    client: value(params, "client"),
    trade: value(params, "trade"),
    min: value(params, "min"),
    max: value(params, "max"),
    from: value(params, "from"),
    to: value(params, "to"),
  };
  const { quotes, clients } = await getQuoteListData(filters);

  return (
    <>
      <PageHeader
        title="Devis"
        description="Retrouvez vos devis, relancez les clients et préparez les documents à signer."
        action={
          <div className="flex items-center gap-2">
            <a
              href="/app/quotes/export"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:bg-white hover:border-[#c0c9d8]"
            >
              <FileDown aria-hidden className="h-4 w-4" />
              Export CSV
            </a>
            <LinkButton href="/app/quotes/new">Créer un devis</LinkButton>
          </div>
        }
      />

      {/* Filter bar */}
      <Card className="mb-5">
        <div className="px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            Filtres
          </div>
          <form className="grid gap-3">
            {/* Search + submit row */}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative">
                <span className="sr-only">Recherche</span>
                <Search
                  aria-hidden
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                />
                <input
                  className={`${inputClass} w-full pl-9`}
                  name="q"
                  defaultValue={filters.q}
                  placeholder="N° devis, client, projet…"
                />
              </label>
              <div className="flex gap-2">
                <Button type="submit">Filtrer</Button>
                {(filters.q || (filters.status && filters.status !== "ALL") || (filters.client && filters.client !== "ALL") || (filters.trade && filters.trade !== "ALL") || filters.min || filters.max || filters.from || filters.to) && (
                  <Link
                    href="/app/quotes"
                    className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-white px-4 text-sm font-semibold text-muted shadow-sm hover:border-[#c0c9d8] hover:bg-[#fffdf8] hover:text-foreground transition"
                  >
                    × Réinitialiser
                  </Link>
                )}
              </div>
            </div>
            {/* Other filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <select
                className={inputClass}
                name="status"
                defaultValue={filters.status || "ALL"}
                aria-label="Statut"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
              <select
                className={inputClass}
                name="client"
                defaultValue={filters.client || "ALL"}
                aria-label="Client"
              >
                <option value="ALL">Tous clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName || client.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="trade"
                defaultValue={filters.trade || "ALL"}
                aria-label="Métier"
              >
                {trades.map((t) => (
                  <option key={t} value={t}>{tradeLabels[t]}</option>
                ))}
              </select>
              <input
                className={inputClass}
                name="from"
                type="date"
                defaultValue={filters.from}
                aria-label="Depuis"
              />
              <input
                className={inputClass}
                name="to"
                type="date"
                defaultValue={filters.to}
                aria-label="Jusqu'au"
              />
              <div className="flex gap-2">
                <input
                  className={`${inputClass} w-full`}
                  name="min"
                  defaultValue={filters.min}
                  placeholder="Min €"
                  aria-label="Montant minimum"
                />
                <input
                  className={`${inputClass} w-full`}
                  name="max"
                  defaultValue={filters.max}
                  placeholder="Max €"
                  aria-label="Montant maximum"
                />
              </div>
            </div>
          </form>
        </div>
      </Card>

      {/* Quotes table */}
      <Card>
        {quotes.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Aucun devis trouvé"
              description="Créez votre premier devis ou assouplissez les filtres."
              action={<LinkButton href="/app/quotes/new">Créer un devis</LinkButton>}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-3">
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">{quotes.length}</span> devis
              </p>
              <p className="text-sm text-muted">
                Total filtré :{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatMoney(quotes.reduce((s, q) => s + q.totalTtcCents, 0))}
                </span>
              </p>
            </div>
            <div className="divide-y divide-border md:hidden">
              {quotes.map((quote) => (
                <article key={quote.id} className="bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/app/quotes/${quote.id}`}
                        className="font-bold text-primary hover:underline"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                        {quote.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {quote.client.companyName || quote.client.name} · validité {formatShortFrenchDate(quote.validUntil)}
                      </p>
                    </div>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md border border-border bg-white p-3">
                      <p className="text-muted">Total TTC</p>
                      <p className="mt-1 font-bold tabular-nums">{formatMoney(quote.totalTtcCents)}</p>
                    </div>
                    <div className="rounded-md border border-border bg-white p-3">
                      <p className="text-muted">Marge</p>
                      <div className="mt-1"><MarginBadge marginRate={Number(quote.grossMarginRate)} /></div>
                    </div>
                    <div className="rounded-md border border-border bg-white p-3">
                      <p className="text-muted">Mentions</p>
                      <div className="mt-1"><ComplianceBadge status={quote.complianceStatus} /></div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <LinkButton href={`/app/quotes/${quote.id}`} variant="secondary" size="sm">
                      <Eye aria-hidden className="h-3.5 w-3.5" />
                      Voir
                    </LinkButton>
                    <form action={duplicateQuoteAction.bind(null, quote.id)}>
                      <Button variant="secondary" size="sm" type="submit">
                        <Copy aria-hidden className="h-3.5 w-3.5" />
                        Dupliquer
                      </Button>
                    </form>
                    <form action={generateQuoteDocumentAction.bind(null, quote.id)}>
                      <Button variant="secondary" size="sm" type="submit">
                        <FileDown aria-hidden className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-6 py-3">Devis</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Conformité</th>
                    <th className="px-6 py-3">Validité</th>
                    <th className="px-6 py-3 text-right">Total TTC</th>
                    <th className="px-6 py-3">Marge</th>
                    <th className="px-6 py-3">Facture</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="bg-card align-top transition hover:bg-white"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/app/quotes/${quote.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {quote.quoteNumber}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">{quote.title}</p>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {quote.client.companyName || quote.client.name}
                      </td>
                      <td className="px-6 py-4">
                        <QuoteStatusBadge status={quote.status} />
                      </td>
                      <td className="px-6 py-4">
                        <ComplianceBadge status={quote.complianceStatus} />
                      </td>
                      <td className="px-6 py-4 tabular-nums">
                        {(() => {
                          const now = new Date();
                          const daysLeft = Math.ceil((new Date(quote.validUntil).getTime() - now.getTime()) / 86_400_000);
                          const expired = daysLeft < 0;
                          const expiringSoon = !expired && daysLeft <= 3 && quote.status === "SENT";
                          return (
                            <span className={expired ? "text-red-600 font-medium" : expiringSoon ? "text-amber-600 font-medium" : "text-muted"}>
                              {formatShortFrenchDate(quote.validUntil)}
                              {expiringSoon ? ` (${daysLeft}j)` : ""}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold tabular-nums">
                        {formatMoney(quote.totalTtcCents)}
                      </td>
                      <td className="px-6 py-4">
                        <MarginBadge marginRate={Number(quote.grossMarginRate)} />
                      </td>
                      <td className="px-6 py-4">
                        {quote.invoices[0] ? (
                          <Link
                            href={`/app/invoices/${quote.invoices[0].id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <Receipt aria-hidden className="h-3.5 w-3.5" />
                            {quote.invoices[0].invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <LinkButton href={`/app/quotes/${quote.id}`} variant="secondary" size="sm">
                            <Eye aria-hidden className="h-3.5 w-3.5" />
                            Voir
                          </LinkButton>
                          <form action={duplicateQuoteAction.bind(null, quote.id)}>
                            <Button variant="secondary" size="sm" type="submit">
                              <Copy aria-hidden className="h-3.5 w-3.5" />
                              Dupliquer
                            </Button>
                          </form>
                          <form action={generateQuoteDocumentAction.bind(null, quote.id)}>
                            <Button variant="secondary" size="sm" type="submit">
                              <FileDown aria-hidden className="h-3.5 w-3.5" />
                              Générer PDF
                            </Button>
                          </form>
                          {quote.status === "READY" ? (
                            <form action={changeQuoteStatusAction.bind(null, quote.id, "SENT")}>
                              <input type="hidden" name="returnTo" value="/app/quotes" />
                              <Button size="sm" type="submit">Marquer envoyé</Button>
                            </form>
                          ) : null}
                          {quote.status === "SENT" ? (
                            <>
                              <form
                                action={changeQuoteStatusAction.bind(null, quote.id, "ACCEPTED")}
                              >
                                <input type="hidden" name="returnTo" value="/app/quotes" />
                                <Button size="sm" type="submit">Accepté</Button>
                              </form>
                              <form
                                action={changeQuoteStatusAction.bind(null, quote.id, "REFUSED")}
                              >
                                <input type="hidden" name="returnTo" value="/app/quotes" />
                                <Button size="sm" variant="danger" type="submit">
                                  Refusé
                                </Button>
                              </form>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
