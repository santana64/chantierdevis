import { PageHeader } from "@/components/app-shell";
import { QuoteEditor } from "@/components/quote-editor";
import { LinkButton, WarningNotice } from "@/components/ui";
import { getQuoteEditorData } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const { company, clients, workItems } = await getQuoteEditorData();

  if (!company) {
    return (
      <>
        <PageHeader title="Nouveau devis" description="Votre profil entreprise doit être complété avant de créer un devis prêt à envoyer." />
        <WarningNotice title="Profil entreprise incomplet">
          Renseignez votre SIRET/SIREN, adresse, TVA et conditions de paiement par défaut.
          <div className="mt-4">
            <LinkButton href="/app/settings">Compléter le profil entreprise</LinkButton>
          </div>
        </WarningNotice>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Nouveau devis" description="Créez un devis clair, chiffré, vérifié et prêt à signer." />
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
      />
    </>
  );
}
