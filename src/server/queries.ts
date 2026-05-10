import { endOfMonth, startOfMonth } from "date-fns";
import {
  computeAcceptanceRate,
  computeAverageMargin,
  getQuotesNeedingFollowUp,
} from "@/domain/quotes";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAppContext() {
  const user = await getCurrentUser();
  const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  return { user, company };
}

export async function getDashboardData() {
  const { user, company } = await getAppContext();
  const now = new Date();
  const [quotes, reminders] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id, status: { not: "ARCHIVED" } },
      include: {
        client: true,
        followUpReminders: true,
        invoices: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.followUpReminder.findMany({
      where: { quote: { userId: user.id } },
    }),
  ]);

  const monthQuotes = quotes.filter((quote) => {
    const issueDate = new Date(quote.issueDate);
    return issueDate >= startOfMonth(now) && issueDate <= endOfMonth(now);
  });
  const acceptedQuotes = quotes.filter((quote) => quote.status === "ACCEPTED");
  const followUps = getQuotesNeedingFollowUp(
    quotes.map((quote) => ({
      id: quote.id,
      status: quote.status,
      totalTtcCents: quote.totalTtcCents,
      grossMarginRate: Number(quote.grossMarginRate),
      issueDate: quote.issueDate,
      validUntil: quote.validUntil,
      updatedAt: quote.updatedAt,
    })),
    reminders.map((reminder) => ({
      quoteId: reminder.quoteId,
      dueDate: reminder.dueDate,
      status: reminder.status,
    })),
    now,
  );

  return {
    user,
    company,
    quotes,
    stats: {
      quotesThisMonth: monthQuotes.length,
      totalQuotedCents: monthQuotes.reduce((sum, quote) => sum + quote.totalTtcCents, 0),
      acceptedAmountCents: acceptedQuotes.reduce((sum, quote) => sum + quote.totalTtcCents, 0),
      acceptanceRate: computeAcceptanceRate(quotes),
      averageMargin: computeAverageMargin(
        quotes.map((quote) => ({
          status: quote.status,
          grossMarginRate: Number(quote.grossMarginRate),
        })),
      ),
      awaitingClient: quotes.filter((quote) => quote.status === "SENT").length,
      needingFollowUp: followUps.length,
      expired: quotes.filter((quote) => quote.status === "EXPIRED" || quote.validUntil < now).length,
      incompleteDrafts: quotes.filter(
        (quote) => quote.status === "DRAFT" || quote.complianceStatus === "INCOMPLETE",
      ).length,
    },
    urgent: {
      followUps,
      incompleteDrafts: quotes.filter(
        (quote) => quote.status === "DRAFT" || quote.complianceStatus === "INCOMPLETE",
      ),
      expiringSoon: quotes.filter((quote) => {
        const days = Math.ceil((quote.validUntil.getTime() - now.getTime()) / 86_400_000);
        return quote.status === "SENT" && days >= 0 && days <= 3;
      }),
      acceptedWithoutInvoice: acceptedQuotes.filter((quote) => quote.invoices.length === 0),
    },
    recentQuotes: quotes.slice(0, 8),
  };
}

export async function getQuoteListData(filters: {
  status?: string;
  client?: string;
  trade?: string;
  q?: string;
  min?: string;
  max?: string;
  from?: string;
  to?: string;
}) {
  const { user } = await getAppContext();
  const min = filters.min ? Math.round(Number(filters.min.replace(",", ".")) * 100) : undefined;
  const max = filters.max ? Math.round(Number(filters.max.replace(",", ".")) * 100) : undefined;

  const quotes = await prisma.quote.findMany({
    where: {
      userId: user.id,
      status: filters.status && filters.status !== "ALL" ? (filters.status as never) : undefined,
      trade: filters.trade && filters.trade !== "ALL" ? (filters.trade as never) : undefined,
      clientId: filters.client && filters.client !== "ALL" ? filters.client : undefined,
      totalTtcCents: {
        gte: Number.isFinite(min) ? min : undefined,
        lte: Number.isFinite(max) ? max : undefined,
      },
      issueDate: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      },
      OR: filters.q
        ? [
            { quoteNumber: { contains: filters.q, mode: "insensitive" } },
            { title: { contains: filters.q, mode: "insensitive" } },
            { client: { name: { contains: filters.q, mode: "insensitive" } } },
            { client: { companyName: { contains: filters.q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      client: true,
      followUpReminders: true,
      lines: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return { quotes, clients };
}

export async function getQuoteEditorData(quoteId?: string) {
  const { user, company } = await getAppContext();
  const [clients, workItems, quote] = await Promise.all([
    prisma.client.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.workItem.findMany({ where: { userId: user.id }, orderBy: [{ trade: "asc" }, { title: "asc" }] }),
    quoteId
      ? prisma.quote.findFirst({
          where: { id: quoteId, userId: user.id },
          include: {
            client: true,
            lines: { orderBy: { position: "asc" } },
          },
        })
      : null,
  ]);

  return {
    company,
    clients,
    workItems,
    quote,
  };
}

export async function getQuoteDetail(quoteId: string) {
  const { user, company } = await getAppContext();
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId: user.id },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" }, include: { workItem: true } },
      events: { orderBy: { eventDate: "desc" } },
      followUpReminders: { orderBy: { dueDate: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      emailDeliveries: { orderBy: { createdAt: "desc" } },
    },
  });
  return { user, company, quote };
}

export async function getClientsData() {
  const { user } = await getAppContext();
  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    include: {
      quotes: {
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return { clients };
}

export async function getWorkItemsData(filters: { q?: string; trade?: string }) {
  const { user } = await getAppContext();
  const workItems = await prisma.workItem.findMany({
    where: {
      userId: user.id,
      trade: filters.trade && filters.trade !== "ALL" ? (filters.trade as never) : undefined,
      OR: filters.q
        ? [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      _count: { select: { quoteLines: true } },
    },
    orderBy: [{ trade: "asc" }, { title: "asc" }],
  });
  return { workItems };
}

export async function getBillingData() {
  const { user } = await getAppContext();
  const [clients, quotes, workItems] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.quote.count({ where: { userId: user.id, status: { not: "ARCHIVED" } } }),
    prisma.workItem.count({ where: { userId: user.id } }),
  ]);

  return {
    user,
    usage: { clients, quotes, workItems },
  };
}

export async function getInvoicesData() {
  const { user } = await getAppContext();
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { client: true, quote: true },
    orderBy: { issueDate: "desc" },
  });
  return { invoices };
}

export async function getInvoiceDetail(invoiceId: string) {
  const { user, company } = await getAppContext();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: user.id },
    include: {
      client: true,
      quote: true,
      lines: { orderBy: { position: "asc" } },
    },
  });
  return { invoice, company };
}
