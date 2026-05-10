import { NextResponse } from "next/server";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { getInvoiceDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invoice, company } = await getInvoiceDetail(id);

  if (!invoice) {
    return new NextResponse("Facture introuvable", { status: 404 });
  }

  const clientName = invoice.client.companyName || invoice.client.name;
  const companyAddress = company
    ? `${company.address}, ${company.postalCode} ${company.city}`
    : "Profil entreprise à compléter";
  const vatMode = company?.vatMode ?? "STANDARD";
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(invoice.invoiceNumber)} - ${escapeHtml(clientName)}</title>
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
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 12px;
      background: #1f3b57;
      color: white;
    }
    .toolbar button, .toolbar a {
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 8px;
      padding: 8px 12px;
      background: white;
      color: #1f3b57;
      cursor: pointer;
      font-weight: 700;
      text-decoration: none;
    }
    .document {
      width: min(980px, 100%);
      margin: 0 auto;
      background: #fffdf8;
      padding: 40px;
      min-height: 100vh;
    }
    .top {
      display: grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 32px;
      border-bottom: 3px solid #1f3b57;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 { color: #1f3b57; font-size: 32px; margin-bottom: 8px; }
    h2 { color: #1f3b57; font-size: 18px; margin-bottom: 10px; }
    .muted { color: #5f6f7c; }
    .meta, .box {
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
    footer {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #d7dee4;
      color: #5f6f7c;
      font-size: 12px;
    }
    @media (max-width: 720px) {
      .document { padding: 24px; }
      .top, .grid { grid-template-columns: 1fr; }
      table { min-width: 720px; }
      .table-scroll { overflow-x: auto; }
    }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .document { padding: 18mm; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar" aria-label="Actions facture">
    <button type="button" onclick="window.print()">Imprimer</button>
    <a href="/app/invoices/${escapeHtml(invoice.id)}">Retour facture</a>
  </div>
  <article class="document">
    <section class="top">
      <div>
        <h1>Facture ${escapeHtml(invoice.invoiceNumber)}</h1>
        <p class="muted">Issue du devis ${escapeHtml(invoice.quote.quoteNumber)}</p>
      </div>
      <div class="meta">
        <p><strong>Date d'émission :</strong> ${formatShortFrenchDate(invoice.issueDate)}</p>
        <p><strong>Échéance :</strong> ${formatShortFrenchDate(invoice.dueDate)}</p>
        <p><strong>Statut :</strong> ${escapeHtml(invoice.status)}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <h2>Entreprise</h2>
        <p><strong>${escapeHtml(company?.companyName ?? "Profil entreprise")}</strong>${company?.legalForm ? ` - ${escapeHtml(company.legalForm)}` : ""}</p>
        <p>${escapeHtml(companyAddress)}</p>
        ${company?.siret ? `<p>SIRET : ${escapeHtml(company.siret)}</p>` : company?.siren ? `<p>SIREN : ${escapeHtml(company.siren)}</p>` : ""}
        ${company?.vatNumber && vatMode === "STANDARD" ? `<p>TVA intracom. : ${escapeHtml(company.vatNumber)}</p>` : ""}
        ${company?.email ? `<p>Email : ${escapeHtml(company.email)}</p>` : ""}
        ${company?.phone ? `<p>Tél. : ${escapeHtml(company.phone)}</p>` : ""}
      </div>
      <div class="box">
        <h2>Client</h2>
        <p><strong>${escapeHtml(clientName)}</strong></p>
        <p>${escapeHtml(invoice.client.billingAddress)}, ${escapeHtml(invoice.client.billingPostalCode)} ${escapeHtml(invoice.client.billingCity)}</p>
        ${invoice.client.email ? `<p>Email : ${escapeHtml(invoice.client.email)}</p>` : ""}
        ${invoice.client.phone ? `<p>Tél. : ${escapeHtml(invoice.client.phone)}</p>` : ""}
      </div>
    </section>

    <div class="table-scroll">
      <table aria-label="Détail de la facture">
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
          ${invoice.lines
            .map(
              (line) => `<tr>
                <td><strong>${escapeHtml(line.title)}</strong>${line.description ? `<br /><span class="muted">${paragraph(line.description)}</span>` : ""}</td>
                <td class="number">${Number(line.quantity).toLocaleString("fr-FR")}</td>
                <td>${escapeHtml(line.unit)}</td>
                <td class="number">${formatMoney(line.unitPriceHtCents)}</td>
                <td class="number">${vatMode === "FRANCHISE_BASE" ? "0 %" : `${Number(line.vatRate).toLocaleString("fr-FR")} %`}</td>
                <td class="number"><strong>${formatMoney(line.totalHtCents)}</strong></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>

    ${vatMode === "FRANCHISE_BASE" ? `<p class="muted"><strong>TVA non applicable, art. 293 B du CGI</strong></p>` : ""}

    <section class="totals" aria-label="Totaux facture">
      <div><span>Total HT</span><strong>${formatMoney(invoice.subtotalHtCents)}</strong></div>
      <div><span>Total TVA</span><strong>${formatMoney(invoice.totalVatCents)}</strong></div>
      <div><span>Total TTC</span><strong>${formatMoney(invoice.totalTtcCents)}</strong></div>
    </section>

    <section class="box" style="margin-top: 24px;">
      <h2>Conditions de paiement</h2>
      <p>${paragraph(invoice.paymentTerms)}</p>
      ${invoice.notesToClient ? `<p>${paragraph(invoice.notesToClient)}</p>` : ""}
    </section>

    <footer>
      <p>Facture générée par ChantierDevis. Source : devis ${escapeHtml(invoice.quote.quoteNumber)}.</p>
      <p>Ce document reprend les données saisies par l'utilisateur. ChantierDevis ne remplace pas un expert-comptable, un avocat ou un conseil juridique personnalisé.</p>
    </footer>
  </article>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}
