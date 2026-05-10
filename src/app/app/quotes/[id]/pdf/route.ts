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
      type: "QUOTE_PDF",
      quote: { userId: user.id },
      contentBase64: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!document?.contentBase64) {
    return new NextResponse("PDF introuvable", { status: 404 });
  }

  return new NextResponse(Buffer.from(document.contentBase64, "base64"), {
    headers: {
      "content-type": document.mimeType || "application/pdf",
      "content-disposition": `inline; filename="${document.fileName || "devis.pdf"}"`,
    },
  });
}
