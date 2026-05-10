import { NextResponse } from "next/server";
import { formatShortFrenchDate } from "@/domain/quotes";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_FR: Record<string, string> = {
  DRAFT: "Brouillon", READY: "Prêt", SENT: "Envoyé", ACCEPTED: "Accepté",
  REFUSED: "Refusé", EXPIRED: "Expiré", ARCHIVED: "Archivé",
};

function csvEsc(value: unknown): string {
  const s = String(value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  const quotes = await prisma.quote.findMany({
    where: { userId: user.id },
    include: { client: { select: { name: true, companyName: true } } },
    orderBy: { issueDate: "desc" },
  });

  const header = ["N° Devis", "Titre", "Client", "Statut", "Date émission", "Validité", "Sous-total HT (€)", "TVA (€)", "TTC (€)", "Marge brute (%)"].map(csvEsc).join(";");
  const rows = quotes.map((q) => [
    csvEsc(q.quoteNumber),
    csvEsc(q.title),
    csvEsc(q.client.companyName || q.client.name),
    csvEsc(STATUS_FR[q.status] ?? q.status),
    csvEsc(formatShortFrenchDate(q.issueDate)),
    csvEsc(formatShortFrenchDate(q.validUntil)),
    csvEsc((q.subtotalHtCents / 100).toFixed(2).replace(".", ",")),
    csvEsc((q.totalVatCents / 100).toFixed(2).replace(".", ",")),
    csvEsc((q.totalTtcCents / 100).toFixed(2).replace(".", ",")),
    csvEsc(Number(q.grossMarginRate).toFixed(1).replace(".", ",")),
  ].join(";"));

  const csv = "﻿" + [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="devis-chantierdevis.csv"`,
      "x-robots-tag": "noindex",
    },
  });
}
