import { Ban, Bell, CalendarDays, CheckCircle2, Download, ExternalLink, Mail, Send } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { Card, CardHeader, LinkButton } from "@/components/ui";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { getInvoiceDetail } from "@/server/queries";
import {
  issueInvoiceAction,
  markInvoicePaidAction,
  cancelInvoiceAction,
  createInvoicePaymentLinkAction,
  sendInvoiceEmailAction,
  updateInvoiceDueDateAction,
} from "@/server/actions";
import InvoicePaymentLinkButton from "./InvoicePaymentLinkButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  ISSUED: { label: "Émise", color: "bg-blue-100 text-blue-700" },
  PAID: { label: "Payée", color: "bg-green-100 text-green-700" },
  OVERDUE: { label: "En retard", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Annulée", color: "bg-gray-100 text-gray-500" },
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { invoice, company } = await getInvoiceDetail(id);
  if (!invoice) notFound();

  const clientName = invoice.client.companyName || invoice.client.name;
  const status = STATUS_LABELS[invoice.status] ?? { label: invoice.status, color: "bg-gray-100 text-gray-700" };
  const vatMode = company?.vatMode ?? "STANDARD";

  const issuedNotice = sp.issued === "1";
  const paidNotice = sp.paid === "1";
  const emailedNotice = sp.emailed === "1";
  const emailFailed = sp.email === "failed";
  const emailInvalid = sp.email === "invalid";

  return (
    <>
      <PageHeader
        title={`${invoice.invoiceNumber} — ${clientName}`}
        description={`Émise le ${formatShortFrenchDate(invoice.issueDate)} · échéance ${formatShortFrenchDate(invoice.dueDate)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.color}`}>
              {status.label}
            </span>
            <LinkButton href={`/app/invoices/${invoice.id}/print`} variant="secondary">
              Imprimer
            </LinkButton>
            <LinkButton href={`/app/quotes/${invoice.quoteId}`} variant="secondary">
              Voir le devis
            </LinkButton>
          </div>
        }
      />

      {(issuedNotice || paidNotice || emailedNotice) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          {paidNotice ? "Facture marquée comme payée." : emailedNotice ? "Facture envoyée par email avec succès." : "Facture émise avec succès."}
        </div>
      )}
      {(emailFailed || emailInvalid) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {emailInvalid ? "Adresse email invalide." : "L'envoi de l'email a échoué. Réessayez ou vérifiez la configuration Resend."}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main card */}
        <Card>
          <CardHeader title="Détail de la facture" />
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-white p-4">
                <h2 className="font-semibold text-primary">Entreprise</h2>
                <p className="mt-2 font-bold">{company?.companyName ?? "Profil entreprise"}</p>
                <p className="text-sm text-muted">{company ? `${company.address}, ${company.postalCode} ${company.city}` : ""}</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <h2 className="font-semibold text-primary">Client</h2>
                <p className="mt-2 font-bold">{clientName}</p>
                <p className="text-sm text-muted">{invoice.client.billingAddress}, {invoice.client.billingPostalCode} {invoice.client.billingCity}</p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[#1f3b57] text-left text-white">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qté</th>
                    <th className="px-4 py-3">Unité</th>
                    <th className="px-4 py-3 text-right">PU HT</th>
                    <th className="px-4 py-3 text-right">TVA</th>
                    <th className="px-4 py-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line) => (
                    <tr key={line.id} className="border-t border-border bg-white">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{line.title}</p>
                        {line.description ? <p className="text-muted">{line.description}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-right">{Number(line.quantity).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-3">{line.unit}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(line.unitPriceHtCents)}</td>
                      <td className="px-4 py-3 text-right">
                        {vatMode === "FRANCHISE_BASE" ? "0 %" : `${Number(line.vatRate).toLocaleString("fr-FR")} %`}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoney(line.totalHtCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {vatMode === "FRANCHISE_BASE" && (
              <p className="mt-3 text-sm text-muted">TVA non applicable, art. 293 B du CGI</p>
            )}

            <div className="ml-auto mt-5 w-full max-w-sm rounded-lg border border-border bg-white">
              <div className="flex justify-between border-b border-border px-4 py-3"><span>Total HT</span><strong>{formatMoney(invoice.subtotalHtCents)}</strong></div>
              <div className="flex justify-between border-b border-border px-4 py-3"><span>TVA</span><strong>{formatMoney(invoice.totalVatCents)}</strong></div>
              <div className="flex justify-between bg-primary px-4 py-3 text-lg font-bold text-white"><span>Total TTC</span><strong>{formatMoney(invoice.totalTtcCents)}</strong></div>
              {invoice.amountPaidCents > 0 && invoice.status !== "PAID" && (
                <div className="flex justify-between border-t border-border px-4 py-3 text-green-700">
                  <span>Déjà encaissé</span><strong>{formatMoney(invoice.amountPaidCents)}</strong>
                </div>
              )}
            </div>

            <p className="mt-6 text-sm text-muted">
              Source : <Link href={`/app/quotes/${invoice.quoteId}`} className="font-semibold text-primary underline">{invoice.quote.quoteNumber}</Link>
            </p>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Lifecycle actions */}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Card>
              <CardHeader title="Actions" />
              <div className="flex flex-col gap-2 p-4">
                {invoice.status === "DRAFT" && (
                  <form action={issueInvoiceAction.bind(null, invoice.id)}>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                      Émettre la facture
                    </button>
                  </form>
                )}
                <form action={markInvoicePaidAction.bind(null, invoice.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marquer comme payée
                  </button>
                </form>
                <form action={cancelInvoiceAction.bind(null, invoice.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-muted hover:bg-slate-50 hover:text-foreground"
                  >
                    <Ban className="h-4 w-4" />
                    Annuler la facture
                  </button>
                </form>
              </div>
            </Card>
          )}

          {invoice.status === "PAID" && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <span className="font-semibold">Facture réglée · {formatMoney(invoice.amountPaidCents)}</span>
            </div>
          )}

          {/* Send by email */}
          {invoice.status !== "CANCELLED" && invoice.status !== "DRAFT" && (
            <Card>
              <CardHeader
                title="Envoyer par email"
                description="Transmettez la facture directement à votre client."
              />
              <div className="p-4">
                <form action={sendInvoiceEmailAction.bind(null, invoice.id)} className="grid gap-3">
                  <input
                    name="toEmail"
                    type="email"
                    defaultValue={invoice.client.email ?? ""}
                    placeholder="Email du client"
                    required
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <textarea
                    name="message"
                    rows={2}
                    placeholder="Message optionnel…"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                  />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer la facture
                  </button>
                </form>
              </div>
            </Card>
          )}

          {/* Stripe payment link */}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <Card>
              <CardHeader
                title="Paiement en ligne"
                description="Envoyez un lien à votre client pour qu'il règle par carte."
              />
              <div className="p-4">
                {invoice.stripePaymentLinkUrl ? (
                  <div className="space-y-2">
                    <p className="break-all rounded bg-gray-50 px-3 py-2 text-xs text-muted font-mono">
                      {invoice.stripePaymentLinkUrl}
                    </p>
                    <a
                      href={invoice.stripePaymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ouvrir le lien
                    </a>
                  </div>
                ) : (
                  <InvoicePaymentLinkButton invoiceId={invoice.id} />
                )}
              </div>
            </Card>
          )}

          {/* Edit due date */}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Card>
              <CardHeader
                title="Échéance"
                description="Modifiez la date d'échéance et réémettez la facture."
              />
              <div className="p-4">
                <form action={updateInvoiceDueDateAction.bind(null, invoice.id)} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-muted">Nouvelle échéance</label>
                    <input
                      name="dueDate"
                      type="date"
                      defaultValue={invoice.dueDate.toISOString().slice(0, 10)}
                      required
                      className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground shadow-sm hover:bg-gray-50"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                </form>
              </div>
            </Card>
          )}

          {/* Factur-X */}
          <Card>
            <CardHeader
              title="Factur-X"
              description="Format XML structuré EN 16931 — obligation légale sept. 2026."
            />
            <div className="p-4">
              <a
                href={`/app/invoices/${invoice.id}/facturx`}
                download
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Télécharger factur-x.xml
              </a>
              <p className="mt-2 text-xs text-muted">
                Compatible Chorus Pro, Sage, EBP, QuickBooks, Sellsy.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
