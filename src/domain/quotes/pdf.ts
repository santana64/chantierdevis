import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { calculateDeposit, formatFrenchDate, formatMoney, formatShortFrenchDate } from ".";
import type { CalculatedQuoteLine } from "./types";

type PdfInput = {
  company: {
    companyName: string;
    address: string;
    postalCode: string;
    city: string;
    siret?: string | null;
    siren?: string | null;
    vatMode: "STANDARD" | "FRANCHISE_BASE";
    phone?: string | null;
    email?: string | null;
    insuranceProvider?: string | null;
    insurancePolicyNumber?: string | null;
    decennaleMention?: string | null;
  };
  client: {
    name: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    billingAddress: string;
    billingPostalCode: string;
    billingCity: string;
  };
  quote: {
    quoteNumber: string;
    title: string;
    issueDate: Date | string;
    validUntil: Date | string;
    workSiteAddress: string;
    workSitePostalCode: string;
    workSiteCity: string;
    estimatedStartDate?: Date | string | null;
    estimatedDurationText?: string | null;
    isQuotePaid?: boolean;
    quoteFeeCents?: number | null;
    paymentTerms: string;
    depositPercent?: unknown;
    depositAmountCents?: number | null;
    subtotalHtCents: number;
    totalVatCents: number;
    totalTtcCents: number;
  };
  lines: CalculatedQuoteLine[];
};

function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\u{10000}-\u{10ffff}]/gu, "");
}

function wrap(text: string, max = 72) {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > max) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function generateQuotePdfBytes(input: PdfInput) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const franchise = input.company.vatMode === "FRANCHISE_BASE";
  const totalTtc = franchise ? input.quote.subtotalHtCents : input.quote.totalTtcCents;
  const depositPercent = nullableNumber(input.quote.depositPercent);
  const depositAmount =
    input.quote.depositAmountCents ?? calculateDeposit(totalTtc, depositPercent);
  const remainingAmount = Math.max(0, totalTtc - Math.max(0, depositAmount));

  function newPageIfNeeded(height = 40) {
    if (y - height > margin) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  function text(value: string, x: number, size = 10, isBold = false, color = rgb(0.12, 0.23, 0.34)) {
    page.drawText(safeText(value), { x, y, size, font: isBold ? bold : regular, color });
  }

  text(`Devis ${input.quote.quoteNumber}`, margin, 24, true);
  y -= 34;
  text(input.quote.title, margin, 14, true, rgb(0.95, 0.39, 0.05));
  y -= 28;

  text(input.company.companyName, margin, 12, true);
  y -= 15;
  text(`${input.company.address}, ${input.company.postalCode} ${input.company.city}`, margin);
  y -= 15;
  text(input.company.siret ? `SIRET ${input.company.siret}` : input.company.siren ? `SIREN ${input.company.siren}` : "", margin);
  y -= 15;
  text([input.company.email, input.company.phone].filter(Boolean).join(" - "), margin);

  const clientX = 340;
  y += 45;
  text("Client", clientX, 12, true);
  y -= 15;
  text(input.client.companyName || input.client.name, clientX, 10, true);
  y -= 15;
  text(`${input.client.billingAddress}`, clientX);
  y -= 15;
  text(`${input.client.billingPostalCode} ${input.client.billingCity}`, clientX);
  y -= 35;

  text(`Date d'émission : ${formatShortFrenchDate(input.quote.issueDate)}`, margin);
  text(`Validité : ${formatShortFrenchDate(input.quote.validUntil)}`, 300);
  y -= 18;
  text(`Chantier : ${input.quote.workSiteAddress}, ${input.quote.workSitePostalCode} ${input.quote.workSiteCity}`, margin);
  y -= 16;
  if (input.quote.estimatedStartDate) {
    text(`Début estimé : ${formatFrenchDate(input.quote.estimatedStartDate)}`, margin);
    y -= 16;
  }
  if (input.quote.estimatedDurationText) {
    text(`Durée estimée : ${input.quote.estimatedDurationText}`, margin);
    y -= 16;
  }
  y -= 30;

  page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 22, color: rgb(0.12, 0.23, 0.34) });
  text("Description", margin + 8, 9, true, rgb(1, 1, 1));
  text("Qté", 315, 9, true, rgb(1, 1, 1));
  text("PU HT", 370, 9, true, rgb(1, 1, 1));
  text("TVA", 435, 9, true, rgb(1, 1, 1));
  text("Total HT", 480, 9, true, rgb(1, 1, 1));
  y -= 26;

  for (const line of input.lines) {
    newPageIfNeeded(52);
    const labelLines = wrap(line.title, 48);
    const descriptionLines = line.description ? wrap(line.description, 48).slice(0, 3) : [];
    const rowStart = y;
    text(labelLines[0] ?? "", margin + 8, 9, true);
    for (const extra of labelLines.slice(1)) {
      y -= 12;
      text(extra, margin + 8, 9);
    }
    for (const description of descriptionLines) {
      y -= 11;
      text(description, margin + 8, 8, false, rgb(0.39, 0.45, 0.52));
    }
    y = rowStart;
    text(line.quantity.toLocaleString("fr-FR"), 315, 9);
    text(formatMoney(line.unitPriceHtCents), 370, 9);
    text(franchise ? "0 %" : `${line.vatRate.toLocaleString("fr-FR")} %`, 435, 9);
    text(formatMoney(line.totalHtCents), 480, 9, true);
    y -= Math.max(24, (labelLines.length + descriptionLines.length) * 12 + 8);
    page.drawLine({ start: { x: margin, y: y + 8 }, end: { x: pageWidth - margin, y: y + 8 }, thickness: 0.5, color: rgb(0.86, 0.9, 0.94) });
  }

  y -= 12;
  newPageIfNeeded(130);
  const totalsX = 360;
  text("Total HT", totalsX, 11, true);
  text(formatMoney(input.quote.subtotalHtCents), 475, 11, true);
  y -= 18;
  text("TVA", totalsX, 11, true);
  text(formatMoney(franchise ? 0 : input.quote.totalVatCents), 475, 11, true);
  y -= 18;
  text("Total TTC", totalsX, 14, true, rgb(0.12, 0.23, 0.34));
  text(formatMoney(totalTtc), 460, 14, true, rgb(0.12, 0.23, 0.34));
  y -= 22;
  if (depositAmount > 0) {
    text("Acompte", totalsX, 10, true);
    text(formatMoney(depositAmount), 475, 10, true);
    y -= 16;
    text("Reste à payer", totalsX, 10, true);
    text(formatMoney(remainingAmount), 475, 10, true);
    y -= 18;
  }
  y -= 16;

  if (franchise) {
    text("TVA non applicable, art. 293 B du CGI", margin, 10, true, rgb(0.7, 0.32, 0.03));
    y -= 20;
  }

  const quoteFeeText = input.quote.isQuotePaid
    ? `Devis payant${input.quote.quoteFeeCents ? ` - frais ${formatMoney(input.quote.quoteFeeCents)}` : ""}`
    : "Devis gratuit";
  text(quoteFeeText, margin, 10, true);
  y -= 18;

  for (const line of wrap(`Conditions de paiement : ${input.quote.paymentTerms}`, 90)) {
    newPageIfNeeded(16);
    text(line, margin);
    y -= 14;
  }

  y -= 8;
  const insuranceText =
    input.company.insuranceProvider || input.company.insurancePolicyNumber || input.company.decennaleMention
      ? [
          input.company.insuranceProvider ? `Assureur : ${input.company.insuranceProvider}` : "",
          input.company.insurancePolicyNumber ? `Police : ${input.company.insurancePolicyNumber}` : "",
          input.company.decennaleMention ?? "",
        ]
          .filter(Boolean)
          .join(" - ")
      : "Assurance / décennale : information non renseignée dans ChantierDevis, à vérifier selon l'activité.";
  for (const line of wrap(insuranceText, 90)) {
    newPageIfNeeded(16);
    text(line, margin, 9, false, rgb(0.39, 0.45, 0.52));
    y -= 13;
  }

  y -= 18;
  newPageIfNeeded(120);
  page.drawRectangle({ x: margin, y: y - 90, width: 220, height: 90, borderColor: rgb(0.6, 0.66, 0.73), borderWidth: 1 });
  page.drawRectangle({ x: 325, y: y - 90, width: 220, height: 90, borderColor: rgb(0.6, 0.66, 0.73), borderWidth: 1 });
  text("Pour l'entreprise", margin + 12, 10, true);
  text("Bon pour accord - Date et signature client", 337, 10, true);
  y -= 116;

  for (const line of wrap("ChantierDevis est un outil d'aide à la création de devis. Il ne remplace pas un conseil juridique personnalisé. L'utilisateur reste responsable de vérifier la conformité finale du document avant envoi et signature.", 120)) {
    newPageIfNeeded(12);
    text(line, margin, 8, false, rgb(0.39, 0.45, 0.52));
    y -= 10;
  }

  return pdf.save();
}
