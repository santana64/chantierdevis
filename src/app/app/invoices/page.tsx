import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { getInvoicesData } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { invoices } = await getInvoicesData();

  return (
    <>
      <PageHeader title="Factures" description="Factures créées depuis des devis acceptés." />
      <Card>
        <CardHeader title="Factures générées" />
        {invoices.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Aucune facture" description="Acceptez un devis puis utilisez l'action de conversion depuis le détail du devis." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Facture</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Devis source</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-border bg-card">
                    <td className="px-4 py-3">
                      <Link href={`/app/invoices/${invoice.id}`} className="font-semibold text-primary hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{invoice.client.companyName || invoice.client.name}</td>
                    <td className="px-4 py-3">
                      <Link href={`/app/quotes/${invoice.quote.id}`} className="text-primary hover:underline">
                        {invoice.quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatShortFrenchDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(invoice.totalTtcCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
