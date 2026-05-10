import {
  AlertTriangle,
  CheckCircle2,
  Euro,
  FileText,
  Percent,
  Receipt,
  Send,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { ComplianceBadge, QuoteStatusBadge } from "@/components/badges";
import { RevenueChart } from "@/components/revenue-chart";
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
        description="Votre cockpit commercial — devis, factures et santé financière en un coup d'œil."
        action={
          <LinkButton href="/app/quotes/new" size="lg">
            <FileText aria-hidden className="h-4 w-4" />
            Nouveau devis
          </LinkButton>
        }
      />

      {!data.company ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">Profil entreprise incomplet.</span>{" "}
          Complétez vos mentions avant d&apos;envoyer un devis propre.{" "}
          <Link href="/app/settings" className="font-semibold underline underline-offset-4">
            Compléter le profil →
          </Link>
        </div>
      ) : null}

      {data.invoiceStats.overdueCount > 0 ? (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <span>
            <span className="font-bold">
              {data.invoiceStats.overdueCount} facture{data.invoiceStats.overdueCount > 1 ? "s" : ""} en retard
            </span>
            {" — "}{formatMoney(data.invoiceStats.unpaidCents)} à encaisser au total.
          </span>
          <LinkButton href="/app/invoices?status=OVERDUE" variant="secondary" size="sm">
            Voir les retards
          </LinkButton>
        </div>
      ) : null}

      {/* KPI row 1 */}
      <section aria-label="Indicateurs du mois" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Devis ce mois-ci"
          value={`${data.stats.quotesThisMonth}`}
          detail={(() => {
            const prev = data.stats.prevMonthQuotesCount;
            const curr = data.stats.quotesThisMonth;
            if (prev === 0 && curr === 0) return undefined;
            if (prev === 0) return `+${curr} vs mois précédent`;
            const pct = Math.round(((curr - prev) / prev) * 100);
            return pct > 0 ? `↑ +${pct} % vs mois précédent` : pct < 0 ? `↓ ${pct} % vs mois précédent` : "= mois précédent";
          })()}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="CA devisé ce mois"
          value={formatMoney(data.stats.totalQuotedCents)}
          detail={(() => {
            const prev = data.stats.prevMonthQuotedCents;
            const curr = data.stats.totalQuotedCents;
            if (prev === 0 && curr === 0) return undefined;
            if (prev === 0) return `+${formatMoney(curr)} vs mois précédent`;
            const pct = Math.round(((curr - prev) / prev) * 100);
            return pct > 0 ? `↑ +${pct} % vs mois précédent` : pct < 0 ? `↓ ${pct} % vs mois précédent` : "= mois précédent";
          })()}
          icon={<Euro className="h-5 w-5" />}
        />
        <StatCard label="CA accepté (cumulé)" value={formatMoney(data.stats.acceptedAmountCents)} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard
          label="À encaisser"
          value={formatMoney(data.invoiceStats.unpaidCents)}
          detail={data.invoiceStats.unpaidCount > 0 ? `${data.invoiceStats.unpaidCount} facture${data.invoiceStats.unpaidCount > 1 ? "s" : ""}` : "Tout à jour"}
          icon={<Receipt className="h-5 w-5" />}
          accent={data.invoiceStats.overdueCount > 0 ? "red" : data.invoiceStats.unpaidCount > 0 ? "amber" : undefined}
        />
      </section>

      {/* KPI row 2 */}
      <section aria-label="Indicateurs de performance" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Taux d'acceptation" value={`${data.stats.acceptanceRate.toLocaleString("fr-FR")} %`} icon={<Percent className="h-5 w-5" />} />
        <StatCard
          label="Marge moyenne"
          value={`${data.stats.averageMargin.toLocaleString("fr-FR")} %`}
          detail="Hors brouillons et archivés"
          icon={<TrendingUp className="h-5 w-5" />}
          accent={data.stats.averageMargin >= 35 ? "green" : data.stats.averageMargin >= 20 ? "amber" : "red"}
        />
        <StatCard label="En attente de réponse" value={`${data.stats.awaitingClient}`} icon={<Send className="h-5 w-5" />} />
        <StatCard
          label="Devis à relancer"
          value={`${data.stats.needingFollowUp}`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={data.stats.needingFollowUp > 0 ? "amber" : undefined}
        />
      </section>

      {/* Revenue chart */}
      <Card className="mt-6">
        <CardHeader title="Évolution du chiffre d'affaires" description="12 derniers mois — devisé, accepté et facturé." />
        <div className="p-5">
          {data.monthlyRevenue.every((m) => m.quotedCents === 0 && m.invoicedCents === 0) ? (
            <p className="py-8 text-center text-sm text-muted">
              Les données apparaîtront au fur et à mesure que vous créez des devis et des factures.
            </p>
          ) : (
            <RevenueChart data={data.monthlyRevenue} />
          )}
        </div>
      </Card>

      {/* Urgent + Actions */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader title="À traiter en priorité" description="Brouillons à compléter, clients à relancer et devis proches de l'expiration." />
          <div className="divide-y divide-border">
            {data.urgent.incompleteDrafts.slice(0, 3).map((q) => (
              <Link key={q.id} href={`/app/quotes/${q.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{q.quoteNumber} — {q.title}</p>
                  <p className="mt-0.5 text-sm text-muted">Mentions à compléter avant envoi</p>
                </div>
                <ComplianceBadge status={q.complianceStatus} />
              </Link>
            ))}
            {data.urgent.followUps.slice(0, 3).map((q) => {
              const full = data.quotes.find((x) => x.id === q.id);
              return full ? (
                <Link key={q.id} href={`/app/quotes/${q.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{full.quoteNumber} — {full.title}</p>
                    <p className="mt-0.5 text-sm text-muted">Client sans retour — relance conseillée</p>
                  </div>
                  <QuoteStatusBadge status={full.status} />
                </Link>
              ) : null;
            })}
            {data.urgent.expiringSoon.slice(0, 2).map((q) => (
              <Link key={q.id} href={`/app/quotes/${q.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{q.quoteNumber} — {q.title}</p>
                  <p className="mt-0.5 text-sm font-medium text-amber-600">Expire le {formatShortFrenchDate(q.validUntil)}</p>
                </div>
                <QuoteStatusBadge status={q.status} />
              </Link>
            ))}
            {data.urgent.acceptedWithoutInvoice.slice(0, 2).map((q) => (
              <Link key={q.id} href={`/app/quotes/${q.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{q.quoteNumber} — {q.title}</p>
                  <p className="mt-0.5 text-sm font-medium text-green-700">Accepté — préparer la facture</p>
                </div>
                <QuoteStatusBadge status={q.status} />
              </Link>
            ))}
            {data.urgent.incompleteDrafts.length === 0 && data.urgent.followUps.length === 0 &&
              data.urgent.expiringSoon.length === 0 && data.urgent.acceptedWithoutInvoice.length === 0 ? (
              <div className="p-6">
                <EmptyState title="Rien d'urgent" description="Aucune relance ni mention bloquante pour le moment. Bon travail !" />
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Actions rapides" />
            <div className="grid gap-2 p-5">
              <LinkButton href="/app/quotes/new" className="justify-start">
                <FileText aria-hidden className="h-4 w-4" />Créer un devis
              </LinkButton>
              <LinkButton href="/app/clients" variant="secondary" className="justify-start">Ajouter un client</LinkButton>
              <LinkButton href="/app/invoices" variant="secondary" className="justify-start">
                <Receipt aria-hidden className="h-4 w-4" />Voir les factures
              </LinkButton>
              <LinkButton href="/app/settings" variant="secondary" className="justify-start">Mettre à jour l&apos;entreprise</LinkButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="Santé commerciale" />
            <div className="space-y-2 p-5">
              {[
                { label: "Relances à faire", v: data.stats.needingFollowUp, warn: data.stats.needingFollowUp > 0 },
                { label: "Devis expirés", v: data.stats.expired, warn: data.stats.expired > 0 },
                { label: "Brouillons incomplets", v: data.stats.incompleteDrafts, warn: data.stats.incompleteDrafts > 2 },
              ].map(({ label, v, warn }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                  <span className="text-sm text-muted">{label}</span>
                  <span className={`text-2xl font-black tabular-nums ${warn ? "text-amber-600" : "text-foreground"}`}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Recent quotes */}
      <Card className="mt-6">
        <CardHeader
          title="Derniers devis"
          action={<LinkButton href="/app/quotes" variant="secondary" size="sm">Voir tout</LinkButton>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="px-6 py-3">Devis</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Total TTC</th>
                <th className="px-6 py-3 text-right">Prochaine action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentQuotes.map((q) => (
                <tr key={q.id} className="bg-card transition hover:bg-white">
                  <td className="px-6 py-3">
                    <Link href={`/app/quotes/${q.id}`} className="font-semibold text-primary hover:underline">{q.quoteNumber}</Link>
                    <p className="mt-0.5 text-xs text-muted">{q.title}</p>
                  </td>
                  <td className="px-6 py-3">{q.client.companyName || q.client.name}</td>
                  <td className="px-6 py-3"><QuoteStatusBadge status={q.status} /></td>
                  <td className="px-6 py-3 text-right font-bold tabular-nums">{formatMoney(q.totalTtcCents)}</td>
                  <td className="px-6 py-3 text-right text-xs text-muted">{getQuoteNextAction({ status: q.status })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentQuotes.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucun devis" description="Créez votre premier devis pour commencer."
                action={<LinkButton href="/app/quotes/new">Créer un devis</LinkButton>}
              />
            </div>
          ) : null}
        </div>
      </Card>
    </>
  );
}
