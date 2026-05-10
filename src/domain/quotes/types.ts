export type VatMode = "STANDARD" | "FRANCHISE_BASE";

export type Trade =
  | "PLUMBING"
  | "ELECTRICITY"
  | "PAINTING"
  | "MASONRY"
  | "ROOFING"
  | "CARPENTRY"
  | "TILING"
  | "HEATING"
  | "INSULATION"
  | "GENERAL_RENOVATION"
  | "OTHER";

export type Unit = "UNIT" | "HOUR" | "DAY" | "M2" | "M3" | "ML" | "PACKAGE";

export type QuoteLineType =
  | "MATERIAL"
  | "LABOR"
  | "TRAVEL"
  | "SERVICE"
  | "DISCOUNT"
  | "SECTION";

export type QuoteStatus =
  | "DRAFT"
  | "READY"
  | "SENT"
  | "ACCEPTED"
  | "REFUSED"
  | "EXPIRED"
  | "ARCHIVED";

export type ComplianceStatus = "INCOMPLETE" | "WARNING" | "READY";

export type FollowUpStatus = "PENDING" | "DONE" | "CANCELLED";

export type QuoteLineInput = {
  type: QuoteLineType;
  title: string;
  description?: string | null;
  quantity: number;
  unit: Unit;
  unitPriceHtCents: number;
  unitCostCents?: number | null;
  vatRate: number;
};

export type CalculatedQuoteLine = QuoteLineInput & {
  totalHtCents: number;
  totalVatCents: number;
  totalTtcCents: number;
  totalCostCents: number | null;
};

export type QuoteTotals = {
  subtotalHtCents: number;
  totalVatCents: number;
  totalTtcCents: number;
  totalCostCents: number;
  grossMarginCents: number;
  grossMarginRate: number;
};

export type CompanyForCompliance = {
  companyName?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  siret?: string | null;
  siren?: string | null;
  vatNumber?: string | null;
  vatMode: VatMode;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  decennaleMention?: string | null;
};

export type ClientForCompliance = {
  name?: string | null;
  companyName?: string | null;
  billingAddress?: string | null;
  billingPostalCode?: string | null;
  billingCity?: string | null;
};

export type QuoteForCompliance = {
  quoteNumber?: string | null;
  issueDate?: Date | string | null;
  validUntil?: Date | string | null;
  title?: string | null;
  workSiteAddress?: string | null;
  workSitePostalCode?: string | null;
  workSiteCity?: string | null;
  paymentTerms?: string | null;
  estimatedStartDate?: Date | string | null;
  estimatedDurationText?: string | null;
  hasAcceptanceArea?: boolean;
};

export type ComplianceResult = {
  status: ComplianceStatus;
  missingFields: string[];
  warnings: string[];
};

export type QuoteForStats = {
  id: string;
  status: QuoteStatus;
  totalTtcCents: number;
  grossMarginRate: number;
  issueDate?: Date | string | null;
  validUntil?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type FollowUpReminderForStats = {
  quoteId: string;
  dueDate: Date | string;
  status: FollowUpStatus;
};
