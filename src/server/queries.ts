import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
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
  const twelveMonthsAgo = subMonths(startOfMonth(now), 11);

  const [quotes, reminders, invoices] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id, status: { not: "ARCHIVED" } },
      include: {
        client: true,
        followUpReminders: true,
        invoices: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.followUpReminder.findMany({
      where: { quote: { userId: user.id } },
    }),
    prisma.invoice.findMany({
      where: { userId: user.id, issueDate: { gte: twelveMonthsAgo } },
      select: { id: true, issueDate: true, dueDate: true, totalTtcCents: true, status: true, invoiceNumber: true, clientId: true },
    }),
  ]);

  // Auto-update overdue invoices
  await prisma.invoice.updateMany({
    where: { userId: user.id, status: "ISSUED", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  const monthQuotes = quotes.filter((q) => {
    const d = new Date(q.issueDate);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });
  const acceptedQuotes = quotes.filter((q) => q.status === "ACCEPTED");
  const followUps = getQuotesNeedingFollowUp(
    quotes.map((q) => ({
      id: q.id,
      status: q.status,
      totalTtcCents: q.totalTtcCents,
      grossMarginRate: Number(q.grossMarginRate),
      issueDate: q.issueDate,
      validUntil: q.validUntil,
      updatedAt: q.updatedAt,
    })),
    reminders.map((r) => ({ quoteId: r.quoteId, dueDate: r.dueDate, status: r.status })),
    now,
  );

  // Monthly revenue chart — last 12 months
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const start = startOfMonth(subMonths(now, 11 - i));
    const end = endOfMonth(start);
    const mq = quotes.filter((q) => { const d = new Date(q.issueDate); return d >= start && d <= end; });
    const mi = invoices.filter((inv) => { const d = new Date(inv.issueDate); return d >= start && d <= end && inv.status !== "CANCELLED"; });
    return {
      label: format(start, "MMM", { locale: fr }),
      quotedCents: mq.reduce((s, q) => s + q.totalTtcCents, 0),
      acceptedCents: mq.filter((q) => q.status === "ACCEPTED").reduce((s, q) => s + q.totalTtcCents, 0),
      invoicedCents: mi.reduce((s, inv) => s + inv.totalTtcCents, 0),
    };
  });

  const unpaidInvoices = invoices.filter((inv) => inv.status === "ISSUED" || inv.status === "OVERDUE");
  const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE" || (inv.status === "ISSUED" && inv.dueDate < now));

  return {
    user,
    company,
    quotes,
    monthlyRevenue,
    invoiceStats: {
      unpaidCents: unpaidInvoices.reduce((s, inv) => s + inv.totalTtcCents, 0),
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length,
    },
    stats: {
      quotesThisMonth: monthQuotes.length,
      totalQuotedCents: monthQuotes.reduce((s, q) => s + q.totalTtcCents, 0),
      acceptedAmountCents: acceptedQuotes.reduce((s, q) => s + q.totalTtcCents, 0),
      acceptanceRate: computeAcceptanceRate(quotes),
      averageMargin: computeAverageMargin(quotes.map((q) => ({ status: q.status, grossMarginRate: Number(q.grossMarginRate) }))),
      awaitingClient: quotes.filter((q) => q.status === "SENT").length,
      needingFollowUp: followUps.length,
      expired: quotes.filter((q) => q.status === "EXPIRED" || q.validUntil < now).length,
      incompleteDrafts: quotes.filter((q) => q.status === "DRAFT" || q.complianceStatus === "INCOMPLETE").length,
    },
    urgent: {
      followUps,
      incompleteDrafts: quotes.filter((q) => q.status === "DRAFT" || q.complianceStatus === "INCOMPLETE"),
      expiringSoon: quotes.filter((q) => {
        const days = Math.ceil((q.validUntil.getTime() - now.getTime()) / 86_400_000);
        return q.status === "SENT" && days >= 0 && days <= 3;
      }),
      acceptedWithoutInvoice: acceptedQuotes.filter((q) => q.invoices.length === 0),
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
      invoices: { select: { id: true, invoiceNumber: true, status: true } },
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
      quotes: { orderBy: { updatedAt: "desc" } },
      invoices: { select: { totalTtcCents: true, status: true } },
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
