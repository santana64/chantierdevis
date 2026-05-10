import { NextResponse } from "next/server";
import { generateFacturXml } from "@/lib/facturx";
import { getInvoiceDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invoice, company } = await getInvoiceDetail(id);

  if (!invoice) {
    return new NextResponse("Facture introuvable", { status: 404 });
  }

  const xml = generateFacturXml(invoice, company);
  const filename = `factur-x-${invoice.invoiceNumber.replace(/[^a-z0-9]/gi, "-")}.xml`;

  return new NextResponse(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-robots-tag": "noindex",
    },
  });
}
