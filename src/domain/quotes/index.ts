import { addDays, differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  CalculatedQuoteLine,
  ClientForCompliance,
  CompanyForCompliance,
  ComplianceResult,
  FollowUpReminderForStats,
  QuoteForCompliance,
  QuoteForStats,
  QuoteLineInput,
  QuoteStatus,
  QuoteTotals,
} from "./types";

const REAL_LINE_TYPES = new Set(["MATERIAL", "LABOR", "TRAVEL", "SERVICE", "DISCOUNT"]);

function roundCents(value: number) {
  return Math.round(value);
}

function normalizePercent(value: number) {
  return Math.round(value * 100) / 100;
}

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function toDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateQuoteLine(lineInput: QuoteLineInput): CalculatedQuoteLine {
  const quantity = Number.isFinite(lineInput.quantity) ? lineInput.quantity : 0;
  const unitPriceHtCents = Math.max(0, Math.round(lineInput.unitPriceHtCents));
  const unitCostCents =
    lineInput.unitCostCents === null || lineInput.unitCostCents === undefined
      ? null
      : Math.max(0, Math.round(lineInput.unitCostCents));

  if (lineInput.type === "SECTION") {
    return {
      ...lineInput,
      quantity: 0,
      unitPriceHtCents: 0,
      unitCostCents: null,
      vatRate: 0,
      totalHtCents: 0,
      totalVatCents: 0,
      totalTtcCents: 0,
      totalCostCents: null,
    };
  }

  const absoluteHt = roundCents(Math.max(0, quantity) * unitPriceHtCents);
  const totalHtCents = lineInput.type === "DISCOUNT" ? -absoluteHt : absoluteHt;
  const totalVatCents = roundCents(totalHtCents * (lineInput.vatRate / 100));
  const totalTtcCents = totalHtCents + totalVatCents;
  const totalCostCents =
    unitCostCents === null || lineInput.type === "DISCOUNT"
      ? null
      : roundCents(Math.max(0, quantity) * unitCostCents);

  return {
    ...lineInput,
    quantity,
    unitPriceHtCents,
    unitCostCents,
    totalHtCents,
    totalVatCents,
    totalTtcCents,
    totalCostCents,
  };
}

export function calculateQuoteTotals(lines: QuoteLineInput[] | CalculatedQuoteLine[]): QuoteTotals {
  const calculated = lines.map((line) =>
    "totalHtCents" in line ? line : calculateQuoteLine(line),
  );

  const subtotalHtCents = calculated.reduce((sum, line) => sum + line.totalHtCents, 0);
  const totalVatCents = calculated.reduce((sum, line) => sum + line.totalVatCents, 0);
  const totalTtcCents = subtotalHtCents + totalVatCents;
  const totalCostCents = calculated.reduce((sum, line) => sum + (line.totalCostCents ?? 0), 0);
  const grossMarginCents = subtotalHtCents - totalCostCents;
  const grossMarginRate =
    subtotalHtCents > 0 ? normalizePercent((grossMarginCents / subtotalHtCents) * 100) : 0;

  return {
    subtotalHtCents,
    totalVatCents,
    totalTtcCents,
    totalCostCents,
    grossMarginCents,
    grossMarginRate,
  };
}

export function calculateDeposit(totalTtcCents: number, depositPercent?: number | null) {
  if (!depositPercent || depositPercent <= 0) return 0;
  return roundCents(totalTtcCents * (depositPercent / 100));
}

export function getQuoteFinancialErrors(totals: QuoteTotals, depositAmountCents = 0) {
  const errors: string[] = [];

  if (totals.subtotalHtCents < 0 || totals.totalTtcCents < 0) {
    errors.push("Le total du devis ne peut pas être négatif. Vérifiez les remises.");
  }

  if (depositAmountCents < 0) {
    errors.push("Le montant de l'acompte ne peut pas être négatif.");
  }

  if (totals.totalTtcCents >= 0 && depositAmountCents > totals.totalTtcCents) {
    errors.push("L'acompte ne peut pas dépasser le total TTC du devis.");
  }

  return errors;
}

export function generateQuoteNumber(previousNumber: string | null | undefined, date: Date) {
  const year = date.getFullYear();
  const defaultNumber = `DEV-${year}-0001`;
  if (!previousNumber) return defaultNumber;

  const match = previousNumber.match(/^DEV-(\d{4})-(\d{4,})$/);
  if (!match || Number(match[1]) !== year) return defaultNumber;

  const next = Number(match[2]) + 1;
  return `DEV-${year}-${String(next).padStart(4, "0")}`;
}

export function calculateValidUntil(issueDate: Date, validityDays: number) {
  return addDays(issueDate, Math.max(0, Math.round(validityDays)));
}

export function evaluateQuoteCompliance(
  quote: QuoteForCompliance,
  company: CompanyForCompliance | null | undefined,
  client: ClientForCompliance | null | undefined,
  lines: QuoteLineInput[] | CalculatedQuoteLine[],
): ComplianceResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const realLines = lines.filter((line) => REAL_LINE_TYPES.has(line.type));

  if (!hasText(company?.companyName)) missingFields.push("Nom de l'entreprise");
  if (!hasText(company?.address) || !hasText(company?.postalCode) || !hasText(company?.city)) {
    missingFields.push("Adresse complète de l'entreprise");
  }
  if (!hasText(company?.siret) && !hasText(company?.siren)) missingFields.push("SIRET ou SIREN");
  if (!hasText(client?.name) && !hasText(client?.companyName)) missingFields.push("Nom du client");
  if (
    !hasText(client?.billingAddress) ||
    !hasText(client?.billingPostalCode) ||
    !hasText(client?.billingCity)
  ) {
    missingFields.push("Adresse de facturation du client");
  }
  if (!hasText(quote.workSiteAddress) || !hasText(quote.workSitePostalCode) || !hasText(quote.workSiteCity)) {
    missingFields.push("Adresse du chantier / lieu d'exécution");
  }
  if (!toDate(quote.issueDate)) missingFields.push("Date d'émission du devis");
  if (!toDate(quote.validUntil)) missingFields.push("Date de validité du devis");
  if (!hasText(quote.title)) missingFields.push("Titre ou objet du devis");
  if (!hasText(quote.paymentTerms)) missingFields.push("Conditions de paiement");
  if (quote.hasAcceptanceArea === false) missingFields.push("Zone d'acceptation client");
  if (realLines.length === 0) missingFields.push("Au moins une ligne de devis détaillée");

  for (const [index, line] of realLines.entries()) {
    const label = line.title ? `"${line.title}"` : `ligne ${index + 1}`;
    if (!hasText(line.title)) missingFields.push(`Titre manquant sur ${label}`);
    if (!line.quantity || line.quantity <= 0) missingFields.push(`Quantité invalide sur ${label}`);
    if (!line.unit) missingFields.push(`Unité manquante sur ${label}`);
    if (line.unitPriceHtCents < 0 || !Number.isFinite(line.unitPriceHtCents)) {
      missingFields.push(`Prix unitaire invalide sur ${label}`);
    }
  }

  const vatRates = realLines.map((line) => Number(line.vatRate));
  if (company?.vatMode === "FRANCHISE_BASE") {
    if (vatRates.some((vatRate) => vatRate !== 0)) {
      missingFields.push("Taux de TVA incohérent avec la franchise en base de TVA");
    }
  } else {
    if (vatRates.some((vatRate) => !Number.isFinite(vatRate) || vatRate < 0)) {
      missingFields.push("Taux de TVA explicite sur chaque ligne");
    }
  }

  if (!toDate(quote.estimatedStartDate) && !hasText(quote.estimatedDurationText)) {
    warnings.push("Date de début estimée ou durée prévisionnelle à préciser pour un devis BTP");
  }
  if (
    !hasText(company?.insuranceProvider) &&
    !hasText(company?.insurancePolicyNumber) &&
    !hasText(company?.decennaleMention)
  ) {
    warnings.push("Assurance / décennale à vérifier selon l'activité");
  }

  return {
    status: missingFields.length > 0 ? "INCOMPLETE" : warnings.length > 0 ? "WARNING" : "READY",
    missingFields,
    warnings,
  };
}

export function getQuoteStatusLabel(status: QuoteStatus) {
  const labels: Record<QuoteStatus, string> = {
    DRAFT: "Brouillon",
    READY: "Prêt à envoyer",
    SENT: "Envoyé",
    ACCEPTED: "Accepté",
    REFUSED: "Refusé",
    EXPIRED: "Expiré",
    ARCHIVED: "Archivé",
  };
  return labels[status];
}

export function getQuoteNextAction(quote: { status: QuoteStatus; needsFollowUp?: boolean }) {
  if (quote.status === "DRAFT") return "Compléter les mentions manquantes";
  if (quote.status === "READY") return "Envoyer au client";
  if (quote.status === "SENT") return quote.needsFollowUp ? "Relancer le client" : "Attendre le retour client";
  if (quote.status === "ACCEPTED") return "Préparer la facture / les travaux";
  if (quote.status === "REFUSED") return "Archiver ou dupliquer";
  if (quote.status === "EXPIRED") return "Dupliquer ou renouveler la validité";
  return "Consulter l'historique";
}

export function computeAcceptanceRate(quotes: Pick<QuoteForStats, "status">[]) {
  const decided = quotes.filter((quote) => ["ACCEPTED", "REFUSED", "EXPIRED"].includes(quote.status));
  if (decided.length === 0) return 0;
  const accepted = decided.filter((quote) => quote.status === "ACCEPTED").length;
  return normalizePercent((accepted / decided.length) * 100);
}

export function computeAverageMargin(quotes: Pick<QuoteForStats, "status" | "grossMarginRate">[]) {
  const relevant = quotes.filter((quote) => quote.status !== "ARCHIVED" && quote.status !== "DRAFT");
  if (relevant.length === 0) return 0;
  const total = relevant.reduce((sum, quote) => sum + Number(quote.grossMarginRate), 0);
  return normalizePercent(total / relevant.length);
}

export function getQuotesNeedingFollowUp(
  quotes: QuoteForStats[],
  reminders: FollowUpReminderForStats[],
  now = new Date(),
  delayDays = 7,
) {
  const pendingDue = new Set(
    reminders
      .filter((reminder) => reminder.status === "PENDING" && differenceInCalendarDays(toDate(reminder.dueDate) ?? now, now) <= 0)
      .map((reminder) => reminder.quoteId),
  );

  return quotes.filter((quote) => {
    if (quote.status !== "SENT") return false;
    if (pendingDue.has(quote.id)) return true;
    const referenceDate = toDate(quote.updatedAt) ?? toDate(quote.issueDate);
    if (!referenceDate) return false;
    return differenceInCalendarDays(now, referenceDate) >= delayDays;
  });
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatFrenchDate(date: Date | string | null | undefined) {
  const parsed = toDate(date);
  if (!parsed) return "Non renseignée";
  return format(parsed, "dd MMMM yyyy", { locale: fr });
}

export function formatShortFrenchDate(date: Date | string | null | undefined) {
  const parsed = toDate(date);
  if (!parsed) return "-";
  return format(parsed, "dd/MM/yyyy", { locale: fr });
}
