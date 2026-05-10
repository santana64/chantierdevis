"use server";

import { randomBytes } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  calculateDeposit,
  calculateQuoteLine,
  calculateQuoteTotals,
  calculateValidUntil,
  evaluateQuoteCompliance,
  generateQuoteNumber,
  getQuoteFinancialErrors,
} from "@/domain/quotes";
import { getPlanLimit, isWithinLimit } from "@/domain/billing/plans";
import { generateQuoteDocumentHtml } from "@/domain/quotes/document";
import { generateQuotePdfBytes } from "@/domain/quotes/pdf";
import type { ActionResult } from "@/lib/errors";
import { DomainError, NotFoundError, ValidationError, toActionError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth";
import { isAuthRateLimited, recordAuthFailure } from "@/lib/auth-security";
import { sendTransactionalEmail } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";
import { centsFromEurosInput, numberFromForm, stringFromForm } from "@/lib/utils";

const tradeSchema = z.enum([
  "PLUMBING",
  "ELECTRICITY",
  "PAINTING",
  "MASONRY",
  "ROOFING",
  "CARPENTRY",
  "TILING",
  "HEATING",
  "INSULATION",
  "GENERAL_RENOVATION",
  "OTHER",
]);

const SEND_QUOTE_EMAIL_LIMIT = { maxAttempts: 10, windowMinutes: 60, lockMinutes: 60 };

const unitSchema = z.enum(["UNIT", "HOUR", "DAY", "M2", "M3", "ML", "PACKAGE"]);
const lineTypeSchema = z.enum(["MATERIAL", "LABOR", "TRAVEL", "SERVICE", "DISCOUNT", "SECTION"]);

const companySchema = z.object({
  companyName: z.string().trim().min(1, "Nom de l'entreprise obligatoire"),
  legalForm: z.string().trim().optional(),
  ownerName: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  siren: z.string().trim().optional(),
  vatNumber: z.string().trim().optional(),
  vatMode: z.enum(["STANDARD", "FRANCHISE_BASE"]),
  address: z.string().trim().min(1, "Adresse obligatoire"),
  postalCode: z.string().trim().min(1, "Code postal obligatoire"),
  city: z.string().trim().min(1, "Ville obligatoire"),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  website: z.string().trim().optional(),
  insuranceProvider: z.string().trim().optional(),
  insurancePolicyNumber: z.string().trim().optional(),
  decennaleMention: z.string().trim().optional(),
  defaultPaymentTerms: z.string().trim().min(1, "Conditions de paiement obligatoires"),
  defaultQuoteValidityDays: z.number().int().min(1).max(365),
  defaultDepositPercent: z.number().min(0).max(100).nullable(),
  defaultSignature: z.string().trim().optional(),
  documentFooterText: z.string().trim().optional(),
});

const clientSchema = z.object({
  type: z.enum(["INDIVIDUAL", "PROFESSIONAL"]),
  name: z.string().trim().min(1, "Nom du client obligatoire"),
  companyName: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  billingAddress: z.string().trim().min(1, "Adresse obligatoire"),
  billingPostalCode: z.string().trim().min(1, "Code postal obligatoire"),
  billingCity: z.string().trim().min(1, "Ville obligatoire"),
  defaultWorkSiteAddress: z.string().trim().optional(),
  defaultWorkSitePostalCode: z.string().trim().optional(),
  defaultWorkSiteCity: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const workItemSchema = z.object({
  title: z.string().trim().min(1, "Titre obligatoire"),
  description: z.string().trim().min(1, "Description obligatoire"),
  trade: tradeSchema,
  unit: unitSchema,
  defaultUnitPriceCents: z.number().int().min(0),
  defaultCostCents: z.number().int().min(0),
  defaultVatRate: z.number().min(0).max(100),
  defaultLaborHours: z.number().min(0).nullable(),
  notes: z.string().trim().optional(),
});

const quoteLinePayloadSchema = z.object({
  workItemId: z.string().nullable().optional(),
  type: lineTypeSchema,
  title: z.string().trim().min(1, "Titre de ligne obligatoire"),
  description: z.string().trim().nullable().optional(),
  quantity: z.number().min(0),
  unit: unitSchema,
  unitPriceHtCents: z.number().int().min(0),
  unitCostCents: z.number().int().min(0).nullable().optional(),
  vatRate: z.number().min(0).max(100),
});

const quoteEditorPayloadSchema = z.object({
  quoteId: z.string().optional(),
  clientMode: z.enum(["existing", "new"]),
  clientId: z.string().optional(),
  newClient: clientSchema.optional(),
  trade: tradeSchema.nullable().optional(),
  title: z.string().trim().min(1, "Objet du devis obligatoire"),
  projectDescription: z.string().trim().nullable().optional(),
  workSiteAddress: z.string().trim().min(1, "Adresse du chantier obligatoire"),
  workSitePostalCode: z.string().trim().min(1, "Code postal du chantier obligatoire"),
  workSiteCity: z.string().trim().min(1, "Ville du chantier obligatoire"),
  issueDate: z.string().trim().min(1),
  validUntil: z.string().trim().min(1),
  estimatedStartDate: z.string().trim().nullable().optional(),
  estimatedDurationText: z.string().trim().nullable().optional(),
  isQuotePaid: z.boolean(),
  quoteFeeCents: z.number().int().min(0).nullable().optional(),
  paymentTerms: z.string().trim().min(1, "Conditions de paiement obligatoires"),
  depositPercent: z.number().min(0).max(100).nullable().optional(),
  notesToClient: z.string().trim().nullable().optional(),
  internalNotes: z.string().trim().nullable().optional(),
  lines: z.array(quoteLinePayloadSchema).min(1, "Ajoutez au moins une ligne de devis"),
});

function nullableString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function escapeEmailHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailParagraph(value: string) {
  return escapeEmailHtml(value).replace(/\n/g, "<br />");
}

async function assertPlanLimit(
  user: { id: string; plan: "FREE" | "SOLO" | "PRO" | "BUSINESS" },
  key: "clients" | "quotes" | "workItems",
) {
  const limit = getPlanLimit(user.plan, key);
  if (limit === null) return;

  const current =
    key === "clients"
      ? await prisma.client.count({ where: { userId: user.id } })
      : key === "quotes"
        ? await prisma.quote.count({ where: { userId: user.id, status: { not: "ARCHIVED" } } })
        : await prisma.workItem.count({ where: { userId: user.id } });

  if (!isWithinLimit(current, limit)) {
    throw new DomainError(
      key === "clients"
        ? "Limite de clients atteinte pour votre abonnement"
        : key === "quotes"
          ? "Limite de devis atteinte pour votre abonnement"
          : "Limite d'ouvrages atteinte pour votre abonnement",
    );
  }
}

function formToCompany(formData: FormData) {
  const parsed = companySchema.safeParse({
    companyName: stringFromForm(formData.get("companyName")),
    legalForm: stringFromForm(formData.get("legalForm")),
    ownerName: stringFromForm(formData.get("ownerName")),
    siret: stringFromForm(formData.get("siret")),
    siren: stringFromForm(formData.get("siren")),
    vatNumber: stringFromForm(formData.get("vatNumber")),
    vatMode: stringFromForm(formData.get("vatMode")),
    address: stringFromForm(formData.get("address")),
    postalCode: stringFromForm(formData.get("postalCode")),
    city: stringFromForm(formData.get("city")),
    phone: stringFromForm(formData.get("phone")),
    email: stringFromForm(formData.get("email")),
    website: stringFromForm(formData.get("website")),
    insuranceProvider: stringFromForm(formData.get("insuranceProvider")),
    insurancePolicyNumber: stringFromForm(formData.get("insurancePolicyNumber")),
    decennaleMention: stringFromForm(formData.get("decennaleMention")),
    defaultPaymentTerms: stringFromForm(formData.get("defaultPaymentTerms")),
    defaultQuoteValidityDays: numberFromForm(formData.get("defaultQuoteValidityDays"), 30),
    defaultDepositPercent:
      stringFromForm(formData.get("defaultDepositPercent")) === ""
        ? null
        : numberFromForm(formData.get("defaultDepositPercent"), 0),
    defaultSignature: stringFromForm(formData.get("defaultSignature")),
    documentFooterText: stringFromForm(formData.get("documentFooterText")),
  });

  if (!parsed.success) {
    throw new ValidationError("Profil entreprise incomplet", parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

function formToClient(formData: FormData) {
  const parsed = clientSchema.safeParse({
    type: stringFromForm(formData.get("type")),
    name: stringFromForm(formData.get("name")),
    companyName: stringFromForm(formData.get("companyName")),
    email: stringFromForm(formData.get("email")),
    phone: stringFromForm(formData.get("phone")),
    billingAddress: stringFromForm(formData.get("billingAddress")),
    billingPostalCode: stringFromForm(formData.get("billingPostalCode")),
    billingCity: stringFromForm(formData.get("billingCity")),
    defaultWorkSiteAddress: stringFromForm(formData.get("defaultWorkSiteAddress")),
    defaultWorkSitePostalCode: stringFromForm(formData.get("defaultWorkSitePostalCode")),
    defaultWorkSiteCity: stringFromForm(formData.get("defaultWorkSiteCity")),
    notes: stringFromForm(formData.get("notes")),
  });

  if (!parsed.success) {
    throw new ValidationError("Client introuvable ou informations invalides", parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

function formToWorkItem(formData: FormData) {
  const parsed = workItemSchema.safeParse({
    title: stringFromForm(formData.get("title")),
    description: stringFromForm(formData.get("description")),
    trade: stringFromForm(formData.get("trade")),
    unit: stringFromForm(formData.get("unit")),
    defaultUnitPriceCents: centsFromEurosInput(formData.get("defaultUnitPrice")),
    defaultCostCents: centsFromEurosInput(formData.get("defaultCost")),
    defaultVatRate: numberFromForm(formData.get("defaultVatRate"), 20),
    defaultLaborHours:
      stringFromForm(formData.get("defaultLaborHours")) === ""
        ? null
        : numberFromForm(formData.get("defaultLaborHours"), 0),
    notes: stringFromForm(formData.get("notes")),
  });

  if (!parsed.success) {
    throw new ValidationError("Montant invalide", parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

function eventTitleForStatus(status: string) {
  const titles: Record<string, string> = {
    READY: "Devis marqué prêt à envoyer",
    SENT: "Devis envoyé au client",
    ACCEPTED: "Devis accepté",
    REFUSED: "Devis refusé",
    EXPIRED: "Devis expiré",
    ARCHIVED: "Devis archivé",
  };
  return titles[status] ?? "Statut mis à jour";
}

function eventTypeForStatus(status: string) {
  if (status === "SENT") return "SENT";
  if (status === "ACCEPTED") return "ACCEPTED";
  if (status === "REFUSED") return "REFUSED";
  if (status === "EXPIRED") return "EXPIRED";
  return "UPDATED";
}

function generateInvoiceNumber(previousNumber: string | null | undefined, date: Date) {
  const year = date.getFullYear();
  const defaultNumber = `FAC-${year}-0001`;
  if (!previousNumber) return defaultNumber;
  const match = previousNumber.match(/^FAC-(\d{4})-(\d{4,})$/);
  if (!match || Number(match[1]) !== year) return defaultNumber;
  return `FAC-${year}-${String(Number(match[2]) + 1).padStart(4, "0")}`;
}

async function getOwnedQuote(userId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" } },
    },
  });
  if (!quote) throw new NotFoundError("Ce devis n'existe pas");
  return quote;
}

async function calculateQuotePersistedState(userId: string, quoteId: string) {
  const [quote, company] = await Promise.all([
    getOwnedQuote(userId, quoteId),
    prisma.companyProfile.findUnique({ where: { userId } }),
  ]);

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
  const totals = calculateQuoteTotals(calculatedLines);
  const compliance = evaluateQuoteCompliance(quote, company, quote.client, calculatedLines);

  return { quote, company, calculatedLines, totals, compliance };
}

async function updateQuoteComputedFields(userId: string, quoteId: string) {
  const { totals, compliance } = await calculateQuotePersistedState(userId, quoteId);
  return prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotalHtCents: totals.subtotalHtCents,
      totalVatCents: totals.totalVatCents,
      totalTtcCents: totals.totalTtcCents,
      totalCostCents: totals.totalCostCents,
      grossMarginCents: totals.grossMarginCents,
      grossMarginRate: new Prisma.Decimal(totals.grossMarginRate),
      complianceStatus: compliance.status,
    },
  });
}

export async function saveCompanyProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  const data = formToCompany(formData);

  await prisma.companyProfile.upsert({
    where: { userId: user.id },
    update: {
      ...data,
      legalForm: nullableString(data.legalForm),
      ownerName: nullableString(data.ownerName),
      siret: nullableString(data.siret),
      siren: nullableString(data.siren),
      vatNumber: nullableString(data.vatNumber),
      phone: nullableString(data.phone),
      email: nullableString(data.email),
      website: nullableString(data.website),
      insuranceProvider: nullableString(data.insuranceProvider),
      insurancePolicyNumber: nullableString(data.insurancePolicyNumber),
      decennaleMention: nullableString(data.decennaleMention),
      defaultDepositPercent:
        data.defaultDepositPercent === null ? null : new Prisma.Decimal(data.defaultDepositPercent),
      defaultSignature: nullableString(data.defaultSignature),
      documentFooterText: nullableString(data.documentFooterText),
    },
    create: {
      userId: user.id,
      ...data,
      legalForm: nullableString(data.legalForm),
      ownerName: nullableString(data.ownerName),
      siret: nullableString(data.siret),
      siren: nullableString(data.siren),
      vatNumber: nullableString(data.vatNumber),
      phone: nullableString(data.phone),
      email: nullableString(data.email),
      website: nullableString(data.website),
      insuranceProvider: nullableString(data.insuranceProvider),
      insurancePolicyNumber: nullableString(data.insurancePolicyNumber),
      decennaleMention: nullableString(data.decennaleMention),
      defaultDepositPercent:
        data.defaultDepositPercent === null ? null : new Prisma.Decimal(data.defaultDepositPercent),
      defaultSignature: nullableString(data.defaultSignature),
      documentFooterText: nullableString(data.documentFooterText),
    },
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/quotes");
  redirect("/app/settings?saved=1");
}

export async function createClientAction(formData: FormData) {
  const user = await getCurrentUser();
  const data = formToClient(formData);
  try {
    await assertPlanLimit(user, "clients");
  } catch {
    redirect("/app/billing?limit=clients");
  }
  await prisma.client.create({
    data: {
      userId: user.id,
      ...data,
      companyName: nullableString(data.companyName),
      email: nullableString(data.email),
      phone: nullableString(data.phone),
      defaultWorkSiteAddress: nullableString(data.defaultWorkSiteAddress),
      defaultWorkSitePostalCode: nullableString(data.defaultWorkSitePostalCode),
      defaultWorkSiteCity: nullableString(data.defaultWorkSiteCity),
      notes: nullableString(data.notes),
    },
  });
  revalidatePath("/app/clients");
  redirect("/app/clients?saved=1");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const user = await getCurrentUser();
  const data = formToClient(formData);
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
  if (!client) throw new NotFoundError("Client introuvable");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      ...data,
      companyName: nullableString(data.companyName),
      email: nullableString(data.email),
      phone: nullableString(data.phone),
      defaultWorkSiteAddress: nullableString(data.defaultWorkSiteAddress),
      defaultWorkSitePostalCode: nullableString(data.defaultWorkSitePostalCode),
      defaultWorkSiteCity: nullableString(data.defaultWorkSiteCity),
      notes: nullableString(data.notes),
    },
  });
  revalidatePath("/app/clients");
  redirect("/app/clients?saved=1");
}

export async function deleteClientAction(clientId: string) {
  const user = await getCurrentUser();
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
  if (!client) throw new NotFoundError("Client introuvable");

  const quoteCount = await prisma.quote.count({ where: { clientId, userId: user.id } });
  if (quoteCount > 0) redirect("/app/clients?error=client-used");
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/app/clients");
  redirect("/app/clients?deleted=1");
}

export async function createWorkItemAction(formData: FormData) {
  const user = await getCurrentUser();
  const data = formToWorkItem(formData);
  try {
    await assertPlanLimit(user, "workItems");
  } catch {
    redirect("/app/billing?limit=workItems");
  }
  await prisma.workItem.create({
    data: {
      userId: user.id,
      ...data,
      defaultVatRate: new Prisma.Decimal(data.defaultVatRate),
      defaultLaborHours:
        data.defaultLaborHours === null ? null : new Prisma.Decimal(data.defaultLaborHours),
      notes: nullableString(data.notes),
    },
  });
  revalidatePath("/app/items");
  redirect("/app/items?saved=1");
}

export async function updateWorkItemAction(workItemId: string, formData: FormData) {
  const user = await getCurrentUser();
  const data = formToWorkItem(formData);
  const item = await prisma.workItem.findFirst({ where: { id: workItemId, userId: user.id } });
  if (!item) throw new NotFoundError("Ouvrage introuvable");

  await prisma.workItem.update({
    where: { id: workItemId },
    data: {
      ...data,
      defaultVatRate: new Prisma.Decimal(data.defaultVatRate),
      defaultLaborHours:
        data.defaultLaborHours === null ? null : new Prisma.Decimal(data.defaultLaborHours),
      notes: nullableString(data.notes),
    },
  });
  revalidatePath("/app/items");
  redirect("/app/items?saved=1");
}

export async function duplicateWorkItemAction(workItemId: string) {
  const user = await getCurrentUser();
  try {
    await assertPlanLimit(user, "workItems");
  } catch {
    redirect("/app/billing?limit=workItems");
  }
  const item = await prisma.workItem.findFirst({ where: { id: workItemId, userId: user.id } });
  if (!item) throw new NotFoundError("Ouvrage introuvable");

  await prisma.workItem.create({
    data: {
      userId: user.id,
      title: `${item.title} (copie)`,
      description: item.description,
      trade: item.trade,
      unit: item.unit,
      defaultUnitPriceCents: item.defaultUnitPriceCents,
      defaultCostCents: item.defaultCostCents,
      defaultVatRate: item.defaultVatRate,
      defaultLaborHours: item.defaultLaborHours,
      notes: item.notes,
    },
  });
  revalidatePath("/app/items");
  redirect("/app/items?duplicated=1");
}

export async function deleteWorkItemAction(workItemId: string) {
  const user = await getCurrentUser();
  const item = await prisma.workItem.findFirst({ where: { id: workItemId, userId: user.id } });
  if (!item) throw new NotFoundError("Ouvrage introuvable");

  const used = await prisma.quoteLine.count({
    where: { workItemId, quote: { userId: user.id } },
  });
  if (used > 0) redirect("/app/items?error=item-used");
  await prisma.workItem.delete({ where: { id: workItemId } });
  revalidatePath("/app/items");
  redirect("/app/items?deleted=1");
}

export async function saveQuoteEditorAction(payload: unknown): Promise<ActionResult<{ quoteId: string }>> {
  try {
    const user = await getCurrentUser();
    const parsed = quoteEditorPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError("Impossible d'enregistrer le devis", parsed.error.flatten().fieldErrors);
    }

    const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
    if (!company) throw new DomainError("Profil entreprise incomplet");

    const data = parsed.data;
    let clientId = data.clientId;
    let client = clientId
      ? await prisma.client.findFirst({ where: { id: clientId, userId: user.id } })
      : null;

    if (data.clientMode === "new") {
      if (!data.newClient) throw new ValidationError("Client introuvable");
      await assertPlanLimit(user, "clients");
      client = await prisma.client.create({
        data: {
          userId: user.id,
          ...data.newClient,
          companyName: nullableString(data.newClient.companyName),
          email: nullableString(data.newClient.email),
          phone: nullableString(data.newClient.phone),
          defaultWorkSiteAddress: nullableString(data.newClient.defaultWorkSiteAddress),
          defaultWorkSitePostalCode: nullableString(data.newClient.defaultWorkSitePostalCode),
          defaultWorkSiteCity: nullableString(data.newClient.defaultWorkSiteCity),
          notes: nullableString(data.newClient.notes),
        },
      });
      clientId = client.id;
    }

    if (!client || !clientId) throw new NotFoundError("Client introuvable");

    const issueDate = new Date(data.issueDate);
    const validUntil = new Date(data.validUntil);
    const normalizedLines = data.lines.map((line) => ({
      ...line,
      vatRate: company.vatMode === "FRANCHISE_BASE" ? 0 : line.vatRate,
    }));
    const calculatedLines = normalizedLines.map(calculateQuoteLine);
    const totals = calculateQuoteTotals(calculatedLines);
    const depositAmountCents = calculateDeposit(totals.totalTtcCents, data.depositPercent);
    const financialErrors = getQuoteFinancialErrors(totals, depositAmountCents);
    if (financialErrors.length > 0) {
      throw new DomainError(financialErrors[0]);
    }
    const compliance = evaluateQuoteCompliance(
      {
        ...data,
        issueDate,
        validUntil,
        hasAcceptanceArea: true,
      },
      company,
      client,
      calculatedLines,
    );
    const nextStatus = compliance.status === "INCOMPLETE" ? "DRAFT" : "READY";

    const lineData = calculatedLines.map((line, position) => ({
      workItemId: normalizedLines[position].workItemId || null,
      position,
      type: line.type,
      title: line.title,
      description: nullableString(line.description ?? ""),
      quantity: new Prisma.Decimal(line.quantity),
      unit: line.unit,
      unitPriceHtCents: line.unitPriceHtCents,
      unitCostCents: line.unitCostCents,
      vatRate: new Prisma.Decimal(line.vatRate),
      totalHtCents: line.totalHtCents,
      totalVatCents: line.totalVatCents,
      totalTtcCents: line.totalTtcCents,
      totalCostCents: line.totalCostCents,
    }));

    const baseQuoteData = {
      clientId,
      status: nextStatus as "DRAFT" | "READY",
      trade: data.trade,
      title: data.title,
      projectDescription: nullableString(data.projectDescription ?? ""),
      workSiteAddress: data.workSiteAddress,
      workSitePostalCode: data.workSitePostalCode,
      workSiteCity: data.workSiteCity,
      issueDate,
      validUntil,
      estimatedStartDate: data.estimatedStartDate ? new Date(data.estimatedStartDate) : null,
      estimatedDurationText: nullableString(data.estimatedDurationText ?? ""),
      isQuotePaid: data.isQuotePaid,
      quoteFeeCents: data.quoteFeeCents ?? null,
      paymentTerms: data.paymentTerms,
      depositPercent:
        data.depositPercent === null || data.depositPercent === undefined
          ? null
          : new Prisma.Decimal(data.depositPercent),
      depositAmountCents,
      notesToClient: nullableString(data.notesToClient ?? ""),
      internalNotes: nullableString(data.internalNotes ?? ""),
      subtotalHtCents: totals.subtotalHtCents,
      totalVatCents: totals.totalVatCents,
      totalTtcCents: totals.totalTtcCents,
      totalCostCents: totals.totalCostCents,
      grossMarginCents: totals.grossMarginCents,
      grossMarginRate: new Prisma.Decimal(totals.grossMarginRate),
      complianceStatus: compliance.status,
    };

    if (data.quoteId) {
      const existing = await prisma.quote.findFirst({ where: { id: data.quoteId, userId: user.id } });
      if (!existing) throw new NotFoundError("Ce devis n'existe pas");
      await prisma.$transaction([
        prisma.quoteLine.deleteMany({ where: { quoteId: data.quoteId } }),
        prisma.quote.update({
          where: { id: data.quoteId },
          data: baseQuoteData,
        }),
        prisma.quoteLine.createMany({
          data: lineData.map((line) => ({ ...line, quoteId: data.quoteId as string })),
        }),
        prisma.quoteEvent.create({
          data: {
            quoteId: data.quoteId,
            type: "UPDATED",
            title: "Devis mis à jour",
            eventDate: new Date(),
          },
        }),
      ]);
      revalidatePath(`/app/quotes/${data.quoteId}`);
      revalidatePath("/app/quotes");
      return { ok: true, data: { quoteId: data.quoteId } };
    }

    await assertPlanLimit(user, "quotes");
    const lastQuote = await prisma.quote.findFirst({
      where: {
        userId: user.id,
        quoteNumber: { startsWith: `DEV-${issueDate.getFullYear()}-` },
      },
      orderBy: { quoteNumber: "desc" },
    });
    const quoteNumber = generateQuoteNumber(lastQuote?.quoteNumber, issueDate);

    const quote = await prisma.quote.create({
      data: {
        userId: user.id,
        quoteNumber,
        ...baseQuoteData,
        lines: { create: lineData },
        events: {
          create: {
            type: "CREATED",
            title: "Devis créé",
            eventDate: new Date(),
          },
        },
      },
    });
    revalidatePath("/app/quotes");
    revalidatePath("/app");
    return { ok: true, data: { quoteId: quote.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function changeQuoteStatusAction(quoteId: string, status: string, formData: FormData) {
  const user = await getCurrentUser();
  const returnTo = stringFromForm(formData.get("returnTo")) || `/app/quotes/${quoteId}`;
  const validStatuses = ["READY", "SENT", "ACCEPTED", "REFUSED", "EXPIRED", "ARCHIVED"];
  if (!validStatuses.includes(status)) throw new ValidationError("Statut invalide");

  const { quote, compliance } = await calculateQuotePersistedState(user.id, quoteId);
  if (status === "READY" && compliance.status === "INCOMPLETE") {
    redirect(`${returnTo}?error=missing-compliance`);
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: { status: status as never, complianceStatus: compliance.status },
    }),
    prisma.quoteEvent.create({
      data: {
        quoteId: quote.id,
        type: eventTypeForStatus(status) as never,
        title: eventTitleForStatus(status),
        eventDate: new Date(),
      },
    }),
    ...(status === "SENT"
      ? [
          prisma.followUpReminder.create({
            data: {
              quoteId: quote.id,
              dueDate: addDays(new Date(), 7),
              note: "Relance automatique 7 jours après l'envoi.",
            },
          }),
        ]
      : []),
    ...(status === "ACCEPTED" || status === "REFUSED"
      ? [
          prisma.followUpReminder.updateMany({
            where: { quoteId: quote.id, status: "PENDING" },
            data: { status: "CANCELLED" },
          }),
        ]
      : []),
  ]);

  await updateQuoteComputedFields(user.id, quote.id);
  revalidatePath("/app");
  revalidatePath("/app/quotes");
  revalidatePath(`/app/quotes/${quote.id}`);
  redirect(returnTo);
}

export async function duplicateQuoteAction(quoteId: string) {
  const user = await getCurrentUser();
  try {
    await assertPlanLimit(user, "quotes");
  } catch {
    redirect("/app/billing?limit=quotes");
  }
  const { quote, company, calculatedLines, totals, compliance } = await calculateQuotePersistedState(user.id, quoteId);
  const issueDate = new Date();
  const lastQuote = await prisma.quote.findFirst({
    where: {
      userId: user.id,
      quoteNumber: { startsWith: `DEV-${issueDate.getFullYear()}-` },
    },
    orderBy: { quoteNumber: "desc" },
  });
  const quoteNumber = generateQuoteNumber(lastQuote?.quoteNumber, issueDate);
  const validUntil = calculateValidUntil(issueDate, company?.defaultQuoteValidityDays ?? 30);

  const clone = await prisma.quote.create({
    data: {
      userId: user.id,
      clientId: quote.clientId,
      quoteNumber,
      status: compliance.status === "INCOMPLETE" ? "DRAFT" : "READY",
      trade: quote.trade,
      title: `${quote.title} (copie)`,
      projectDescription: quote.projectDescription,
      workSiteAddress: quote.workSiteAddress,
      workSitePostalCode: quote.workSitePostalCode,
      workSiteCity: quote.workSiteCity,
      issueDate,
      validUntil,
      estimatedStartDate: null,
      estimatedDurationText: quote.estimatedDurationText,
      isQuotePaid: quote.isQuotePaid,
      quoteFeeCents: quote.quoteFeeCents,
      paymentTerms: quote.paymentTerms,
      depositPercent: quote.depositPercent,
      depositAmountCents: calculateDeposit(totals.totalTtcCents, Number(quote.depositPercent)),
      notesToClient: quote.notesToClient,
      internalNotes: quote.internalNotes,
      subtotalHtCents: totals.subtotalHtCents,
      totalVatCents: totals.totalVatCents,
      totalTtcCents: totals.totalTtcCents,
      totalCostCents: totals.totalCostCents,
      grossMarginCents: totals.grossMarginCents,
      grossMarginRate: new Prisma.Decimal(totals.grossMarginRate),
      complianceStatus: compliance.status,
      lines: {
        create: quote.lines.map((line, position) => ({
          workItemId: line.workItemId,
          position,
          type: line.type,
          title: line.title,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceHtCents: line.unitPriceHtCents,
          unitCostCents: line.unitCostCents,
          vatRate: line.vatRate,
          totalHtCents: calculatedLines[position].totalHtCents,
          totalVatCents: calculatedLines[position].totalVatCents,
          totalTtcCents: calculatedLines[position].totalTtcCents,
          totalCostCents: calculatedLines[position].totalCostCents,
        })),
      },
      events: {
        create: {
          type: "DUPLICATED",
          title: `Devis dupliqué depuis ${quote.quoteNumber}`,
          eventDate: new Date(),
        },
      },
    },
  });
  revalidatePath("/app/quotes");
  redirect(`/app/quotes/${clone.id}`);
}

export async function generateQuoteDocumentAction(quoteId: string) {
  const user = await getCurrentUser();
  const { quote, company, calculatedLines, compliance } = await calculateQuotePersistedState(user.id, quoteId);
  if (!company) throw new DomainError("Profil entreprise incomplet");
  if (compliance.status === "INCOMPLETE") {
    redirect(`/app/quotes/${quoteId}?error=document-compliance`);
  }

  const document = generateQuoteDocumentHtml({
    company,
    client: quote.client,
    quote: {
      ...quote,
      depositPercent: quote.depositPercent ? Number(quote.depositPercent) : null,
    },
    lines: calculatedLines,
    compliance,
    currentDate: new Date(),
  });
  const pdfBytes = await generateQuotePdfBytes({
    company,
    client: quote.client,
    quote,
    lines: calculatedLines,
  });
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const fileName = `${quote.quoteNumber}.pdf`;

  await prisma.$transaction([
    prisma.generatedQuoteDocument.create({
      data: {
        quoteId: quote.id,
        type: "PRINTABLE_HTML",
        title: `${quote.quoteNumber} - ${quote.title}`,
        contentHtml: document.html,
        contentText: document.text,
      },
    }),
    prisma.generatedQuoteDocument.create({
      data: {
        quoteId: quote.id,
        type: "QUOTE_PDF",
        title: `${quote.quoteNumber} - ${quote.title}`,
        contentHtml: document.html,
        contentText: document.text,
        contentBase64: pdfBase64,
        mimeType: "application/pdf",
        fileName,
      },
    }),
    prisma.quoteEvent.create({
      data: {
        quoteId: quote.id,
        type: "PDF_GENERATED",
        title: "Document imprimable généré",
        eventDate: new Date(),
      },
    }),
  ]);
  revalidatePath(`/app/quotes/${quote.id}`);
  redirect(`/app/quotes/${quote.id}?document=generated`);
}

export async function sendQuoteEmailAction(quoteId: string, formData: FormData) {
  const user = await getCurrentUser();
  const toEmail = stringFromForm(formData.get("toEmail"));
  const message = stringFromForm(formData.get("message"));
  if (!toEmail || !toEmail.includes("@")) redirect(`/app/quotes/${quoteId}?email=invalid`);

  const rateLimitSubject = `${user.id}:${quoteId}:${toEmail.toLowerCase()}`;
  if (await isAuthRateLimited("send-quote-email", rateLimitSubject, SEND_QUOTE_EMAIL_LIMIT)) {
    redirect(`/app/quotes/${quoteId}?email=rate-limited`);
  }
  await recordAuthFailure("send-quote-email", rateLimitSubject, SEND_QUOTE_EMAIL_LIMIT);

  const { quote, company, calculatedLines, compliance } = await calculateQuotePersistedState(user.id, quoteId);
  if (!company) throw new DomainError("Profil entreprise incomplet");
  if (compliance.status === "INCOMPLETE") redirect(`/app/quotes/${quoteId}?error=document-compliance`);

  const document = generateQuoteDocumentHtml({
    company,
    client: quote.client,
    quote: {
      ...quote,
      depositPercent: quote.depositPercent ? Number(quote.depositPercent) : null,
    },
    lines: calculatedLines,
    compliance,
    currentDate: new Date(),
  });
  const pdfBytes = await generateQuotePdfBytes({ company, client: quote.client, quote, lines: calculatedLines });
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const subject = `Votre devis ${quote.quoteNumber} — ${quote.title}`;
  const safeQuoteNumber = escapeEmailHtml(quote.quoteNumber);
  const safeQuoteTitle = escapeEmailHtml(quote.title);
  const safeCompanyName = escapeEmailHtml(company.companyName);
  const clientName = escapeEmailHtml(quote.client.companyName || quote.client.name);
  const totalStr = (quote.totalTtcCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const validUntilStr = new Intl.DateTimeFormat("fr-FR").format(quote.validUntil);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const signLink = quote.signatureToken ? `${appUrl}/sign/${quote.signatureToken}` : null;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><title>Devis ${safeQuoteNumber}</title></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fffdf8;border-radius:12px;overflow:hidden;border:1px solid #e2d9c8;">
    <div style="background:#1f3b57;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${safeCompanyName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Devis n° ${safeQuoteNumber}</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#1f2933;">Bonjour ${clientName},</p>
      <p style="font-size:15px;color:#1f2933;line-height:1.6;">
        Veuillez trouver ci-joint votre devis pour : <strong>${safeQuoteTitle}</strong>.
      </p>
      ${message ? `<p style="font-size:15px;color:#1f2933;line-height:1.6;background:#f8fafc;border-left:3px solid #e86218;padding:12px 16px;border-radius:0 6px 6px 0;">${emailParagraph(message)}</p>` : ""}
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Récapitulatif</p>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;color:#64748b;">N° devis</span>
          <strong style="font-size:14px;color:#1f2933;">${safeQuoteNumber}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;color:#64748b;">Objet</span>
          <strong style="font-size:14px;color:#1f2933;">${safeQuoteTitle}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;color:#64748b;">Montant TTC</span>
          <strong style="font-size:18px;color:#1f3b57;">${totalStr}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;">
          <span style="font-size:14px;color:#64748b;">Valable jusqu'au</span>
          <strong style="font-size:14px;color:#1f2933;">${validUntilStr}</strong>
        </div>
      </div>
      <p style="font-size:14px;color:#1f2933;">Le devis détaillé est joint à cet email en PDF.</p>
      ${signLink ? `<div style="margin:24px 0;text-align:center;"><a href="${escapeEmailHtml(signLink)}" style="display:inline-block;background:#e86218;color:#fff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Signer le devis en ligne →</a><p style="margin:8px 0 0;font-size:12px;color:#64748b;">Depuis votre téléphone ou ordinateur, sans téléchargement</p></div>` : ""}
      <p style="font-size:14px;color:#1f2933;margin-top:24px;">Cordialement,<br /><strong>${safeCompanyName}</strong></p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;font-size:11px;color:#94a3b8;">
      Ce devis a été généré via ChantierDevis. Pour toute question, contactez directement l'émetteur.
    </div>
  </div>
</body></html>`;
  const result = await sendTransactionalEmail({
    to: toEmail,
    subject,
    html,
    text: `Bonjour ${quote.client.companyName || quote.client.name},\n\nVeuillez trouver ci-joint le devis ${quote.quoteNumber} pour ${quote.title}.\nMontant TTC : ${totalStr} — Valable jusqu'au ${validUntilStr}.\n\n${message}\n\nCordialement,\n${company.companyName}`,
    attachment: {
      fileName: `${quote.quoteNumber}.pdf`,
      contentBase64: pdfBase64,
      contentType: "application/pdf",
    },
  });
  const shouldMarkQuoteSent =
    result.status === "SENT" && !["ACCEPTED", "REFUSED", "EXPIRED", "ARCHIVED"].includes(quote.status);

  await prisma.$transaction([
    prisma.generatedQuoteDocument.create({
      data: {
        quoteId: quote.id,
        type: "QUOTE_PDF",
        title: `${quote.quoteNumber} - ${quote.title}`,
        contentHtml: document.html,
        contentText: document.text,
        contentBase64: pdfBase64,
        mimeType: "application/pdf",
        fileName: `${quote.quoteNumber}.pdf`,
        emailedAt: result.status === "SENT" ? new Date() : null,
      },
    }),
    prisma.emailDelivery.create({
      data: {
        userId: user.id,
        quoteId: quote.id,
        toEmail,
        subject,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        errorMessage: result.errorMessage,
        sentAt: result.status === "SENT" ? new Date() : null,
      },
    }),
    ...(shouldMarkQuoteSent
      ? [
          prisma.quote.update({
            where: { id: quote.id },
            data: { status: "SENT" },
          }),
          prisma.followUpReminder.create({
            data: {
              quoteId: quote.id,
              dueDate: addDays(new Date(), 7),
              note: "Relance automatique 7 jours après l'envoi par email.",
            },
          }),
        ]
      : []),
    prisma.quoteEvent.create({
      data: {
        quoteId: quote.id,
        type: result.status === "SENT" ? "SENT" : "NOTE",
        title:
          result.status === "SENT"
            ? "Devis envoyé par email"
            : result.status === "SKIPPED"
              ? "Email non envoyé : configuration manquante"
              : "Échec d'envoi du devis par email",
        description: result.errorMessage,
        eventDate: new Date(),
      },
    }),
  ]);

  revalidatePath(`/app/quotes/${quote.id}`);
  redirect(`/app/quotes/${quote.id}?email=${result.status.toLowerCase()}`);
}

export async function convertQuoteToInvoiceAction(quoteId: string) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId: user.id },
    include: { lines: { orderBy: { position: "asc" } } },
  });
  if (!quote) throw new NotFoundError("Ce devis n'existe pas");
  if (quote.status !== "ACCEPTED") redirect(`/app/quotes/${quoteId}?error=invoice-status`);

  const existing = await prisma.invoice.findUnique({ where: { quoteId } });
  if (existing) redirect(`/app/invoices/${existing.id}`);

  const now = new Date();
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId: user.id, invoiceNumber: { startsWith: `FAC-${now.getFullYear()}-` } },
    orderBy: { invoiceNumber: "desc" },
  });
  const invoiceNumber = generateInvoiceNumber(lastInvoice?.invoiceNumber, now);

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      quoteId: quote.id,
      clientId: quote.clientId,
      invoiceNumber,
      issueDate: now,
      dueDate: addDays(now, 30),
      paymentTerms: quote.paymentTerms,
      subtotalHtCents: quote.subtotalHtCents,
      totalVatCents: quote.totalVatCents,
      totalTtcCents: quote.totalTtcCents,
      notesToClient: quote.notesToClient,
      lines: {
        create: quote.lines
          .filter((line) => line.type !== "SECTION")
          .map((line, i) => ({
            quoteLineId: line.id,
            position: i,
            title: line.title,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPriceHtCents: line.unitPriceHtCents,
            vatRate: line.vatRate,
            totalHtCents: line.totalHtCents,
            totalVatCents: line.totalVatCents,
            totalTtcCents: line.totalTtcCents,
          })),
      },
    },
  });

  await prisma.quoteEvent.create({
    data: {
      quoteId: quote.id,
      type: "UPDATED",
      title: `Facture ${invoice.invoiceNumber} créée`,
      eventDate: new Date(),
    },
  });

  revalidatePath("/app/invoices");
  revalidatePath(`/app/quotes/${quote.id}`);
  redirect(`/app/invoices/${invoice.id}`);
}

export async function addFollowUpReminderAction(quoteId: string, formData: FormData) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId: user.id } });
  if (!quote) throw new NotFoundError("Ce devis n'existe pas");
  const dueDate = new Date(stringFromForm(formData.get("dueDate")));
  const note = stringFromForm(formData.get("note"));

  await prisma.$transaction([
    prisma.followUpReminder.create({
      data: { quoteId, dueDate, note: nullableString(note) },
    }),
    prisma.quoteEvent.create({
      data: {
        quoteId,
        type: "FOLLOW_UP_ADDED",
        title: "Relance ajoutée",
        description: nullableString(note),
        eventDate: new Date(),
      },
    }),
  ]);
  revalidatePath(`/app/quotes/${quoteId}`);
  redirect(`/app/quotes/${quoteId}`);
}

export async function markFollowUpDoneAction(reminderId: string, formData: FormData) {
  const user = await getCurrentUser();
  const returnTo = stringFromForm(formData.get("returnTo"));
  const reminder = await prisma.followUpReminder.findFirst({
    where: { id: reminderId, quote: { userId: user.id } },
  });
  if (!reminder) throw new NotFoundError("Relance introuvable");
  await prisma.followUpReminder.update({ where: { id: reminderId }, data: { status: "DONE" } });
  revalidatePath(`/app/quotes/${reminder.quoteId}`);
  redirect(returnTo || `/app/quotes/${reminder.quoteId}`);
}

export async function addQuoteNoteAction(quoteId: string, formData: FormData) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId: user.id } });
  if (!quote) throw new NotFoundError("Ce devis n'existe pas");
  const note = stringFromForm(formData.get("note"));
  if (!note) redirect(`/app/quotes/${quoteId}`);

  await prisma.quoteEvent.create({
    data: {
      quoteId,
      type: "NOTE",
      title: "Note ajoutée",
      description: note,
      eventDate: new Date(),
    },
  });
  revalidatePath(`/app/quotes/${quoteId}`);
  redirect(`/app/quotes/${quoteId}`);
}

export async function generateSignatureLinkAction(quoteId: string) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId: user.id } });
  if (!quote) throw new NotFoundError("Ce devis n'existe pas");

  const token = randomBytes(32).toString("base64url");
  await prisma.quote.update({ where: { id: quoteId }, data: { signatureToken: token } });

  revalidatePath(`/app/quotes/${quoteId}`);
  redirect(`/app/quotes/${quoteId}?sign=1`);
}

export async function submitSignatureAction(
  token: string,
  signatureData: string,
): Promise<ActionResult> {
  try {
    if (!token || !signatureData) return { ok: false, message: "Données invalides" };

    const quote = await prisma.quote.findUnique({ where: { signatureToken: token } });
    if (!quote) return { ok: false, message: "Lien de signature invalide ou expiré." };
    if (quote.clientSignedAt) return { ok: false, message: "Ce devis a déjà été signé." };
    if (quote.validUntil < new Date()) return { ok: false, message: "Ce devis est expiré. Contactez l’artisan." };

    await prisma.$transaction([
      prisma.quote.update({
        where: { id: quote.id },
        data: { clientSignatureData: signatureData, clientSignedAt: new Date(), status: "ACCEPTED" },
      }),
      prisma.quoteEvent.create({
        data: { quoteId: quote.id, type: "SIGNED", title: "Devis signé électroniquement par le client", eventDate: new Date() },
      }),
      prisma.followUpReminder.updateMany({
        where: { quoteId: quote.id, status: "PENDING" },
        data: { status: "DONE" },
      }),
    ]);

    revalidatePath(`/app/quotes/${quote.id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

const PRESET_CATALOG: Record<string, Array<{
  title: string; description: string;
  unit: "UNIT" | "HOUR" | "DAY" | "M2" | "M3" | "ML" | "PACKAGE";
  defaultUnitPriceCents: number; defaultCostCents: number;
  defaultVatRate: number; defaultLaborHours?: number;
}>> = {
  PLUMBING: [
    { title: "Remplacement robinetterie évier", description: "Dépose ancien robinet, fourniture et pose robinet mélangeur standard.", unit: "UNIT", defaultUnitPriceCents: 12000, defaultCostCents: 4500, defaultVatRate: 10, defaultLaborHours: 1.5 },
    { title: "Pose WC suspendu", description: "Fourniture et installation WC suspendu avec bâti-support, raccordement compris.", unit: "UNIT", defaultUnitPriceCents: 48000, defaultCostCents: 19000, defaultVatRate: 10, defaultLaborHours: 4 },
    { title: "Installation douche à l'italienne", description: "Receveur 90×90 extra-plat, paroi, raccordements plomberie et évacuation.", unit: "UNIT", defaultUnitPriceCents: 120000, defaultCostCents: 52000, defaultVatRate: 10, defaultLaborHours: 8 },
    { title: "Remplacement chauffe-eau électrique 200L", description: "Dépose et évacuation ancien appareil, fourniture et pose chauffe-eau stéatite 200L.", unit: "UNIT", defaultUnitPriceCents: 85000, defaultCostCents: 38000, defaultVatRate: 10, defaultLaborHours: 4 },
    { title: "Débouchage canalisation", description: "Intervention débouchage par furet mécanique ou pression, bouchon standard.", unit: "UNIT", defaultUnitPriceCents: 15000, defaultCostCents: 4000, defaultVatRate: 10, defaultLaborHours: 1.5 },
    { title: "Pose radiateur sèche-serviettes électrique", description: "Fourniture et pose radiateur sèche-serviettes 750W, câblage compris.", unit: "UNIT", defaultUnitPriceCents: 55000, defaultCostCents: 24000, defaultVatRate: 10, defaultLaborHours: 3 },
  ],
  PAINTING: [
    { title: "Peinture murs et plafond", description: "Préparation surface, application sous-couche et 2 couches peinture acrylique mat.", unit: "M2", defaultUnitPriceCents: 2200, defaultCostCents: 700, defaultVatRate: 10, defaultLaborHours: 0.25 },
    { title: "Enduit de lissage", description: "Application enduit de finition en 1 à 2 passes, ponçage, état lisse.", unit: "M2", defaultUnitPriceCents: 1800, defaultCostCents: 600, defaultVatRate: 10, defaultLaborHours: 0.25 },
    { title: "Peinture boiseries fenêtres et portes", description: "Ponçage, apprêt et 2 couches peinture acrylique satin sur boiseries.", unit: "ML", defaultUnitPriceCents: 3500, defaultCostCents: 1200, defaultVatRate: 10, defaultLaborHours: 0.4 },
    { title: "Pose papier peint intissé", description: "Préparation support, encollage mur, pose papier peint intissé fourni.", unit: "M2", defaultUnitPriceCents: 3200, defaultCostCents: 1500, defaultVatRate: 10, defaultLaborHours: 0.3 },
    { title: "Peinture façade", description: "Nettoyage haute pression, primaire et 2 couches peinture façade microporeuse.", unit: "M2", defaultUnitPriceCents: 3800, defaultCostCents: 1400, defaultVatRate: 10, defaultLaborHours: 0.35 },
    { title: "Décapage peinture ancienne", description: "Décapage thermique ou chimique, ponçage, préparation support.", unit: "M2", defaultUnitPriceCents: 2500, defaultCostCents: 800, defaultVatRate: 10, defaultLaborHours: 0.3 },
  ],
  TILING: [
    { title: "Pose carrelage sol grès cérame", description: "Fourniture et pose carrelage 60×60, colle et joints inclus.", unit: "M2", defaultUnitPriceCents: 5500, defaultCostCents: 2200, defaultVatRate: 10, defaultLaborHours: 0.6 },
    { title: "Pose faïence murale", description: "Fourniture et pose faïence 30×60, colle et joints inclus.", unit: "M2", defaultUnitPriceCents: 5800, defaultCostCents: 2400, defaultVatRate: 10, defaultLaborHours: 0.65 },
    { title: "Dépose ancien carrelage", description: "Dépose et évacuation carrelage existant, nettoyage support.", unit: "M2", defaultUnitPriceCents: 2000, defaultCostCents: 500, defaultVatRate: 10, defaultLaborHours: 0.3 },
    { title: "Pose plinthes carrelage", description: "Fourniture et pose plinthes assorties, coupe onglets incluse.", unit: "ML", defaultUnitPriceCents: 2500, defaultCostCents: 900, defaultVatRate: 10, defaultLaborHours: 0.3 },
    { title: "Ragréage sol autonivelant", description: "Application ragréage autonivelant pour mise à niveau et lissage support.", unit: "M2", defaultUnitPriceCents: 1800, defaultCostCents: 700, defaultVatRate: 10, defaultLaborHours: 0.2 },
    { title: "Réfection joints carrelage", description: "Dépose anciens joints, nettoyage, nouveaux joints époxy ou ciment.", unit: "M2", defaultUnitPriceCents: 2800, defaultCostCents: 800, defaultVatRate: 10, defaultLaborHours: 0.4 },
  ],
  MASONRY: [
    { title: "Démolition cloison plâtre", description: "Démolition et évacuation cloison existante, rebouchage liaison murs.", unit: "M2", defaultUnitPriceCents: 3500, defaultCostCents: 1000, defaultVatRate: 10, defaultLaborHours: 0.4 },
    { title: "Montage cloison placo BA13", description: "Ossature métallique 70mm, double plaque BA13, bande et enduit joints.", unit: "M2", defaultUnitPriceCents: 7500, defaultCostCents: 3000, defaultVatRate: 10, defaultLaborHours: 0.8 },
    { title: "Chape béton allégée", description: "Application chape béton allégée e=5cm, dressage et lissage.", unit: "M2", defaultUnitPriceCents: 3500, defaultCostCents: 1400, defaultVatRate: 10, defaultLaborHours: 0.4 },
    { title: "Reprise enduit extérieur", description: "Piquage zones décollées, application enduit hydraulique 3 couches.", unit: "M2", defaultUnitPriceCents: 6500, defaultCostCents: 2500, defaultVatRate: 10, defaultLaborHours: 0.7 },
    { title: "Percement mur porteur", description: "Carottage mur béton ou maçonnerie, linteau posé si nécessaire.", unit: "UNIT", defaultUnitPriceCents: 35000, defaultCostCents: 12000, defaultVatRate: 10, defaultLaborHours: 6 },
    { title: "Saignée et rebouchage", description: "Réalisation saignée pour encastrement conduit, rebouchage enduit.", unit: "ML", defaultUnitPriceCents: 3500, defaultCostCents: 1200, defaultVatRate: 10, defaultLaborHours: 0.4 },
  ],
  ELECTRICITY: [
    { title: "Pose prise de courant 16A", description: "Fourniture et pose prise encastrée 16A 2P+T, câblage compris.", unit: "UNIT", defaultUnitPriceCents: 8500, defaultCostCents: 2800, defaultVatRate: 10, defaultLaborHours: 1.5 },
    { title: "Pose interrupteur simple allumage", description: "Fourniture et pose interrupteur encastré simple allumage, câblage compris.", unit: "UNIT", defaultUnitPriceCents: 7500, defaultCostCents: 2200, defaultVatRate: 10, defaultLaborHours: 1.2 },
    { title: "Mise aux normes tableau électrique", description: "Remplacement tableau, disjoncteurs différentiels et divisionnaires NF C15-100.", unit: "UNIT", defaultUnitPriceCents: 125000, defaultCostCents: 52000, defaultVatRate: 10, defaultLaborHours: 12 },
    { title: "Pose luminaire plafonnier encastrable", description: "Fourniture et pose plafonnier encastré ou apparent, câblage et fixation.", unit: "UNIT", defaultUnitPriceCents: 9500, defaultCostCents: 3200, defaultVatRate: 10, defaultLaborHours: 1.5 },
    { title: "Installation VMC simple flux hygro B", description: "Fourniture et pose VMC hygro B, bouches, conduits et piquage réseau.", unit: "UNIT", defaultUnitPriceCents: 75000, defaultCostCents: 32000, defaultVatRate: 10, defaultLaborHours: 8 },
    { title: "Pose détecteur de fumée certifié", description: "Fourniture et pose détecteur ionique normé AFNOR NF EN 14604.", unit: "UNIT", defaultUnitPriceCents: 4500, defaultCostCents: 1500, defaultVatRate: 10, defaultLaborHours: 0.5 },
  ],
  CARPENTRY: [
    { title: "Pose porte intérieure prépeinte", description: "Fourniture et pose porte 204×83 avec huisserie, quincaillerie incluse.", unit: "UNIT", defaultUnitPriceCents: 42000, defaultCostCents: 17000, defaultVatRate: 10, defaultLaborHours: 4 },
    { title: "Remplacement fenêtre PVC double vitrage", description: "Dépose ancienne menuiserie, fourniture et pose fenêtre PVC Uw≤1.3.", unit: "UNIT", defaultUnitPriceCents: 95000, defaultCostCents: 45000, defaultVatRate: 5.5, defaultLaborHours: 8 },
    { title: "Pose parquet contrecollé 14mm", description: "Fourniture et pose parquet contrecollé clippage flottant, plinthes incluses.", unit: "M2", defaultUnitPriceCents: 6500, defaultCostCents: 2800, defaultVatRate: 10, defaultLaborHours: 0.6 },
    { title: "Pose plinthes MDF prépeintes", description: "Fourniture et pose plinthes 70mm, coupe onglets, mastic joints.", unit: "ML", defaultUnitPriceCents: 1800, defaultCostCents: 700, defaultVatRate: 10, defaultLaborHours: 0.2 },
    { title: "Pose garde-corps escalier", description: "Fourniture et pose garde-corps métallique ou bois, fixation renforcée.", unit: "ML", defaultUnitPriceCents: 28000, defaultCostCents: 12000, defaultVatRate: 10, defaultLaborHours: 3 },
  ],
  HEATING: [
    { title: "Remplacement radiateur acier", description: "Dépose ancien radiateur, fourniture et pose radiateur acier, raccordements.", unit: "UNIT", defaultUnitPriceCents: 55000, defaultCostCents: 22000, defaultVatRate: 5.5, defaultLaborHours: 5 },
    { title: "Entretien annuel chaudière gaz", description: "Nettoyage brûleur, vérification combustion, contrôle sécurités, rapport.", unit: "UNIT", defaultUnitPriceCents: 18000, defaultCostCents: 5500, defaultVatRate: 10, defaultLaborHours: 2 },
    { title: "Pose thermostat programmable connecté", description: "Fourniture et pose thermostat connecté, paramétrage plages horaires.", unit: "UNIT", defaultUnitPriceCents: 28000, defaultCostCents: 11000, defaultVatRate: 5.5, defaultLaborHours: 2.5 },
    { title: "Désembouage réseau chauffage", description: "Nettoyage chimique circuit, rinçage, ajout inhibiteur anticorrosion.", unit: "UNIT", defaultUnitPriceCents: 45000, defaultCostCents: 15000, defaultVatRate: 10, defaultLaborHours: 5 },
    { title: "Remplacement vase d'expansion", description: "Dépose et remplacement vase d'expansion membrane + pressurisation circuit.", unit: "UNIT", defaultUnitPriceCents: 19000, defaultCostCents: 7000, defaultVatRate: 10, defaultLaborHours: 2 },
  ],
  ROOFING: [
    { title: "Remplacement tuiles cassées", description: "Dépose tuiles cassées, fourniture et repose tuiles assorties.", unit: "UNIT", defaultUnitPriceCents: 3500, defaultCostCents: 1200, defaultVatRate: 10, defaultLaborHours: 0.4 },
    { title: "Nettoyage et traitement toiture", description: "Nettoyage haute pression, application traitement antimousse hydrofuge.", unit: "M2", defaultUnitPriceCents: 2800, defaultCostCents: 900, defaultVatRate: 10, defaultLaborHours: 0.3 },
    { title: "Réfection faîtage au mortier", description: "Dépose faîtière, rejointoiement ou repose au mortier hydraulique.", unit: "ML", defaultUnitPriceCents: 9500, defaultCostCents: 3500, defaultVatRate: 10, defaultLaborHours: 1 },
    { title: "Pose gouttière zinc demi-ronde", description: "Dépose vétuste, fourniture et pose gouttière demi-ronde zinc 333.", unit: "ML", defaultUnitPriceCents: 8500, defaultCostCents: 3800, defaultVatRate: 10, defaultLaborHours: 0.9 },
    { title: "Réparation velux fenêtre de toit", description: "Remplacement joint étanchéité, vérification cadre, remise en état.", unit: "UNIT", defaultUnitPriceCents: 32000, defaultCostCents: 12000, defaultVatRate: 10, defaultLaborHours: 4 },
  ],
  INSULATION: [
    { title: "Isolation combles perdus soufflée", description: "Fourniture et mise en œuvre laine minérale soufflée e=25cm R≥7.", unit: "M2", defaultUnitPriceCents: 2800, defaultCostCents: 1100, defaultVatRate: 5.5, defaultLaborHours: 0.25 },
    { title: "Isolation murs intérieure ITI", description: "Doublage complexe polyuréthane 100mm sur ossature, BA13 inclus.", unit: "M2", defaultUnitPriceCents: 9500, defaultCostCents: 4200, defaultVatRate: 5.5, defaultLaborHours: 0.9 },
    { title: "Isolation plancher bas PSE", description: "Pose panneaux PSE 80mm sous plancher, fixation chevilles.", unit: "M2", defaultUnitPriceCents: 4800, defaultCostCents: 1900, defaultVatRate: 5.5, defaultLaborHours: 0.45 },
    { title: "Isolation thermique extérieure ITE", description: "Pose système ITE : colle, panneaux PSE 120mm, enduit armé, finition.", unit: "M2", defaultUnitPriceCents: 18000, defaultCostCents: 8500, defaultVatRate: 5.5, defaultLaborHours: 1.5 },
    { title: "Pose pare-vapeur continu", description: "Fourniture et pose pare-vapeur continu, raccords et adhésifs inclus.", unit: "M2", defaultUnitPriceCents: 1200, defaultCostCents: 450, defaultVatRate: 5.5, defaultLaborHours: 0.15 },
  ],
  GENERAL_RENOVATION: [
    { title: "Nettoyage de fin de chantier", description: "Nettoyage complet, évacuation déchets, remise en état des accès.", unit: "HOUR", defaultUnitPriceCents: 4500, defaultCostCents: 1500, defaultVatRate: 10, defaultLaborHours: 1 },
    { title: "Protection chantier sol et mobilier", description: "Mise en place protections sols et meubles, signalisation accès.", unit: "PACKAGE", defaultUnitPriceCents: 18000, defaultCostCents: 7000, defaultVatRate: 10, defaultLaborHours: 3 },
    { title: "Déplacement et transport matériel", description: "Déplacement zone d'intervention, transport matériaux et outillage.", unit: "UNIT", defaultUnitPriceCents: 6500, defaultCostCents: 2500, defaultVatRate: 10, defaultLaborHours: 1 },
    { title: "Coordination et suivi de chantier", description: "Gestion planning, réunions chantier, suivi sous-traitants.", unit: "HOUR", defaultUnitPriceCents: 8500, defaultCostCents: 2800, defaultVatRate: 10, defaultLaborHours: 1 },
    { title: "Fournitures diverses et consommables", description: "Visserie, chevilles, colles, mastics et consommables divers.", unit: "PACKAGE", defaultUnitPriceCents: 15000, defaultCostCents: 9000, defaultVatRate: 10 },
  ],
};

export async function importPresetItemsAction(formData: FormData) {
  const user = await getCurrentUser();
  try {
    await assertPlanLimit(user, "workItems");
  } catch {
    redirect("/app/billing?limit=workItems");
  }
  const trade = stringFromForm(formData.get("trade"));
  if (!trade || !(trade in PRESET_CATALOG)) redirect("/app/items?error=invalid-trade");

  const presets = PRESET_CATALOG[trade];
  await prisma.workItem.createMany({
    data: presets.map((item) => ({
      userId: user.id,
      title: item.title,
      description: item.description,
      trade: trade as never,
      unit: item.unit as never,
      defaultUnitPriceCents: item.defaultUnitPriceCents,
      defaultCostCents: item.defaultCostCents,
      defaultVatRate: new Prisma.Decimal(item.defaultVatRate),
      defaultLaborHours: item.defaultLaborHours != null ? new Prisma.Decimal(item.defaultLaborHours) : null,
    })),
  });

  revalidatePath("/app/items");
  redirect(`/app/items?trade=${trade}&imported=${presets.length}`);
}

type AIGeneratedLine = {
  type: "MATERIAL" | "LABOR" | "TRAVEL" | "SERVICE" | "DISCOUNT" | "SECTION";
  title: string;
  description: string;
  quantity: number;
  unit: "UNIT" | "HOUR" | "DAY" | "M2" | "M3" | "ML" | "PACKAGE";
  unitPriceHtCents: number;
  unitCostCents: number | null;
  vatRate: number;
};

const AI_SYSTEM_PROMPT = `Tu es un expert en BTP français. Tu génères des lignes de devis réalistes pour artisans.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte ni markdown, sans balises \`\`\`.
Format de chaque objet :
{"type":"SERVICE","title":"...","description":"...","quantity":1,"unit":"PACKAGE","unitPriceHtCents":10000,"unitCostCents":4000,"vatRate":10}
Types : MATERIAL, LABOR, TRAVEL, SERVICE, DISCOUNT, SECTION
Unités : UNIT, HOUR, DAY, M2, M3, ML, PACKAGE
TVA : 10% rénovation habitation principale, 5.5% isolation/énergie, 20% neuf ou locaux pro, 0% franchise
Les prix sont en centimes d'euros (ex: 150€ = 15000). Max 10 lignes. Prix réalistes marché français 2026.
Sépare toujours matériaux et main-d'œuvre en lignes distinctes quand pertinent.`;

export async function generateAIQuoteLinesAction(
  description: string,
  trade?: string,
): Promise<ActionResult<AIGeneratedLine[]>> {
  try {
    await getCurrentUser();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, message: "Assistant IA non configuré (ANTHROPIC_API_KEY manquant)." };
    if (!description.trim()) return { ok: false, message: "La description est vide." };

    const client = new Anthropic({ apiKey });
    const tradeHint = trade && trade !== "" ? `Corps de métier : ${trade}. ` : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${tradeHint}Génère les lignes de devis pour ce chantier :\n${description}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = raw.startsWith("```") ? raw.replace(/```(?:json)?/g, "").trim() : raw;
    const parsed: unknown = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Not an array");

    const lines: AIGeneratedLine[] = (parsed as Record<string, unknown>[]).map((item) => ({
      type: (item.type as AIGeneratedLine["type"]) ?? "SERVICE",
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      quantity: Math.max(0.01, Number(item.quantity) || 1),
      unit: (item.unit as AIGeneratedLine["unit"]) ?? "PACKAGE",
      unitPriceHtCents: Math.round(Math.max(0, Number(item.unitPriceHtCents) || 0)),
      unitCostCents: item.unitCostCents != null ? Math.round(Math.max(0, Number(item.unitCostCents))) : null,
      vatRate: Number(item.vatRate) || 10,
    }));

    return { ok: true, data: lines };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, message: "L'IA n'a pas retourné un format valide. Réessayez avec une description plus précise." };
    }
    return toActionError(error);
  }
}

// ─── Invoice lifecycle ────────────────────────────────────────────────────────

export async function issueInvoiceAction(invoiceId: string) {
  const user = await getCurrentUser();
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId: user.id } });
  if (!invoice || invoice.status !== "DRAFT") redirect(`/app/invoices/${invoiceId}`);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "ISSUED" },
  });
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${invoiceId}?issued=1`);
}

export async function markInvoicePaidAction(invoiceId: string) {
  const user = await getCurrentUser();
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId: user.id } });
  if (!invoice || invoice.status === "PAID" || invoice.status === "CANCELLED") {
    redirect(`/app/invoices/${invoiceId}`);
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", amountPaidCents: invoice.totalTtcCents },
  });
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${invoiceId}?paid=1`);
}

export async function createInvoicePaymentLinkAction(invoiceId: string): Promise<ActionResult<string>> {
  try {
    const user = await getCurrentUser();
    if (!process.env.STRIPE_SECRET_KEY) return { ok: false, message: "Stripe non configuré sur ce compte." };

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
      include: { client: true },
    });
    if (!invoice) return { ok: false, message: "Facture introuvable." };
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return { ok: false, message: "Cette facture ne peut plus être payée en ligne." };
    }
    if (invoice.stripePaymentLinkUrl) return { ok: true, data: invoice.stripePaymentLinkUrl };

    const { getStripe, getAppUrl } = await import("@/lib/stripe");
    const stripe = getStripe();
    const appUrl = getAppUrl();

    const price = await stripe.prices.create({
      currency: "eur",
      unit_amount: invoice.totalTtcCents,
      product_data: { name: `Facture ${invoice.invoiceNumber}` },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { invoiceId, userId: user.id },
      after_completion: {
        type: "redirect",
        redirect: { url: `${appUrl}/app/invoices/${invoiceId}?paid=1` },
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripePaymentLinkId: paymentLink.id,
        stripePaymentLinkUrl: paymentLink.url,
        status: invoice.status === "DRAFT" ? "ISSUED" : invoice.status,
      },
    });

    revalidatePath(`/app/invoices/${invoiceId}`);
    return { ok: true, data: paymentLink.url };
  } catch (error) {
    return toActionError(error);
  }
}

// ─── Invoice reminder ─────────────────────────────────────────────────────────

export async function sendInvoiceReminderAction(invoiceId: string) {
  const user = await getCurrentUser();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: user.id },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" } },
    },
  });
  if (!invoice || !invoice.client.email) redirect(`/app/invoices?error=no-email`);
  if (invoice.status !== "ISSUED" && invoice.status !== "OVERDUE") redirect(`/app/invoices`);

  const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const clientName = invoice.client.companyName || invoice.client.name;
  const companyName = company?.companyName ?? "Votre prestataire";
  const dueStr = new Intl.DateTimeFormat("fr-FR").format(invoice.dueDate);
  const totalStr = (invoice.totalTtcCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const isOverdue = invoice.dueDate < new Date();

  const subject = isOverdue
    ? `[RAPPEL] Facture ${invoice.invoiceNumber} — règlement en attente`
    : `Rappel d'échéance — Facture ${invoice.invoiceNumber}`;

  const html = `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><title>Relance facture</title></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fffdf8;border-radius:12px;overflow:hidden;border:1px solid #e2d9c8;">
    <div style="background:#1f3b57;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${companyName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Relance de paiement</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#1f2933;">Bonjour ${clientName},</p>
      <p style="font-size:15px;color:#1f2933;line-height:1.6;">
        ${isOverdue
    ? `Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture <strong>${invoice.invoiceNumber}</strong>, dont l'échéance était le <strong>${dueStr}</strong>.`
    : `Nous vous rappelons que la facture <strong>${invoice.invoiceNumber}</strong> arrive à échéance le <strong>${dueStr}</strong>.`
  }
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Montant à régler</p>
        <p style="margin:0;font-size:28px;font-weight:800;color:#1f3b57;">${totalStr}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Facture n° ${invoice.invoiceNumber}</p>
      </div>
      <p style="font-size:14px;color:#64748b;line-height:1.6;">${invoice.paymentTerms}</p>
      <p style="font-size:14px;color:#1f2933;">Merci de nous contacter si vous avez le moindre doute sur cette facture.</p>
      <p style="font-size:14px;color:#1f2933;margin-top:24px;">Cordialement,<br /><strong>${companyName}</strong></p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;font-size:11px;color:#94a3b8;">
      Ce message a été envoyé via ChantierDevis. Pour toute question, contactez directement l'émetteur.
    </div>
  </div>
</body></html>`;

  const text = `Bonjour ${clientName},\n\n${isOverdue ? `La facture ${invoice.invoiceNumber} était due le ${dueStr}. Montant: ${totalStr}.` : `La facture ${invoice.invoiceNumber} est due le ${dueStr}. Montant: ${totalStr}.`}\n\n${invoice.paymentTerms}\n\nCordialement,\n${companyName}`;

  await sendTransactionalEmail({ to: invoice.client.email, subject, html, text });
  redirect(`/app/invoices?reminded=1`);
}

// ─── Quote validity extension ─────────────────────────────────────────────────

export async function extendQuoteValidityAction(quoteId: string) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId: user.id } });
  if (!quote) redirect(`/app/quotes`);

  const currentValid = quote.validUntil < new Date() ? new Date() : quote.validUntil;
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      validUntil: addDays(currentValid, 30),
      status: quote.status === "EXPIRED" ? "READY" : quote.status,
    },
  });
  await prisma.quoteEvent.create({
    data: {
      quoteId,
      type: "UPDATED",
      title: "Validité prolongée de 30 jours",
      eventDate: new Date(),
    },
  });
  revalidatePath(`/app/quotes/${quoteId}`);
  redirect(`/app/quotes/${quoteId}?extended=1`);
}

// ─── Cancel invoice ────────────────────────────────────────────────────────────

export async function cancelInvoiceAction(invoiceId: string) {
  const user = await getCurrentUser();
  await prisma.invoice.updateMany({
    where: { id: invoiceId, userId: user.id, status: { not: "PAID" } },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/app/invoices/${invoiceId}`);
  redirect(`/app/invoices/${invoiceId}`);
}

// ─── Update invoice due date ─────────────────────────────────────────────────

export async function updateInvoiceDueDateAction(invoiceId: string, formData: FormData) {
  const user = await getCurrentUser();
  const dateStr = stringFromForm(formData.get("dueDate"));
  if (!dateStr) redirect(`/app/invoices/${invoiceId}`);
  const dueDate = new Date(dateStr);
  if (isNaN(dueDate.getTime())) redirect(`/app/invoices/${invoiceId}`);

  await prisma.invoice.updateMany({
    where: { id: invoiceId, userId: user.id, status: { not: "PAID" }, NOT: { status: "CANCELLED" } },
    data: { status: "ISSUED", dueDate },
  });
  revalidatePath(`/app/invoices/${invoiceId}`);
  redirect(`/app/invoices/${invoiceId}?issued=1`);
}

// ─── Send invoice by email ────────────────────────────────────────────────────

export async function sendInvoiceEmailAction(invoiceId: string, formData: FormData) {
  const user = await getCurrentUser();
  const toEmail = stringFromForm(formData.get("toEmail"));
  const message = stringFromForm(formData.get("message"));
  if (!toEmail || !toEmail.includes("@")) redirect(`/app/invoices/${invoiceId}?email=invalid`);

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: user.id },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" } },
      quote: { select: { quoteNumber: true } },
    },
  });
  if (!invoice) redirect(`/app/invoices/${invoiceId}`);
  if (invoice.status === "CANCELLED") redirect(`/app/invoices/${invoiceId}`);

  const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const clientName = escapeEmailHtml(invoice.client.companyName || invoice.client.name);
  const companyName = escapeEmailHtml(company?.companyName ?? "Votre prestataire");
  const invoiceNum = escapeEmailHtml(invoice.invoiceNumber);
  const dueStr = new Intl.DateTimeFormat("fr-FR").format(invoice.dueDate);
  const issuedStr = new Intl.DateTimeFormat("fr-FR").format(invoice.issueDate);
  const totalStr = (invoice.totalTtcCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const htStr = (invoice.subtotalHtCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const paymentLinkHtml = invoice.stripePaymentLinkUrl
    ? `<div style="margin:24px 0;text-align:center;"><a href="${escapeEmailHtml(invoice.stripePaymentLinkUrl)}" style="display:inline-block;background:#e86218;color:#fff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Payer en ligne →</a><p style="margin:8px 0 0;font-size:12px;color:#64748b;">Paiement sécurisé par carte bancaire</p></div>`
    : "";

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><title>Facture ${invoiceNum}</title></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fffdf8;border-radius:12px;overflow:hidden;border:1px solid #e2d9c8;">
    <div style="background:#1f3b57;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${companyName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Facture n° ${invoiceNum}</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#1f2933;">Bonjour ${clientName},</p>
      <p style="font-size:15px;color:#1f2933;line-height:1.6;">
        Veuillez trouver ci-joint votre facture <strong>${invoiceNum}</strong>.
      </p>
      ${message ? `<p style="font-size:15px;color:#1f2933;line-height:1.6;background:#f8fafc;border-left:3px solid #e86218;padding:12px 16px;border-radius:0 6px 6px 0;">${emailParagraph(message)}</p>` : ""}
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Récapitulatif</p>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;color:#64748b;">N° facture</span>
          <strong style="font-size:14px;color:#1f2933;">${invoiceNum}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;color:#64748b;">Date d'émission</span>
          <strong style="font-size:14px;color:#1f2933;">${issuedStr}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;color:#64748b;">Montant HT</span>
          <strong style="font-size:14px;color:#1f2933;">${htStr}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#64748b;">Montant TTC</span>
          <strong style="font-size:18px;color:#1f3b57;">${totalStr}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;">
          <span style="font-size:14px;color:#64748b;">Échéance</span>
          <strong style="font-size:14px;color:#e86218;">${dueStr}</strong>
        </div>
      </div>
      ${paymentLinkHtml}
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin-top:16px;">
        La facture détaillée est jointe à cet email en PDF. Pour toute question, n'hésitez pas à nous contacter.
      </p>
      <p style="font-size:14px;color:#1f2933;margin-top:24px;">Cordialement,<br /><strong>${companyName}</strong></p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;font-size:11px;color:#94a3b8;">
      Ce document a été généré via ChantierDevis. Pour toute question, contactez directement l'émetteur.
    </div>
  </div>
</body></html>`;

  const result = await sendTransactionalEmail({
    to: toEmail,
    subject: `Facture ${invoice.invoiceNumber} — ${companyName}`,
    html,
    text: `Bonjour ${invoice.client.companyName || invoice.client.name},\n\nVeuillez trouver ci-joint la facture ${invoice.invoiceNumber}.\nMontant TTC : ${totalStr} — Échéance : ${dueStr}.\n\n${message}\n\nCordialement,\n${company?.companyName ?? ""}`,
  });

  if (result.status === "SENT") {
    revalidatePath(`/app/invoices/${invoiceId}`);
    redirect(`/app/invoices/${invoiceId}?emailed=1`);
  } else {
    redirect(`/app/invoices/${invoiceId}?email=failed`);
  }
}
