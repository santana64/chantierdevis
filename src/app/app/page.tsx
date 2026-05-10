import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Euro,
  FileText,
  Percent,
  Send,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { ComplianceBadge, QuoteStatusBadge } from "@/components/badges";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { formatMoney, formatShortFrenchDate, getQuoteNextAction } from "@/domain/quotes";
import { getDashboardData } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Les devis à traiter aujourd’hui, les montants engagés et les chantiers à relancer."
        action={
          <LinkButton href="/app/quotes/new" size="lg">
            <FileText aria-hidden className="h-4 w-4" />
            Nouveau devis
          </LinkButton>
        }
      />

      {/* Company incomplete banner */}
      {!data.company ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">Profil entreprise incomplet.</span>{" "}
          Complétez vos mentions avant d&apos;envoyer un devis propre.{" "}
          <Link href="/app/settings" className="font-semibold underline underline-offset-4">
            Compléter le profil
          </Link>
        </div>
      ) : null}

      {/* Stats grid */}
      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Devis du mois"
          value={`${data.stats.quotesThisMonth}`}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Montant devisé"
          value={formatMoney(data.stats.totalQuotedCents)}
          icon={<Euro className="h-5 w-5" />}
        />
        <StatCard
          label="Montant accepté"
          value={formatMoney(data.stats.acceptedAmountCents)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Taux d'acceptation"
          value={`${data.stats.acceptanceRate.toLocaleString("fr-FR")} %`}
          icon={<Percent className="h-5 w-5" />}
        />
        <StatCard
          label="Marge moyenne"
          value={`${data.stats.averageMargin.toLocaleString("fr-FR")} %`}
          detail="Hors brouillons et archivés"
          icon={<TrendingUp className="h-5 w-5" />}
          accent={
            data.stats.averageMargin >= 35
              ? "green"
              : data.stats.averageMargin >= 20
                ? "amber"
                : "red"
          }
        />
        <StatCard
          label="En attente de réponse"
          value={`${data.stats.awaitingClient}`}
          icon={<Send className="h-5 w-5" />}
        />
        <StatCard
          label="Devis à relancer"
          value={`${data.stats.needingFollowUp}`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={data.stats.needingFollowUp > 0 ? "amber" : undefined}
        />
        <StatCard
          label="Brouillons incomplets"
          value={`${data.stats.incompleteDrafts}`}
          icon={<Clock3 className="h-5 w-5" />}
          accent={data.stats.incompleteDrafts > 0 ? "red" : undefined}
        />
      </section>

      {/* Main sections */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Urgent actions */}
        <Card>
          <CardHeader
            title="À traiter en priorité"
            description="Brouillons à compléter, clients à relancer et devis proches de l’expiration."
          />
          <div className="divide-y divide-border">
            {data.urgent.incompleteDrafts.slice(0, 4).map((quote) => (
              <Link
                key={quote.id}
                href={`/app/quotes/${quote.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {quote.quoteNumber} — {quote.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">Mentions à compléter avant envoi</p>
                </div>
                <ComplianceBadge status={quote.complianceStatus} />
              </Link>
            ))}
            {data.urgent.followUps.slice(0, 4).map((quote) => {
              const fullQuote = data.quotes.find((candidate) => candidate.id === quote.id);
              return fullQuote ? (
                <Link
                  key={quote.id}
                  href={`/app/quotes/${quote.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {fullQuote.quoteNumber} — {fullQuote.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">Client sans retour, relance conseillée</p>
                  </div>
                  <QuoteStatusBadge status={fullQuote.status} />
                </Link>
              ) : null;
            })}
            {data.urgent.expiringSoon.slice(0, 4).map((quote) => (
              <Link
                key={quote.id}
                href={`/app/quotes/${quote.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {quote.quoteNumber} — {quote.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Expire le {formatShortFrenchDate(quote.validUntil)}
                  </p>
                </div>
                <QuoteStatusBadge status={quote.status} />
              </Link>
            ))}
            {data.urgent.acceptedWithoutInvoice.slice(0, 3).map((quote) => (
              <Link
                key={quote.id}
                href={`/app/quotes/${quote.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {quote.quoteNumber} — {quote.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">Devis accepté, facture à préparer</p>
                </div>
                <QuoteStatusBadge status={quote.status} />
              </Link>
            ))}
            {data.urgent.incompleteDrafts.length === 0 &&
            data.urgent.followUps.length === 0 &&
            data.urgent.expiringSoon.length === 0 &&
            data.urgent.acceptedWithoutInvoice.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Rien d'urgent"
                  description="Aucune relance ni mention bloquante détectée pour le moment."
                />
              </div>
            ) : null}
          </div>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader
            title="Santé commerciale"
            description="Une lecture simple de ce qui bloque ou avance ce mois-ci."
          />
          <div className="space-y-3 p-6">
            <div className="rounded-xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Relances à faire
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-warning">
                {data.stats.needingFollowUp}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Devis expirés
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-danger">
                {data.stats.expired}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Prochaine action
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {data.recentQuotes[0]
                  ? getQuoteNextAction({ status: data.recentQuotes[0].status })
                  : "Créer un premier devis"}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Recent quotes + quick actions */}
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Derniers devis"
            action={
              <LinkButton href="/app/quotes" variant="secondary" size="sm">
                Voir tout
              </LinkButton>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-3">Devis</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentQuotes.map((quote) => (
                  <tr key={quote.id} className="bg-card transition hover:bg-white">
                    <td className="px-6 py-3">
                      <Link
                        href={`/app/quotes/${quote.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{quote.title}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-foreground">
                      {quote.client.companyName || quote.client.name}
                    </td>
                    <td className="px-6 py-3">
                      <QuoteStatusBadge status={quote.status} />
                    </td>
                    <td className="px-6 py-3 text-right font-bold tabular-nums">
                      {formatMoney(quote.totalTtcCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentQuotes.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Aucun devis"
                  description="Créez votre premier devis pour commencer."
                  action={<LinkButton href="/app/quotes/new">Créer un devis</LinkButton>}
                />
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Actions rapides" />
          <div className="grid gap-3 p-6">
            <LinkButton href="/app/quotes/new" className="justify-start">
              <FileText aria-hidden className="h-4 w-4" />
              Créer un devis
            </LinkButton>
            <LinkButton href="/app/clients" variant="secondary" className="justify-start">
              Ajouter un client
            </LinkButton>
            <LinkButton href="/app/items" variant="secondary" className="justify-start">
              Ajouter un ouvrage type
            </LinkButton>
            <LinkButton href="/app/settings" variant="secondary" className="justify-start">
              Mettre à jour l&apos;entreprise
            </LinkButton>
          </div>
        </Card>
      </section>
    </>
  );
}
