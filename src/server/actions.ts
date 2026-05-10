"use server";

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
  const subject = `Votre devis ${quote.quoteNumber} - ${quote.title}`;
  const safeQuoteNumber = escapeEmailHtml(quote.quoteNumber);
  const safeQuoteTitle = escapeEmailHtml(quote.title);
  const safeCompanyName = escapeEmailHtml(company.companyName);
  const html = `
    <p>Bonjour,</p>
    <p>Veuillez trouver ci-joint le devis ${safeQuoteNumber} pour ${safeQuoteTitle}.</p>
    ${message ? `<p>${emailParagraph(message)}</p>` : ""}
    <p>Cordialement,<br />${safeCompanyName}</p>
  `;
  const result = await sendTransactionalEmail({
    to: toEmail,
    subject,
    html,
    text: `Bonjour,\n\nVeuillez trouver ci-joint le devis ${quote.quoteNumber} pour ${quote.title}.\n\n${message}\n\nCordialement,\n${company.companyName}`,
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
        create: quote.lines.map((line) => ({
          quoteLineId: line.id,
          position: line.position,
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
