import { format } from "date-fns";
import type { Client, CompanyProfile, Invoice, InvoiceLine } from "@prisma/client";

type InvoiceForFacturX = Pick<
  Invoice,
  | "invoiceNumber"
  | "issueDate"
  | "dueDate"
  | "paymentTerms"
  | "subtotalHtCents"
  | "totalVatCents"
  | "totalTtcCents"
  | "amountPaidCents"
> & {
  client: Pick<Client, "name" | "companyName" | "billingAddress" | "billingPostalCode" | "billingCity">;
  lines: Pick<
    InvoiceLine,
    "title" | "description" | "quantity" | "unit" | "unitPriceHtCents" | "vatRate" | "totalHtCents" | "totalVatCents"
  >[];
};

type CompanyForFacturX = Pick<
  CompanyProfile,
  "companyName" | "siret" | "siren" | "vatNumber" | "vatMode" | "address" | "postalCode" | "city"
> | null | undefined;

const UNIT_CODES: Record<string, string> = {
  UNIT: "C62",
  HOUR: "HUR",
  DAY: "DAY",
  M2: "MTK",
  M3: "MTQ",
  ML: "MTR",
  PACKAGE: "PK",
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function amt(cents: number): string {
  return (cents / 100).toFixed(2);
}

function fmtDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return format(d, "yyyyMMdd");
}

export function generateFacturXml(invoice: InvoiceForFacturX, company: CompanyForFacturX): string {
  const isFranchise = company?.vatMode === "FRANCHISE_BASE";

  const vatGroups = new Map<number, { basis: number; tax: number }>();
  for (const line of invoice.lines) {
    const rate = Number(line.vatRate);
    const g = vatGroups.get(rate) ?? { basis: 0, tax: 0 };
    g.basis += line.totalHtCents;
    g.tax += line.totalVatCents;
    vatGroups.set(rate, g);
  }

  const sellerSiret = company?.siret ?? company?.siren ?? "";
  const sellerVat = company?.vatNumber ?? "";

  const linesXml = invoice.lines
    .map((line, i) => {
      const rate = Number(line.vatRate);
      const unitCode = UNIT_CODES[line.unit] ?? "C62";
      const catCode = isFranchise || rate === 0 ? "E" : "S";
      const exemptionNode = isFranchise
        ? "\n          <ram:ExemptionReason>TVA non applicable, art. 293 B du CGI</ram:ExemptionReason>"
        : "";
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(line.title)}</ram:Name>${line.description ? `\n        <ram:Description>${esc(line.description)}</ram:Description>` : ""}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${amt(line.unitPriceHtCents)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${unitCode}">${Number(line.quantity).toFixed(2)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${catCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${rate.toFixed(2)}</ram:RateApplicablePercent>${exemptionNode}
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amt(line.totalHtCents)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  const vatGroupsXml = Array.from(vatGroups.entries())
    .map(([rate, { basis, tax }]) => {
      const catCode = isFranchise || rate === 0 ? "E" : "S";
      const exemptionNode = isFranchise
        ? "\n        <ram:ExemptionReason>TVA non applicable, art. 293 B du CGI</ram:ExemptionReason>"
        : "";
      return `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amt(tax)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${amt(basis)}</ram:BasisAmount>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${rate.toFixed(2)}</ram:RateApplicablePercent>${exemptionNode}
      </ram:ApplicableTradeTax>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${esc(invoice.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${fmtDate(invoice.issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
${linesXml}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(company?.companyName ?? "")}</ram:Name>${sellerSiret ? `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${esc(sellerSiret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ""}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(company?.postalCode ?? "")}</ram:PostcodeCode>
          <ram:LineOne>${esc(company?.address ?? "")}</ram:LineOne>
          <ram:CityName>${esc(company?.city ?? "")}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>${sellerVat && !isFranchise ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${esc(sellerVat)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(invoice.client.companyName || invoice.client.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(invoice.client.billingPostalCode)}</ram:PostcodeCode>
          <ram:LineOne>${esc(invoice.client.billingAddress)}</ram:LineOne>
          <ram:CityName>${esc(invoice.client.billingCity)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery/>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
${vatGroupsXml}
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${esc(invoice.paymentTerms)}</ram:Description>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${fmtDate(invoice.dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amt(invoice.subtotalHtCents)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amt(invoice.subtotalHtCents)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amt(invoice.totalVatCents)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amt(invoice.totalTtcCents)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${amt(invoice.amountPaidCents)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${amt(invoice.totalTtcCents - invoice.amountPaidCents)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
