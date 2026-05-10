import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const document = await prisma.generatedQuoteDocument.findFirst({
    where: {
      quoteId: id,
      quote: { userId: user.id },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!document) {
    return new NextResponse("Document introuvable", { status: 404 });
  }

  return new NextResponse(document.contentHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
