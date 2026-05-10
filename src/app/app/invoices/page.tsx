import { Bell, Download, Printer, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { InvoiceStatusBadge } from "@/components/badges";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { sendInvoiceReminderAction } from "@/server/actions";
import { prisma } from "@/lib/prisma";
import { getAppContext } from "@/server/queries";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "ALL", label: "Toutes" },
  { value: "ISSUED", label: "Émises" },
  { value: "OVERDUE", label: "En retard" },
  { value: "PAID", label: "Payées" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "CANCELLED", label: "Annulées" },
];

function sp(params: Record<string, string | string[] | undefined>, key: string) {
  const v = params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeStatus = sp(params, "status") || "ALL";
  const reminded = sp(params, "reminded");
  const clientFilter = sp(params, "client") || null;
  const q = sp(params, "q") || null;

  const { user } = await getAppContext();
  const now = new Date();

  // Auto-mark overdue
  await prisma.invoice.updateMany({
    where: { userId: user.id, status: "ISSUED", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  const [invoices, allInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        ...(activeStatus !== "ALL" ? { status: activeStatus as never } : {}),
        ...(clientFilter ? { clientId: clientFilter } : {}),
        ...(q ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
            { client: { companyName: { contains: q, mode: "insensitive" as const } } },
          ],
        } : {}),
      },
      include: {
        client: { select: { id: true, name: true, companyName: true, email: true } },
        quote: { select: { quoteNumber: true, id: true } },
      },
      orderBy: [{ dueDate: "asc" }],
    }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      select: { status: true, totalTtcCents: true },
    }),
  ]);

  const unpaidTotal = allInvoices
    .filter((inv) => inv.status === "ISSUED" || inv.status === "OVERDUE")
    .reduce((s, inv) => s + inv.totalTtcCents, 0);
  const overdueCount = allInvoices.filter((inv) => inv.status === "OVERDUE").length;
  const paidTotal = allInvoices
    .filter((inv) => inv.status === "PAID")
    .reduce((s, inv) => s + inv.totalTtcCents, 0);

  return (
    <>
      <PageHeader
        title="Factures"
        description="Suivi des encaissements, relances et exports Factur-X."
        action={
          <a
            href="/app/invoices/export"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:bg-white hover:border-[#c0c9d8]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        }
      />

      {reminded ? (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">
          Relance envoyée au client avec succès.
        </div>
      ) : null}

      {clientFilter ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
          Filtré par client ·
          <Link href="/app/invoices" className="font-semibold underline underline-offset-4">
            Voir toutes les factures
          </Link>
        </div>
      ) : null}

      {/* Summary */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">À encaisser</p>
          <p className={`mt-2 text-2xl font-black tabular-nums ${unpaidTotal > 0 ? "text-primary" : "text-foreground"}`}>
            {formatMoney(unpaidTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">En retard</p>
          <p className={`mt-2 text-2xl font-black tabular-nums ${overdueCount > 0 ? "text-red-600" : "text-foreground"}`}>
            {overdueCount} facture{overdueCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Encaissé (total)</p>
          <p className="mt-2 text-2xl font-black tabular-nums text-green-700">{formatMoney(paidTotal)}</p>
        </div>
      </div>

      {/* Status tabs + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const isActive = tab.value === activeStatus;
            const href = tab.value === "ALL"
              ? (q ? `/app/invoices?q=${encodeURIComponent(q)}` : "/app/invoices")
              : (q ? `/app/invoices?status=${tab.value}&q=${encodeURIComponent(q)}` : `/app/invoices?status=${tab.value}`);
            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:border-[#c0c9d8]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <form className="relative shrink-0">
          {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="N° facture, client…"
            className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 sm:w-52"
          />
        </form>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Aucune facture"
              description={
                activeStatus === "ALL"
                  ? "Acceptez un devis et utilisez « Convertir en facture » depuis le détail du devis."
                  : `Aucune facture avec ce statut.`
              }
            />
          </div>
        ) : (
          <>
            <div className="border-b border-border px-5 py-3 text-sm text-muted">
              <span className="font-semibold text-foreground">{invoices.length}</span>{" "}
              facture{invoices.length !== 1 ? "s" : ""}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Facture</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Devis</th>
                    <th className="px-5 py-3">Émission</th>
                    <th className="px-5 py-3">Échéance</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Total TTC</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const isOverdue = invoice.status === "OVERDUE";
                    return (
                      <tr
                        key={invoice.id}
                        className={`border-t border-border transition hover:bg-white ${isOverdue ? "bg-red-50/30" : "bg-card"}`}
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/app/invoices/${invoice.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3">{invoice.client.companyName || invoice.client.name}</td>
                        <td className="px-5 py-3">
                          <Link href={`/app/quotes/${invoice.quote.id}`} className="text-primary hover:underline">
                            {invoice.quote.quoteNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-muted">
                          {formatShortFrenchDate(invoice.issueDate)}
                        </td>
                        <td className={`px-5 py-3 tabular-nums font-medium ${isOverdue ? "text-red-700" : "text-muted"}`}>
                          {formatShortFrenchDate(invoice.dueDate)}
                          {isOverdue ? " ⚠️" : ""}
                        </td>
                        <td className="px-5 py-3">
                          <InvoiceStatusBadge status={invoice.status} />
                        </td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums">
                          {formatMoney(invoice.totalTtcCents)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <LinkButton href={`/app/invoices/${invoice.id}`} variant="secondary" size="sm">
                              Voir
                            </LinkButton>
                            <LinkButton href={`/app/invoices/${invoice.id}/print`} variant="secondary" size="sm">
                              <Printer className="h-3.5 w-3.5" />
                            </LinkButton>
                            <a
                              href={`/app/invoices/${invoice.id}/facturx`}
                              download
                              title="Factur-X"
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-xs font-semibold shadow-sm hover:bg-[#fffdf8]"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") &&
                            invoice.client.email ? (
                              <form action={sendInvoiceReminderAction.bind(null, invoice.id)}>
                                <button
                                  type="submit"
                                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold shadow-sm transition ${
                                    isOverdue
                                      ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                      : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  }`}
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                  Relancer
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
