import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const data = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      companyProfile: true,
      clients: { include: { quotes: true, invoices: true } },
      workItems: true,
      quotes: {
        include: {
          lines: true,
          events: true,
          documents: true,
          followUpReminders: true,
          invoices: { include: { lines: true } },
          emailDeliveries: true,
        },
      },
      invoices: { include: { lines: true } },
      emailDeliveries: true,
      dataRequests: true,
      auditLogs: true,
    },
  });

  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const safeUser: Record<string, unknown> = { ...data };
  delete safeUser.passwordHash;

  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), user: safeUser }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="chantierdevis-export-${user.id}.json"`,
    },
  });
}
