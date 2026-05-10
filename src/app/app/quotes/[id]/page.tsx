import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Edit,
  FileDown,
  FileText,
  Link2,
  Send,
  XCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { ComplianceBadge, MarginBadge, QuoteStatusBadge } from "@/components/badges";
import { Button, Card, CardHeader, InfoNotice, LinkButton, SuccessNotice, WarningNotice, inputClass } from "@/components/ui";
import {
  calculateQuoteLine,
  evaluateQuoteCompliance,
  formatFrenchDate,
  formatMoney,
  formatShortFrenchDate,
  getQuoteNextAction,
} from "@/domain/quotes";
import {
  addFollowUpReminderAction,
  addQuoteNoteAction,
  changeQuoteStatusAction,
  convertQuoteToInvoiceAction,
  duplicateQuoteAction,
  generateQuoteDocumentAction,
  generateSignatureLinkAction,
  markFollowUpDoneAction,
  sendQuoteEmailAction,
} from "@/server/actions";
import { getQuoteDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

function errorLabel(error?: string) {
  if (error === "missing-compliance") return "Impossible de marquer le devis prêt\u00a0: mentions manquantes.";
  if (error === "document-compliance") return "Impossible de générer le devis\u00a0: mentions manquantes.";
  if (error === "invoice-status") return "Le devis doit être accepté avant conversion en facture.";
  return null;
}

function emailLabel(status?: string) {
  if (status === "rate-limited") return "Trop d\u2019envois récents pour ce devis. Réessayez plus tard.";
  if (status === "invalid") return "Adresse email invalide.";
  if (status === "skipped") return "Email non envoyé\u00a0: fournisseur email non configuré.";
  if (status === "failed") return "Email non envoyé\u00a0: erreur du fournisseur.";
  if (status === "sent") return "Email envoyé au client.";
  return status ? `Email traité avec statut\u00a0: ${status}.` : null;
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { company, quote } = await getQuoteDetail(id);
  if (!quote) notFound();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";

  const calculatedLines = quote.lines.map((line) =>
    calculateQuoteLine({
      type: line.type,
      title: line.title,
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      unitPriceHtCents: line.unitPriceHtCents,
      unitCostCents: line.unitCostCents,
      vatRate: Number(line.vatRate),
    }),
  );
  const compliance = evaluateQuoteCompliance(quote, company, quote.client, calculatedLines);
  const latestDocument = quote.documents[0];
  const error = errorLabel(Array.isArray(query.error) ? query.error[0] : query.error);
  const emailMessage = emailLabel(Array.isArray(query.email) ? query.email[0] : query.email);
  const clientName = quote.client.companyName || quote.client.name;
  const nextAction = getQuoteNextAction({ status: quote.status });

  return (
    <>
      <PageHeader
        title={`${quote.quoteNumber} — ${quote.title}`}
        description={`${clientName} · ${quote.workSiteCity} · valable jusqu\u2019au ${formatShortFrenchDate(quote.validUntil)}`}
        action={<QuoteStatusBadge status={quote.status} />}
      />

      {/* Alerts */}
      {error ? (
        <div className="mb-5">
          <WarningNotice title="Action bloquée">{error}</WarningNotice>
        </div>
      ) : null}
      {(Array.isArray(query.document) || query.document) ? (
        <div className="mb-5">
          <SuccessNotice>Document généré et enregistré dans l&apos;historique du devis.</SuccessNotice>
        </div>
      ) : null}
      {emailMessage ? (
        <div className="mb-5">
          <InfoNotice>{emailMessage}</InfoNotice>
        </div>
      ) : null}

      {/* Command bar */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-slate-50 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Actions</p>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-4">
          <LinkButton href={`/app/quotes/${quote.id}/edit`} variant="secondary" size="sm">
            <Edit aria-hidden className="h-3.5 w-3.5" />
            Modifier
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
              Générer / imprimer
            </Button>
          </form>
          {latestDocument ? (
            <LinkButton href={`/app/quotes/${quote.id}/print`} variant="secondary" size="sm">
              <FileText aria-hidden className="h-3.5 w-3.5" />
              Voir le document
            </LinkButton>
          ) : null}
          {quote.documents.some((document) => document.type === "QUOTE_PDF") ? (
            <LinkButton href={`/app/quotes/${quote.id}/pdf`} variant="secondary" size="sm">
              <FileDown aria-hidden className="h-3.5 w-3.5" />
              PDF
            </LinkButton>
          ) : null}

          <div className="h-8 w-px bg-border" aria-hidden />

          <form action={changeQuoteStatusAction.bind(null, quote.id, "READY")}>
            <input type="hidden" name="returnTo" value={`/app/quotes/${quote.id}`} />
            <Button variant="secondary" size="sm" type="submit">Prêt</Button>
          </form>
          <form action={changeQuoteStatusAction.bind(null, quote.id, "SENT")}>
            <input type="hidden" name="returnTo" value={`/app/quotes/${quote.id}`} />
            <Button size="sm" type="submit">
              <Send aria-hidden className="h-3.5 w-3.5" />
              Envoyé
            </Button>
          </form>
          <form action={changeQuoteStatusAction.bind(null, quote.id, "ACCEPTED")}>
            <input type="hidden" name="returnTo" value={`/app/quotes/${quote.id}`} />
            <Button size="sm" type="submit">
              <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
              Accepté
            </Button>
          </form>
          <form action={changeQuoteStatusAction.bind(null, quote.id, "REFUSED")}>
            <input type="hidden" name="returnTo" value={`/app/quotes/${quote.id}`} />
            <Button size="sm" variant="danger" type="submit">
              <XCircle aria-hidden className="h-3.5 w-3.5" />
              Refusé
            </Button>
          </form>
          <form action={changeQuoteStatusAction.bind(null, quote.id, "EXPIRED")}>
            <input type="hidden" name="returnTo" value={`/app/quotes/${quote.id}`} />
            <Button size="sm" variant="secondary" type="submit">Expiré</Button>
          </form>

          <div className="h-8 w-px bg-border" aria-hidden />

          {quote.invoices[0] ? (
            <LinkButton href={`/app/invoices/${quote.invoices[0].id}`} size="sm" variant="secondary">
              Facture {quote.invoices[0].invoiceNumber}
            </LinkButton>
          ) : (
            <form action={convertQuoteToInvoiceAction.bind(null, quote.id)}>
              <Button size="sm" variant="secondary" type="submit" disabled={quote.status !== "ACCEPTED"}>
                Convertir en facture
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Quote preview */}
          <Card>
            <CardHeader
              title="Aperçu du devis"
              description="Document client, lignes détaillées et conditions."
            />
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Entreprise
                  </p>
                  <p className="mt-2 font-bold text-foreground">
                    {company?.companyName ?? "Profil entreprise incomplet"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {company ? `${company.address}, ${company.postalCode} ${company.city}` : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Client
                  </p>
                  <p className="mt-2 font-bold text-foreground">
                    {quote.client.companyName || quote.client.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {quote.client.billingAddress}, {quote.client.billingPostalCode}{" "}
                    {quote.client.billingCity}
                  </p>
                </div>
              </div>

              {/* Lines table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-primary text-left text-xs font-semibold uppercase tracking-wider text-white">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qté</th>
                      <th className="px-4 py-3">Unité</th>
                      <th className="px-4 py-3 text-right">PU HT</th>
                      <th className="px-4 py-3 text-right">TVA</th>
                      <th className="px-4 py-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quote.lines.map((line) => (
                      <tr key={line.id} className="bg-white align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{line.title}</p>
                          {line.description ? (
                            <p className="mt-0.5 text-xs text-muted">{line.description}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {Number(line.quantity).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-muted">{line.unit}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(line.unitPriceHtCents)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted">
                          {Number(line.vatRate).toLocaleString("fr-FR")} %
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          {formatMoney(line.totalHtCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="ml-auto mt-5 w-full max-w-xs overflow-hidden rounded-xl border border-border">
                <div className="flex justify-between bg-white px-4 py-3 text-sm">
                  <span className="text-muted">Total HT</span>
                  <strong className="tabular-nums">{formatMoney(quote.subtotalHtCents)}</strong>
                </div>
                <div className="flex justify-between border-t border-border bg-white px-4 py-3 text-sm">
                  <span className="text-muted">TVA</span>
                  <strong className="tabular-nums">{formatMoney(quote.totalVatCents)}</strong>
                </div>
                <div className="flex justify-between bg-primary px-4 py-3 text-base font-bold text-white">
                  <span>Total TTC</span>
                  <strong className="tabular-nums">{formatMoney(quote.totalTtcCents)}</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* Document preview */}
          <Card>
            <CardHeader
              title="Document généré"
              description="Dernière version HTML enregistrée et imprimable."
            />
            <div className="p-6">
              {latestDocument ? (
                <iframe
                  title={`Document ${quote.quoteNumber}`}
                  srcDoc={latestDocument.contentHtml}
                  className="h-[720px] w-full rounded-xl border border-border bg-white"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-white/50 p-8 text-center text-sm text-muted">
                  Aucun document généré. Utilisez &quot;Générer / imprimer&quot; quand les mentions
                  sont complètes.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          {/* Synthèse */}
          <Card>
            <CardHeader title="Synthèse" />
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-center justify-between gap-3 px-6 py-3">
                <dt className="text-muted">Conformité</dt>
                <dd><ComplianceBadge status={compliance.status} /></dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-6 py-3">
                <dt className="text-muted">Marge</dt>
                <dd><MarginBadge marginRate={Number(quote.grossMarginRate)} /></dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-6 py-3">
                <dt className="text-muted">Validité</dt>
                <dd className="font-semibold tabular-nums">{formatShortFrenchDate(quote.validUntil)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-6 py-3">
                <dt className="text-muted">Action suivante</dt>
                <dd className="text-right font-semibold">
                  {getQuoteNextAction({ status: quote.status })}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Rentabilité */}
          <Card>
            <CardHeader title="Rentabilité" />
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between px-6 py-3">
                <dt className="text-muted">Coût matériaux</dt>
                <dd className="tabular-nums font-medium">
                  {formatMoney(
                    quote.lines
                      .filter((line) => line.type === "MATERIAL")
                      .reduce((sum, line) => sum + (line.totalCostCents ?? 0), 0),
                  )}
                </dd>
              </div>
              <div className="flex justify-between px-6 py-3">
                <dt className="text-muted">Coût main-d&apos;œuvre</dt>
                <dd className="tabular-nums font-medium">
                  {formatMoney(
                    quote.lines
                      .filter((line) => line.type === "LABOR" || line.type === "SERVICE")
                      .reduce((sum, line) => sum + (line.totalCostCents ?? 0), 0),
                  )}
                </dd>
              </div>
              <div className="flex justify-between px-6 py-3">
                <dt className="text-muted">Coût total estimé</dt>
                <dd className="tabular-nums font-semibold">{formatMoney(quote.totalCostCents)}</dd>
              </div>
              <div className="flex justify-between px-6 py-3">
                <dt className="text-muted">Marge brute</dt>
                <dd className="tabular-nums font-bold text-success">{formatMoney(quote.grossMarginCents)}</dd>
              </div>
              <div className="flex justify-between px-6 py-3">
                <dt className="text-muted">Marge brute %</dt>
                <dd className="tabular-nums font-bold">
                  {Number(quote.grossMarginRate).toLocaleString("fr-FR")} %
                </dd>
              </div>
            </dl>
          </Card>

          {/* Conformité */}
          <Card>
            <CardHeader title="Mentions et alertes" />
            <div className="space-y-3 p-6 text-sm">
              {compliance.missingFields.length === 0 && compliance.warnings.length === 0 ? (
                <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                  Devis prêt à envoyer.
                </p>
              ) : null}
              {compliance.missingFields.length > 0 ? (
                <div>
                  <p className="font-semibold text-danger">Mentions manquantes</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                    {compliance.missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {compliance.warnings.length > 0 ? (
                <div>
                  <p className="font-semibold text-warning">Alertes</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                    {compliance.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader title="Envoyer par email" />
            <div className="space-y-4 p-6">
              <form action={sendQuoteEmailAction.bind(null, quote.id)} className="grid gap-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Destinataire
                  <input
                    className={inputClass}
                    name="toEmail"
                    type="email"
                    defaultValue={quote.client.email ?? ""}
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Message
                  <textarea
                    className={inputClass}
                    name="message"
                    rows={3}
                    defaultValue={`Bonjour,\n\nVous trouverez ci-joint le devis ${quote.quoteNumber}.\n\nJe reste disponible pour toute question.`}
                  />
                </label>
                <Button type="submit" variant="secondary">
                  <Send aria-hidden className="h-4 w-4" />
                  Envoyer le devis par email
                </Button>
              </form>
              {quote.emailDeliveries.slice(0, 3).map((delivery) => (
                <div
                  key={delivery.id}
                  className="rounded-xl border border-border bg-white p-3 text-sm"
                >
                  <p className="font-semibold">
                    {delivery.toEmail} · {delivery.status}
                  </p>
                  {delivery.errorMessage ? (
                    <p className="mt-1 text-xs text-muted">{delivery.errorMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          {/* Signature électronique */}
          <Card>
            <CardHeader title="Signature électronique" />
            <div className="space-y-4 p-6">
              {quote.clientSignedAt ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
                  <p className="font-semibold text-green-800">Devis signé</p>
                  <p className="mt-0.5 text-green-700">
                    Signé par le client le {formatShortFrenchDate(quote.clientSignedAt)}.
                  </p>
                  {quote.clientSignatureData ? (
                    <img
                      src={quote.clientSignatureData}
                      alt="Signature client"
                      className="mt-3 max-h-20 w-full rounded border border-green-200 bg-white object-contain"
                    />
                  ) : null}
                </div>
              ) : quote.signatureToken ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Lien de signature actif. Partagez-le avec votre client.</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${appUrl}/sign/${quote.signatureToken}`}
                      className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs font-mono text-foreground"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Bonjour,\n\nVoici votre devis ${quote.quoteNumber} à signer en ligne :\n${appUrl}/sign/${quote.signatureToken}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100"
                    >
                      WhatsApp
                    </a>
                    <form action={generateSignatureLinkAction.bind(null, quote.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        <Link2 aria-hidden className="h-3.5 w-3.5" />
                        Regénérer
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Générez un lien sécurisé pour que votre client signe le devis en ligne.
                  </p>
                  <form action={generateSignatureLinkAction.bind(null, quote.id)}>
                    <Button type="submit" variant="secondary">
                      <Link2 aria-hidden className="h-4 w-4" />
                      Générer le lien de signature
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </Card>

          {/* Relances */}
          <Card>
            <CardHeader title="Relances" />
            <div className="space-y-4 p-6">
              <form
                action={addFollowUpReminderAction.bind(null, quote.id)}
                className="grid gap-3"
              >
                <label className="grid gap-1.5 text-sm font-medium">
                  Date de relance
                  <input className={inputClass} type="date" name="dueDate" required />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Note
                  <textarea className={inputClass} name="note" rows={2} />
                </label>
                <Button type="submit" variant="secondary">
                  <CalendarClock aria-hidden className="h-4 w-4" />
                  Ajouter une relance
                </Button>
              </form>
              <div className="space-y-2">
                {quote.followUpReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-xl border border-border bg-white p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted">
                        {formatShortFrenchDate(reminder.dueDate)} · {reminder.status}
                      </span>
                      {reminder.status === "PENDING" ? (
                        <form action={markFollowUpDoneAction.bind(null, reminder.id)}>
                          <input type="hidden" name="returnTo" value={`/app/quotes/${quote.id}`} />
                          <Button size="sm" variant="ghost" type="submit">
                            Fait
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    {reminder.note ? (
                      <p className="mt-1 text-xs text-muted">{reminder.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Historique et notes" />
            <div className="space-y-4 p-6">
              <form action={addQuoteNoteAction.bind(null, quote.id)} className="grid gap-3">
                <textarea
                  className={inputClass}
                  name="note"
                  rows={3}
                  placeholder="Ajouter une note de suivi…"
                />
                <Button type="submit" variant="secondary">Ajouter la note</Button>
              </form>
              <ol className="space-y-2">
                {quote.events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl border border-border bg-white p-3 text-sm"
                  >
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatFrenchDate(event.eventDate)}</p>
                    {event.description ? (
                      <p className="mt-2 text-xs text-muted">{event.description}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </aside>
      </section>
    </>
  );
}
