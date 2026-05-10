import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { QuoteEditor } from "@/components/quote-editor";
import { getQuoteEditorData } from "@/server/queries";

export const dynamic = "force-dynamic";

function dateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : null;
}

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company, clients, workItems, quote } = await getQuoteEditorData(id);
  if (!company || !quote) notFound();

  return (
    <>
      <PageHeader title={`Modifier ${quote.quoteNumber}`} description="Mettez à jour le devis, ses lignes, sa marge et ses points de conformité." />
      <QuoteEditor
        company={{
          companyName: company.companyName,
          address: company.address,
          postalCode: company.postalCode,
          city: company.city,
          siret: company.siret,
          siren: company.siren,
          vatMode: company.vatMode,
          insuranceProvider: company.insuranceProvider,
          insurancePolicyNumber: company.insurancePolicyNumber,
          decennaleMention: company.decennaleMention,
          defaultPaymentTerms: company.defaultPaymentTerms,
          defaultQuoteValidityDays: company.defaultQuoteValidityDays,
          defaultDepositPercent: company.defaultDepositPercent ? Number(company.defaultDepositPercent) : null,
        }}
        clients={clients.map((client) => ({
          id: client.id,
          type: client.type,
          name: client.name,
          companyName: client.companyName,
          email: client.email,
          phone: client.phone,
          billingAddress: client.billingAddress,
          billingPostalCode: client.billingPostalCode,
          billingCity: client.billingCity,
          defaultWorkSiteAddress: client.defaultWorkSiteAddress,
          defaultWorkSitePostalCode: client.defaultWorkSitePostalCode,
          defaultWorkSiteCity: client.defaultWorkSiteCity,
        }))}
        workItems={workItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          trade: item.trade,
          unit: item.unit,
          defaultUnitPriceCents: item.defaultUnitPriceCents,
          defaultCostCents: item.defaultCostCents,
          defaultVatRate: Number(item.defaultVatRate),
          defaultLaborHours: item.defaultLaborHours ? Number(item.defaultLaborHours) : null,
        }))}
        initialQuote={{
          id: quote.id,
          clientId: quote.clientId,
          trade: quote.trade,
          title: quote.title,
          projectDescription: quote.projectDescription,
          workSiteAddress: quote.workSiteAddress,
          workSitePostalCode: quote.workSitePostalCode,
          workSiteCity: quote.workSiteCity,
          issueDate: dateInput(quote.issueDate) ?? "",
          validUntil: dateInput(quote.validUntil) ?? "",
          estimatedStartDate: dateInput(quote.estimatedStartDate),
          estimatedDurationText: quote.estimatedDurationText,
          isQuotePaid: quote.isQuotePaid,
          quoteFeeCents: quote.quoteFeeCents,
          paymentTerms: quote.paymentTerms,
          depositPercent: quote.depositPercent ? Number(quote.depositPercent) : null,
          notesToClient: quote.notesToClient,
          internalNotes: quote.internalNotes,
          lines: quote.lines.map((line) => ({
            workItemId: line.workItemId,
            type: line.type,
            title: line.title,
            description: line.description ?? "",
            quantity: Number(line.quantity),
            unit: line.unit,
            unitPriceHtCents: line.unitPriceHtCents,
            unitCostCents: line.unitCostCents,
            vatRate: Number(line.vatRate),
          })),
        }}
      />
    </>
  );
}
