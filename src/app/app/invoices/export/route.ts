import { NextResponse } from "next/server";
import { formatShortFrenchDate } from "@/domain/quotes";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_FR: Record<string, string> = {
  DRAFT: "Brouillon", ISSUED: "Émise", PAID: "Payée", OVERDUE: "En retard", CANCELLED: "Annulée",
};

function csvEsc(value: unknown): string {
  const s = String(value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: {
      client: { select: { name: true, companyName: true } },
      quote: { select: { quoteNumber: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  const header = ["N° Facture", "Devis", "Client", "Date émission", "Échéance", "Statut", "HT (€)", "TVA (€)", "TTC (€)", "Payé (€)", "Reste dû (€)"].map(csvEsc).join(";");
  const rows = invoices.map((inv) => [
    csvEsc(inv.invoiceNumber),
    csvEsc(inv.quote.quoteNumber),
    csvEsc(inv.client.companyName || inv.client.name),
    csvEsc(formatShortFrenchDate(inv.issueDate)),
    csvEsc(formatShortFrenchDate(inv.dueDate)),
    csvEsc(STATUS_FR[inv.status] ?? inv.status),
    csvEsc((inv.subtotalHtCents / 100).toFixed(2).replace(".", ",")),
    csvEsc((inv.totalVatCents / 100).toFixed(2).replace(".", ",")),
    csvEsc((inv.totalTtcCents / 100).toFixed(2).replace(".", ",")),
    csvEsc((inv.amountPaidCents / 100).toFixed(2).replace(".", ",")),
    csvEsc(((inv.totalTtcCents - inv.amountPaidCents) / 100).toFixed(2).replace(".", ",")),
  ].join(";"));

  const csv = "﻿" + [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="factures-chantierdevis.csv"`,
      "x-robots-tag": "noindex",
    },
  });
}
