import { describe, expect, it } from "vitest";
import {
  calculateDeposit,
  calculateQuoteLine,
  calculateQuoteTotals,
  calculateValidUntil,
  computeAcceptanceRate,
  computeAverageMargin,
  evaluateQuoteCompliance,
  generateQuoteNumber,
  getQuoteFinancialErrors,
  getQuoteNextAction,
  getQuotesNeedingFollowUp,
} from "..";
import { generateQuoteDocumentHtml } from "../document";
import { generateQuotePdfBytes } from "../pdf";
import type { CalculatedQuoteLine, ClientForCompliance, CompanyForCompliance } from "../types";

const standardCompany: CompanyForCompliance = {
  companyName: "Rénovation Martin",
  address: "12 rue des Artisans",
  postalCode: "44000",
  city: "Nantes",
  siret: "12345678900012",
  vatMode: "STANDARD",
  vatNumber: "FR00123456789",
  insuranceProvider: "MAF",
  insurancePolicyNumber: "DEC-123",
  decennaleMention: "Assurance décennale selon activité déclarée.",
};

const franchiseCompany: CompanyForCompliance = {
  ...standardCompany,
  vatMode: "FRANCHISE_BASE",
  vatNumber: null,
};

const client: ClientForCompliance = {
  name: "Claire Dubois",
  billingAddress: "4 rue du Port",
  billingPostalCode: "44000",
  billingCity: "Nantes",
};

const readyQuote = {
  quoteNumber: "DEV-2026-0007",
  issueDate: new Date("2026-04-01"),
  validUntil: new Date("2026-05-01"),
  title: "Rénovation salle de bain",
  workSiteAddress: "4 rue du Port",
  workSitePostalCode: "44000",
  workSiteCity: "Nantes",
  paymentTerms: "Acompte 30%, solde à réception.",
  estimatedStartDate: new Date("2026-05-15"),
  estimatedDurationText: "5 jours ouvrés",
};

const serviceLine = {
  type: "SERVICE" as const,
  title: "Pose WC suspendu",
  quantity: 2,
  unit: "UNIT" as const,
  unitPriceHtCents: 45000,
  unitCostCents: 21000,
  vatRate: 20,
};

describe("quote line calculation", () => {
  it("calculates HT, VAT, TTC and costs", () => {
    const line = calculateQuoteLine(serviceLine);
    expect(line.totalHtCents).toBe(90000);
    expect(line.totalVatCents).toBe(18000);
    expect(line.totalTtcCents).toBe(108000);
    expect(line.totalCostCents).toBe(42000);
  });

  it("handles discount lines as negative revenue without negative costs", () => {
    const line = calculateQuoteLine({
      ...serviceLine,
      type: "DISCOUNT",
      title: "Remise commerciale",
      quantity: 1,
      unitPriceHtCents: 10000,
      unitCostCents: 5000,
    });

    expect(line.totalHtCents).toBe(-10000);
    expect(line.totalVatCents).toBe(-2000);
    expect(line.totalCostCents).toBeNull();
  });
});

describe("quote totals", () => {
  it("aggregates totals and margin in standard VAT mode", () => {
    const totals = calculateQuoteTotals([
      serviceLine,
      { ...serviceLine, title: "Main-d'oeuvre", type: "LABOR", quantity: 4, unit: "HOUR", unitPriceHtCents: 6200, unitCostCents: 3100 },
    ]);

    expect(totals.subtotalHtCents).toBe(114800);
    expect(totals.totalVatCents).toBe(22960);
    expect(totals.totalTtcCents).toBe(137760);
    expect(totals.totalCostCents).toBe(54400);
    expect(totals.grossMarginCents).toBe(60400);
    expect(totals.grossMarginRate).toBe(52.61);
  });

  it("keeps VAT at zero in franchise mode when line VAT is zero", () => {
    const totals = calculateQuoteTotals([{ ...serviceLine, vatRate: 0 }]);
    expect(totals.totalVatCents).toBe(0);
    expect(totals.totalTtcCents).toBe(90000);
  });

  it("handles mixed VAT rates and discount rounding consistently", () => {
    const totals = calculateQuoteTotals([
      serviceLine,
      {
        ...serviceLine,
        title: "Petite fourniture",
        quantity: 1,
        unitPriceHtCents: 10000,
        unitCostCents: 4000,
        vatRate: 10,
      },
      {
        ...serviceLine,
        type: "DISCOUNT",
        title: "Remise geste commercial",
        quantity: 1,
        unitPriceHtCents: 5000,
        unitCostCents: null,
        vatRate: 20,
      },
    ]);

    expect(totals.subtotalHtCents).toBe(95000);
    expect(totals.totalVatCents).toBe(18000);
    expect(totals.totalTtcCents).toBe(113000);
    expect(totals.totalCostCents).toBe(46000);
    expect(totals.grossMarginCents).toBe(49000);
    expect(totals.grossMarginRate).toBe(51.58);
  });

  it("reports financially incoherent totals before persistence", () => {
    expect(
      getQuoteFinancialErrors({
        subtotalHtCents: -1000,
        totalVatCents: -200,
        totalTtcCents: -1200,
        totalCostCents: 0,
        grossMarginCents: -1000,
        grossMarginRate: 0,
      }),
    ).toContain("Le total du devis ne peut pas être négatif. Vérifiez les remises.");

    expect(
      getQuoteFinancialErrors({
        subtotalHtCents: 1000,
        totalVatCents: 200,
        totalTtcCents: 1200,
        totalCostCents: 0,
        grossMarginCents: 1000,
        grossMarginRate: 100,
      }, 1500),
    ).toContain("L'acompte ne peut pas dépasser le total TTC du devis.");
  });
});

describe("dates, numbering and deposit", () => {
  it("generates deterministic quote numbers", () => {
    expect(generateQuoteNumber(undefined, new Date("2026-01-04"))).toBe("DEV-2026-0001");
    expect(generateQuoteNumber("DEV-2026-0009", new Date("2026-04-30"))).toBe("DEV-2026-0010");
    expect(generateQuoteNumber("DEV-2025-0099", new Date("2026-01-01"))).toBe("DEV-2026-0001");
  });

  it("calculates validity and deposits", () => {
    expect(calculateValidUntil(new Date("2026-04-01"), 30).toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(calculateDeposit(120000, 30)).toBe(36000);
    expect(calculateDeposit(120000, null)).toBe(0);
  });
});

describe("compliance evaluation", () => {
  const calculatedLine: CalculatedQuoteLine = calculateQuoteLine(serviceLine);

  it("reports missing company info", () => {
    const result = evaluateQuoteCompliance(readyQuote, { ...standardCompany, siret: null, siren: null }, client, [calculatedLine]);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingFields).toContain("SIRET ou SIREN");
  });

  it("reports missing client info", () => {
    const result = evaluateQuoteCompliance(readyQuote, standardCompany, { ...client, billingAddress: "" }, [calculatedLine]);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingFields).toContain("Adresse de facturation du client");
  });

  it("requires real quote lines", () => {
    const result = evaluateQuoteCompliance(readyQuote, standardCompany, client, []);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingFields).toContain("Au moins une ligne de devis détaillée");
  });

  it("detects franchise VAT mismatch", () => {
    const result = evaluateQuoteCompliance(readyQuote, franchiseCompany, client, [calculatedLine]);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingFields).toContain("Taux de TVA incohérent avec la franchise en base de TVA");
  });

  it("marks a complete quote ready", () => {
    const line = calculateQuoteLine({ ...serviceLine, vatRate: 0 });
    const result = evaluateQuoteCompliance(readyQuote, franchiseCompany, client, [line]);
    expect(result.status).toBe("READY");
    expect(result.missingFields).toHaveLength(0);
  });
});

describe("quote document generation", () => {
  it("renders mandatory acceptance, deposit balance and disclaimer blocks", () => {
    const calculatedLine = calculateQuoteLine(serviceLine);
    const document = generateQuoteDocumentHtml({
      company: {
        ...standardCompany,
        legalForm: "EI",
        ownerName: "Jean Martin",
        phone: "06 00 00 00 00",
        email: "contact@renovation-martin.fr",
      },
      client,
      quote: {
        ...readyQuote,
        isQuotePaid: false,
        paymentTerms: readyQuote.paymentTerms,
        depositPercent: 30,
        depositAmountCents: 32400,
        notesToClient: "Merci pour votre confiance.",
        subtotalHtCents: 90000,
        totalVatCents: 18000,
        totalTtcCents: 108000,
      },
      lines: [calculatedLine],
      compliance: { status: "READY", missingFields: [], warnings: [] },
      currentDate: new Date("2026-04-01"),
    });

    expect(document.html).toContain("Bon pour accord");
    expect(document.html).toContain("Acompte demandé");
    expect(document.html).toContain("Reste à payer");
    expect(document.html).toContain("L'utilisateur reste responsable de vérifier la conformité finale");
    expect(document.text).toContain("Reste à payer");
  });

  it("renders the franchise VAT notice and zero VAT amounts", () => {
    const calculatedLine = calculateQuoteLine({ ...serviceLine, vatRate: 0 });
    const document = generateQuoteDocumentHtml({
      company: franchiseCompany,
      client,
      quote: {
        ...readyQuote,
        isQuotePaid: false,
        paymentTerms: readyQuote.paymentTerms,
        subtotalHtCents: 90000,
        totalVatCents: 0,
        totalTtcCents: 90000,
      },
      lines: [calculatedLine],
      compliance: { status: "READY", missingFields: [], warnings: [] },
      currentDate: new Date("2026-04-01"),
    });

    expect(document.html).toContain("TVA non applicable, art. 293 B du CGI");
    expect(document.html).toContain("Total TVA</span><strong>0,00");
  });
});

describe("quote PDF generation", () => {
  it("generates a PDF with French accents without throwing", async () => {
    const calculatedLine = calculateQuoteLine({
      ...serviceLine,
      title: "Main-d’œuvre qualifiée",
      description: "Dépose, préparation et pose soignée.",
    });

    const pdf = await generateQuotePdfBytes({
      company: {
        companyName: "Rénovation Martin",
        address: "12 rue des Artisans",
        postalCode: "44000",
        city: "Nantes",
        siret: "12345678900012",
        vatMode: "STANDARD",
        insuranceProvider: "MAF",
        insurancePolicyNumber: "DEC-123",
        decennaleMention: "Assurance décennale selon activité déclarée.",
        phone: "06 00 00 00 00",
        email: "contact@renovation-martin.fr",
      },
      client: {
        name: "Claire Dubois",
        billingAddress: "4 rue du Port",
        billingPostalCode: "44000",
        billingCity: "Nantes",
      },
      quote: {
        ...readyQuote,
        isQuotePaid: false,
        depositPercent: 30,
        depositAmountCents: 32400,
        subtotalHtCents: 90000,
        totalVatCents: 18000,
        totalTtcCents: 108000,
      },
      lines: [calculatedLine],
    });

    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});

describe("status intelligence", () => {
  it("returns the next best action by status", () => {
    expect(getQuoteNextAction({ status: "DRAFT" })).toBe("Compléter les mentions manquantes");
    expect(getQuoteNextAction({ status: "SENT", needsFollowUp: true })).toBe("Relancer le client");
  });

  it("computes acceptance rate and average margin", () => {
    const quotes = [
      { status: "ACCEPTED" as const, grossMarginRate: 40 },
      { status: "REFUSED" as const, grossMarginRate: 20 },
      { status: "EXPIRED" as const, grossMarginRate: 30 },
      { status: "DRAFT" as const, grossMarginRate: 10 },
    ];

    expect(computeAcceptanceRate(quotes)).toBe(33.33);
    expect(computeAverageMargin(quotes)).toBe(30);
  });

  it("finds sent quotes needing follow-up", () => {
    const quotes = [
      {
        id: "q1",
        status: "SENT" as const,
        totalTtcCents: 10000,
        grossMarginRate: 35,
        updatedAt: new Date("2026-04-20"),
      },
      {
        id: "q2",
        status: "READY" as const,
        totalTtcCents: 10000,
        grossMarginRate: 35,
        updatedAt: new Date("2026-04-20"),
      },
    ];

    const result = getQuotesNeedingFollowUp(
      quotes,
      [{ quoteId: "q2", status: "PENDING", dueDate: new Date("2026-04-21") }],
      new Date("2026-04-30"),
    );
    expect(result.map((quote) => quote.id)).toEqual(["q1"]);
  });
});
