import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { Card, CardHeader, LinkButton } from "@/components/ui";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { getInvoiceDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { invoice, company } = await getInvoiceDetail(id);
  if (!invoice) notFound();

  return (
    <>
      <PageHeader
        title={`${invoice.invoiceNumber} - ${invoice.client.companyName || invoice.client.name}`}
        description={`Issue le ${formatShortFrenchDate(invoice.issueDate)} · échéance ${formatShortFrenchDate(invoice.dueDate)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/app/invoices/${invoice.id}/print`} variant="secondary">Imprimer</LinkButton>
            <LinkButton href={`/app/quotes/${invoice.quoteId}`} variant="secondary">Voir le devis</LinkButton>
          </div>
        }
      />

      <Card>
        <CardHeader title="Facture issue du devis accepté" description="Enregistrement prêt pour facturation finale et suivi de paiement." />
        <div className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4">
              <h2 className="font-semibold text-primary">Entreprise</h2>
              <p className="mt-2 font-bold">{company?.companyName ?? "Profil entreprise"}</p>
              <p className="text-sm text-muted">{company ? `${company.address}, ${company.postalCode} ${company.city}` : ""}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <h2 className="font-semibold text-primary">Client</h2>
              <p className="mt-2 font-bold">{invoice.client.companyName || invoice.client.name}</p>
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
                    <td className="px-4 py-3 text-right">{Number(line.vatRate).toLocaleString("fr-FR")} %</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(line.totalHtCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-5 w-full max-w-sm rounded-lg border border-border bg-white">
            <div className="flex justify-between border-b border-border px-4 py-3"><span>Total HT</span><strong>{formatMoney(invoice.subtotalHtCents)}</strong></div>
            <div className="flex justify-between border-b border-border px-4 py-3"><span>TVA</span><strong>{formatMoney(invoice.totalVatCents)}</strong></div>
            <div className="flex justify-between bg-primary px-4 py-3 text-lg font-bold text-white"><span>Total TTC</span><strong>{formatMoney(invoice.totalTtcCents)}</strong></div>
          </div>

          <p className="mt-6 text-sm text-muted">
            Source : <Link href={`/app/quotes/${invoice.quoteId}`} className="font-semibold text-primary underline">{invoice.quote.quoteNumber}</Link>
          </p>
        </div>
      </Card>
    </>
  );
}
