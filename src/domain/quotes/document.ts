import {
  calculateDeposit,
  formatFrenchDate,
  formatMoney,
  formatShortFrenchDate,
} from ".";
import type {
  CalculatedQuoteLine,
  ClientForCompliance,
  CompanyForCompliance,
  ComplianceResult,
} from "./types";

type QuoteDocumentInput = {
  company: CompanyForCompliance & {
    legalForm?: string | null;
    ownerName?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    defaultSignature?: string | null;
    documentFooterText?: string | null;
  };
  client: ClientForCompliance & {
    email?: string | null;
    phone?: string | null;
  };
  quote: {
    quoteNumber: string;
    title: string;
    projectDescription?: string | null;
    workSiteAddress: string;
    workSitePostalCode: string;
    workSiteCity: string;
    issueDate: Date | string;
    validUntil: Date | string;
    estimatedStartDate?: Date | string | null;
    estimatedDurationText?: string | null;
    isQuotePaid?: boolean;
    quoteFeeCents?: number | null;
    paymentTerms: string;
    depositPercent?: number | null;
    depositAmountCents?: number | null;
    notesToClient?: string | null;
    subtotalHtCents: number;
    totalVatCents: number;
    totalTtcCents: number;
  };
  lines: CalculatedQuoteLine[];
  compliance: ComplianceResult;
  currentDate: Date | string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraph(value?: string | null) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function vatByRate(lines: CalculatedQuoteLine[]) {
  return lines.reduce<Record<string, number>>((acc, line) => {
    const key = `${line.vatRate}`;
    acc[key] = (acc[key] ?? 0) + line.totalVatCents;
    return acc;
  }, {});
}

export function generateQuoteDocumentHtml(input: QuoteDocumentInput) {
  const { company, client, quote, lines, compliance } = input;
  const vatRows = vatByRate(lines);
  const depositAmount =
    quote.depositAmountCents ?? calculateDeposit(quote.totalTtcCents, quote.depositPercent);
  const franchise = company.vatMode === "FRANCHISE_BASE";
  const totalTtc = franchise ? quote.subtotalHtCents : quote.totalTtcCents;
  const remainingAmount = Math.max(0, totalTtc - Math.max(0, depositAmount));
  const companyAddress = `${company.address ?? ""}, ${company.postalCode ?? ""} ${company.city ?? ""}`;
  const clientName = client.companyName || client.name;

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(quote.quoteNumber)} - ${escapeHtml(quote.title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f5f2ec;
      color: #1f2933;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    .document {
      width: min(980px, 100%);
      margin: 0 auto;
      background: #fffdf8;
      padding: 40px;
    }
    .top {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 32px;
      border-bottom: 3px solid #1f3b57;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 { color: #1f3b57; font-size: 30px; margin-bottom: 8px; }
    h2 { color: #1f3b57; font-size: 18px; margin-bottom: 10px; }
    h3 { color: #1f3b57; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; }
    .muted { color: #5f6f7c; }
    .meta {
      border: 1px solid #d7dee4;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .box {
      border: 1px solid #d7dee4;
      padding: 16px;
      border-radius: 8px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      font-size: 13px;
    }
    th {
      background: #1f3b57;
      color: white;
      text-align: left;
      padding: 10px;
    }
    td {
      border-bottom: 1px solid #e2e8f0;
      padding: 10px;
      vertical-align: top;
    }
    .number { text-align: right; white-space: nowrap; }
    .totals {
      margin-left: auto;
      width: min(380px, 100%);
      border: 1px solid #d7dee4;
      border-radius: 8px;
      overflow: hidden;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .totals div:last-child {
      border-bottom: 0;
      background: #1f3b57;
      color: white;
      font-size: 18px;
      font-weight: 700;
    }
    .notice {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f97316;
      padding: 12px 14px;
      border-radius: 8px;
      margin: 18px 0;
    }
    .signature {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 34px;
    }
    .signature-box {
      min-height: 150px;
      border: 1px solid #aab7c2;
      border-radius: 8px;
      padding: 16px;
    }
    footer {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #d7dee4;
      color: #5f6f7c;
      font-size: 12px;
    }
    @media print {
      body { background: white; }
      .document { padding: 20mm; width: 100%; }
    }
  </style>
</head>
<body>
  <article class="document">
    <section class="top">
      <div>
        <h1>Devis ${escapeHtml(quote.quoteNumber)}</h1>
        <p class="muted">${escapeHtml(quote.title)}</p>
        <p>${paragraph(quote.projectDescription)}</p>
      </div>
      <div class="meta">
        <p><strong>Date d'émission :</strong> ${formatShortFrenchDate(quote.issueDate)}</p>
        <p><strong>Valable jusqu'au :</strong> ${formatShortFrenchDate(quote.validUntil)}</p>
        <p><strong>Document généré le :</strong> ${formatShortFrenchDate(input.currentDate)}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <h2>Entreprise</h2>
        <p><strong>${escapeHtml(company.companyName)}</strong>${company.legalForm ? ` - ${escapeHtml(company.legalForm)}` : ""}</p>
        <p>${escapeHtml(companyAddress)}</p>
        ${company.ownerName ? `<p>Responsable : ${escapeHtml(company.ownerName)}</p>` : ""}
        ${company.siret ? `<p>SIRET : ${escapeHtml(company.siret)}</p>` : company.siren ? `<p>SIREN : ${escapeHtml(company.siren)}</p>` : ""}
        ${company.vatNumber && !franchise ? `<p>TVA intracom. : ${escapeHtml(company.vatNumber)}</p>` : ""}
        ${company.phone ? `<p>Tél. : ${escapeHtml(company.phone)}</p>` : ""}
        ${company.email ? `<p>Email : ${escapeHtml(company.email)}</p>` : ""}
      </div>
      <div class="box">
        <h2>Client</h2>
        <p><strong>${escapeHtml(clientName)}</strong></p>
        <p>${escapeHtml(client.billingAddress)}, ${escapeHtml(client.billingPostalCode)} ${escapeHtml(client.billingCity)}</p>
        ${client.email ? `<p>Email : ${escapeHtml(client.email)}</p>` : ""}
        ${client.phone ? `<p>Tél. : ${escapeHtml(client.phone)}</p>` : ""}
      </div>
    </section>

    <section class="box">
      <h2>Lieu d'exécution</h2>
      <p>${escapeHtml(quote.workSiteAddress)}, ${escapeHtml(quote.workSitePostalCode)} ${escapeHtml(quote.workSiteCity)}</p>
      ${quote.estimatedStartDate ? `<p><strong>Début estimé :</strong> ${formatFrenchDate(quote.estimatedStartDate)}</p>` : ""}
      ${quote.estimatedDurationText ? `<p><strong>Durée estimée :</strong> ${escapeHtml(quote.estimatedDurationText)}</p>` : ""}
    </section>

    <table aria-label="Détail du devis">
      <thead>
        <tr>
          <th>Description</th>
          <th class="number">Qté</th>
          <th>Unité</th>
          <th class="number">PU HT</th>
          <th class="number">TVA</th>
          <th class="number">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${lines
          .map((line) =>
            line.type === "SECTION"
              ? `<tr><td colspan="6"><strong>${escapeHtml(line.title)}</strong></td></tr>`
              : `<tr>
                  <td><strong>${escapeHtml(line.title)}</strong>${line.description ? `<br /><span class="muted">${paragraph(line.description)}</span>` : ""}</td>
                  <td class="number">${line.quantity.toLocaleString("fr-FR")}</td>
                  <td>${escapeHtml(line.unit)}</td>
                  <td class="number">${formatMoney(line.unitPriceHtCents)}</td>
                  <td class="number">${franchise ? "0 %" : `${line.vatRate.toLocaleString("fr-FR")} %`}</td>
                  <td class="number">${formatMoney(line.totalHtCents)}</td>
                </tr>`,
          )
          .join("")}
      </tbody>
    </table>

    ${franchise ? `<div class="notice">TVA non applicable, art. 293 B du CGI.</div>` : ""}

    <section class="totals" aria-label="Totaux du devis">
      <div><span>Total HT</span><strong>${formatMoney(quote.subtotalHtCents)}</strong></div>
      ${Object.entries(vatRows)
        .map(([rate, amount]) => `<div><span>TVA ${franchise ? "0" : escapeHtml(rate)} %</span><strong>${formatMoney(franchise ? 0 : amount)}</strong></div>`)
        .join("")}
      <div><span>Total TVA</span><strong>${formatMoney(franchise ? 0 : quote.totalVatCents)}</strong></div>
      <div><span>Total TTC</span><strong>${formatMoney(totalTtc)}</strong></div>
    </section>

    ${
      depositAmount > 0
        ? `<p><strong>Acompte demandé :</strong> ${formatMoney(depositAmount)}${quote.depositPercent ? ` (${quote.depositPercent.toLocaleString("fr-FR")} %)` : ""}<br /><strong>Reste à payer :</strong> ${formatMoney(remainingAmount)}</p>`
        : ""
    }
    <p><strong>Conditions de paiement :</strong> ${paragraph(quote.paymentTerms)}</p>
    <p><strong>Devis :</strong> ${quote.isQuotePaid ? `payant${quote.quoteFeeCents ? `, frais ${formatMoney(quote.quoteFeeCents)}` : ""}` : "gratuit"}</p>

    ${
      company.decennaleMention || company.insuranceProvider || company.insurancePolicyNumber
        ? `<section class="box"><h2>Assurance</h2>
            ${company.insuranceProvider ? `<p>Assureur : ${escapeHtml(company.insuranceProvider)}</p>` : ""}
            ${company.insurancePolicyNumber ? `<p>Police : ${escapeHtml(company.insurancePolicyNumber)}</p>` : ""}
            ${company.decennaleMention ? `<p>${paragraph(company.decennaleMention)}</p>` : ""}
          </section>`
        : `<section class="notice"><strong>Assurance / décennale :</strong> information non renseignée dans ChantierDevis. À vérifier selon l'activité, le chantier et les obligations applicables.</section>`
    }

    ${quote.notesToClient ? `<section class="box"><h2>Notes</h2><p>${paragraph(quote.notesToClient)}</p></section>` : ""}

    <section class="signature">
      <div class="signature-box">
        <h3>Pour l'entreprise</h3>
        <p>${escapeHtml(company.defaultSignature || company.companyName)}</p>
      </div>
      <div class="signature-box">
        <h3>Acceptation client</h3>
        <p>Bon pour accord</p>
        <p>Date :</p>
        <p>Signature :</p>
      </div>
    </section>

    ${
      compliance.status !== "READY"
        ? `<div class="notice"><strong>Points de conformité à vérifier :</strong> ${escapeHtml([...compliance.missingFields, ...compliance.warnings].join(", "))}</div>`
        : ""
    }

    <footer>
      <p>ChantierDevis est un outil d'aide à la création de devis. Il ne remplace pas un expert-comptable, un avocat, une fédération professionnelle ou un conseil juridique personnalisé. L'utilisateur reste responsable de vérifier la conformité finale du document avant envoi et signature.</p>
      ${company.documentFooterText ? `<p>${paragraph(company.documentFooterText)}</p>` : ""}
    </footer>
  </article>
</body>
</html>`;

  const text = [
    `Devis ${quote.quoteNumber}`,
    `${company.companyName} -> ${clientName}`,
    `${quote.title}`,
    `Total HT: ${formatMoney(quote.subtotalHtCents)}`,
    `Total TVA: ${formatMoney(franchise ? 0 : quote.totalVatCents)}`,
    `Total TTC: ${formatMoney(totalTtc)}`,
    depositAmount > 0 ? `Acompte: ${formatMoney(depositAmount)}` : "",
    depositAmount > 0 ? `Reste à payer: ${formatMoney(remainingAmount)}` : "",
    franchise ? "TVA non applicable, art. 293 B du CGI" : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}
