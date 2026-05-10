import { PrismaClient, Prisma } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

const userEmail = "demo@chantierdevis.fr";
const demoPassword = "Demo-chantier-2026!";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function calcLine(line) {
  if (line.type === "SECTION") {
    return { ...line, quantity: 0, unitPriceHtCents: 0, unitCostCents: null, vatRate: 0, totalHtCents: 0, totalVatCents: 0, totalTtcCents: 0, totalCostCents: null };
  }
  const totalHtCents = Math.round(line.quantity * line.unitPriceHtCents) * (line.type === "DISCOUNT" ? -1 : 1);
  const totalVatCents = Math.round(totalHtCents * (line.vatRate / 100));
  const totalCostCents = line.unitCostCents === null || line.unitCostCents === undefined || line.type === "DISCOUNT" ? null : Math.round(line.quantity * line.unitCostCents);
  return {
    ...line,
    totalHtCents,
    totalVatCents,
    totalTtcCents: totalHtCents + totalVatCents,
    totalCostCents,
  };
}

function totals(lines) {
  const calculated = lines.map(calcLine);
  const subtotalHtCents = calculated.reduce((sum, line) => sum + line.totalHtCents, 0);
  const totalVatCents = calculated.reduce((sum, line) => sum + line.totalVatCents, 0);
  const totalTtcCents = subtotalHtCents + totalVatCents;
  const totalCostCents = calculated.reduce((sum, line) => sum + (line.totalCostCents ?? 0), 0);
  const grossMarginCents = subtotalHtCents - totalCostCents;
  const grossMarginRate = subtotalHtCents > 0 ? Math.round((grossMarginCents / subtotalHtCents) * 10000) / 100 : 0;
  return { calculated, subtotalHtCents, totalVatCents, totalTtcCents, totalCostCents, grossMarginCents, grossMarginRate };
}

function documentHtml(quote, client, company) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${quote.quoteNumber}</title>
  <style>
    body { margin: 0; background: #f6f2ea; color: #1f2933; font-family: Arial, sans-serif; }
    article { max-width: 900px; margin: 0 auto; background: #fffdf8; padding: 40px; }
    h1 { color: #1f3b57; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #1f3b57; color: white; text-align: left; padding: 10px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 10px; }
    .right { text-align: right; }
    .signature { margin-top: 32px; border: 1px solid #cbd5e1; min-height: 120px; padding: 16px; }
  </style>
</head>
<body>
  <article>
    <h1>Devis ${quote.quoteNumber}</h1>
    <p><strong>${company.companyName}</strong> - ${company.address}, ${company.postalCode} ${company.city}</p>
    <p>Client : <strong>${client.companyName || client.name}</strong> - ${client.billingAddress}, ${client.billingPostalCode} ${client.billingCity}</p>
    <h2>${quote.title}</h2>
    <table>
      <thead><tr><th>Description</th><th class="right">Total HT</th></tr></thead>
      <tbody>${quote.lines.map((line) => `<tr><td>${line.title}</td><td class="right">${(line.totalHtCents / 100).toFixed(2)} €</td></tr>`).join("")}</tbody>
    </table>
    <p class="right"><strong>Total TTC : ${(quote.totalTtcCents / 100).toFixed(2)} €</strong></p>
    <p>Conditions de paiement : ${quote.paymentTerms}</p>
    <div class="signature">Bon pour accord<br />Date :<br />Signature :</div>
    <p>ChantierDevis est un outil d'aide à la création de devis. Il ne remplace pas un expert-comptable, un avocat, une fédération professionnelle ou un conseil juridique personnalisé.</p>
  </article>
</body>
</html>`;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      name: "Artisan démonstration",
      passwordHash: hashPassword(demoPassword),
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    create: {
      email: userEmail,
      name: "Artisan démonstration",
      passwordHash: hashPassword(demoPassword),
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.appSession.deleteMany({ where: { userId: user.id } });
  await prisma.auditLog.deleteMany({ where: { userId: user.id } });
  await prisma.dataRequest.deleteMany({ where: { userId: user.id } });
  await prisma.emailDelivery.deleteMany({ where: { userId: user.id } });
  await prisma.invoiceLine.deleteMany({ where: { invoice: { userId: user.id } } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.generatedQuoteDocument.deleteMany({ where: { quote: { userId: user.id } } });
  await prisma.followUpReminder.deleteMany({ where: { quote: { userId: user.id } } });
  await prisma.quoteEvent.deleteMany({ where: { quote: { userId: user.id } } });
  await prisma.quoteLine.deleteMany({ where: { quote: { userId: user.id } } });
  await prisma.quote.deleteMany({ where: { userId: user.id } });
  await prisma.workItem.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });
  await prisma.companyProfile.deleteMany({ where: { userId: user.id } });

  const company = await prisma.companyProfile.create({
    data: {
      userId: user.id,
      companyName: "Martin Rénovation",
      legalForm: "Entreprise individuelle",
      ownerName: "Julien Martin",
      siret: "81234567800019",
      siren: "812345678",
      vatNumber: "FR17812345678",
      vatMode: "STANDARD",
      address: "18 rue des Compagnons",
      postalCode: "44000",
      city: "Nantes",
      phone: "02 40 00 00 00",
      email: "contact@martin-renovation.fr",
      website: "https://martin-renovation.fr",
      insuranceProvider: "MAAF Pro",
      insurancePolicyNumber: "DEC-2026-445812",
      decennaleMention: "Assurance responsabilité décennale souscrite pour les activités déclarées.",
      defaultPaymentTerms: "Acompte de 30% à la signature du devis, solde à réception des travaux.",
      defaultQuoteValidityDays: 30,
      defaultDepositPercent: new Prisma.Decimal(30),
      defaultSignature: "Julien Martin, Martin Rénovation",
      documentFooterText: "Prix valables hors découvertes non visibles avant travaux. Devis gratuit.",
    },
  });

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        type: "INDIVIDUAL",
        name: "Claire Dubois",
        email: "claire.dubois@example.fr",
        phone: "06 12 34 56 78",
        billingAddress: "7 rue du Port",
        billingPostalCode: "44000",
        billingCity: "Nantes",
        defaultWorkSiteAddress: "7 rue du Port",
        defaultWorkSitePostalCode: "44000",
        defaultWorkSiteCity: "Nantes",
        notes: "Préférence contact email.",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        type: "PROFESSIONAL",
        name: "Nora Petit",
        companyName: "SCI Les Tilleuls",
        email: "gestion@lestilleuls.example",
        phone: "02 51 00 00 00",
        billingAddress: "12 avenue de Bretagne",
        billingPostalCode: "44800",
        billingCity: "Saint-Herblain",
        defaultWorkSiteAddress: "3 impasse des Tilleuls",
        defaultWorkSitePostalCode: "44800",
        defaultWorkSiteCity: "Saint-Herblain",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        type: "INDIVIDUAL",
        name: "Marc Lefèvre",
        email: "marc.lefevre@example.fr",
        phone: "06 98 76 54 32",
        billingAddress: "22 rue des Oliviers",
        billingPostalCode: "44400",
        billingCity: "Rezé",
        defaultWorkSiteAddress: "22 rue des Oliviers",
        defaultWorkSitePostalCode: "44400",
        defaultWorkSiteCity: "Rezé",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        type: "PROFESSIONAL",
        name: "Hugo Bernard",
        companyName: "Atelier Loire",
        email: "hugo@atelierloire.example",
        phone: "02 28 00 00 00",
        billingAddress: "5 quai Magellan",
        billingPostalCode: "44000",
        billingCity: "Nantes",
        defaultWorkSiteAddress: "5 quai Magellan",
        defaultWorkSitePostalCode: "44000",
        defaultWorkSiteCity: "Nantes",
      },
    }),
  ]);

  const itemData = [
    ["Pose WC suspendu", "Fourniture et pose d'un bâti-support, cuvette suspendue et habillage prêt à peindre.", "PLUMBING", "UNIT", 78000, 43000, 10, 5],
    ["Remplacement ballon d'eau chaude", "Dépose de l'ancien ballon, pose chauffe-eau électrique et raccordements.", "PLUMBING", "UNIT", 89000, 52000, 10, 4],
    ["Dépose ancienne installation", "Dépose, évacuation et mise en sécurité de l'installation existante.", "GENERAL_RENOVATION", "PACKAGE", 42000, 15000, 10, 3],
    ["Déplacement forfaitaire", "Déplacement et préparation de chantier dans l'agglomération.", "GENERAL_RENOVATION", "PACKAGE", 6500, 2500, 20, null],
    ["Main-d'œuvre horaire", "Main-d'œuvre qualifiée artisan rénovation.", "GENERAL_RENOVATION", "HOUR", 6200, 3100, 20, 1],
    ["Mise en peinture mur m²", "Préparation légère, impression et deux couches de peinture finition velours.", "PAINTING", "M2", 3200, 1400, 10, 0.45],
    ["Préparation support peinture", "Rebouchage, ponçage et protection des zones adjacentes.", "PAINTING", "M2", 1200, 550, 10, 0.2],
    ["Pose carrelage m²", "Pose collée de carrelage format standard, joints inclus.", "TILING", "M2", 6800, 3100, 10, 0.8],
    ["Fourniture carrelage standard m²", "Carrelage grès cérame milieu de gamme.", "TILING", "M2", 4200, 2900, 20, null],
    ["Ragréage sol m²", "Préparation et ragréage autolissant avant pose de revêtement.", "TILING", "M2", 2400, 1200, 10, 0.3],
    ["Isolation doublage m²", "Pose d'un doublage isolant intérieur avec plaque de plâtre.", "INSULATION", "M2", 7600, 3800, 5.5, 0.9],
    ["Habillage menuiserie", "Ajustement et finition autour d'une menuiserie intérieure.", "CARPENTRY", "UNIT", 18000, 7200, 10, 2],
  ];

  const workItems = await Promise.all(
    itemData.map(([title, description, trade, unit, price, cost, vat, hours]) =>
      prisma.workItem.create({
        data: {
          userId: user.id,
          title,
          description,
          trade,
          unit,
          defaultUnitPriceCents: price,
          defaultCostCents: cost,
          defaultVatRate: new Prisma.Decimal(vat),
          defaultLaborHours: hours === null ? null : new Prisma.Decimal(hours),
        },
      }),
    ),
  );

  async function createQuote({ number, client, status, trade, title, issueDate, validUntil, lines, complianceStatus, followUp }) {
    const computed = totals(lines);
    const quote = await prisma.quote.create({
      data: {
        userId: user.id,
        clientId: client.id,
        quoteNumber: number,
        status,
        trade,
        title,
        projectDescription: "Chiffrage détaillé des prestations prévues avec fournitures, main-d'œuvre et évacuation si nécessaire.",
        workSiteAddress: client.defaultWorkSiteAddress || client.billingAddress,
        workSitePostalCode: client.defaultWorkSitePostalCode || client.billingPostalCode,
        workSiteCity: client.defaultWorkSiteCity || client.billingCity,
        issueDate,
        validUntil,
        estimatedStartDate: new Date("2026-05-20"),
        estimatedDurationText: "5 à 7 jours ouvrés",
        paymentTerms: company.defaultPaymentTerms,
        depositPercent: new Prisma.Decimal(30),
        depositAmountCents: Math.round(computed.totalTtcCents * 0.3),
        notesToClient: "Sous réserve de disponibilité des fournitures au moment de l'acceptation.",
        internalNotes: "Prévoir protection des accès et stationnement.",
        subtotalHtCents: computed.subtotalHtCents,
        totalVatCents: computed.totalVatCents,
        totalTtcCents: computed.totalTtcCents,
        totalCostCents: computed.totalCostCents,
        grossMarginCents: computed.grossMarginCents,
        grossMarginRate: new Prisma.Decimal(computed.grossMarginRate),
        complianceStatus,
        lines: {
          create: computed.calculated.map((line, position) => ({
            workItemId: line.workItemId,
            position,
            type: line.type,
            title: line.title,
            description: line.description,
            quantity: new Prisma.Decimal(line.quantity),
            unit: line.unit,
            unitPriceHtCents: line.unitPriceHtCents,
            unitCostCents: line.unitCostCents,
            vatRate: new Prisma.Decimal(line.vatRate),
            totalHtCents: line.totalHtCents,
            totalVatCents: line.totalVatCents,
            totalTtcCents: line.totalTtcCents,
            totalCostCents: line.totalCostCents,
          })),
        },
        events: {
          create: [
            { type: "CREATED", title: "Devis créé", eventDate: issueDate },
            ...(status === "SENT" ? [{ type: "SENT", title: "Devis envoyé au client", eventDate: new Date("2026-04-17") }] : []),
            ...(status === "ACCEPTED" ? [{ type: "ACCEPTED", title: "Devis accepté", eventDate: new Date("2026-04-23") }] : []),
            ...(status === "EXPIRED" ? [{ type: "EXPIRED", title: "Devis expiré", eventDate: new Date("2026-04-25") }] : []),
          ],
        },
      },
      include: { lines: true },
    });

    if (followUp) {
      await prisma.followUpReminder.create({
        data: {
          quoteId: quote.id,
          dueDate: followUp,
          status: "PENDING",
          note: "Relancer le client pour obtenir un retour sur le devis.",
        },
      });
    }
    return quote;
  }

  const quoteLinesA = [
    { workItemId: workItems[2].id, type: "SERVICE", title: "Dépose ancienne installation", description: workItems[2].description, quantity: 1, unit: "PACKAGE", unitPriceHtCents: 42000, unitCostCents: 15000, vatRate: 10 },
  ];
  await createQuote({
    number: "DEV-2026-0001",
    client: clients[0],
    status: "DRAFT",
    trade: "PLUMBING",
    title: "Rénovation salle d'eau - brouillon",
    issueDate: new Date("2026-04-05"),
    validUntil: new Date("2026-05-05"),
    lines: quoteLinesA,
    complianceStatus: "INCOMPLETE",
  });

  await createQuote({
    number: "DEV-2026-0002",
    client: clients[1],
    status: "READY",
    trade: "PAINTING",
    title: "Rafraîchissement appartement T2",
    issueDate: new Date("2026-04-10"),
    validUntil: new Date("2026-05-10"),
    lines: [
      { workItemId: workItems[6].id, type: "SERVICE", title: "Préparation support peinture", description: workItems[6].description, quantity: 54, unit: "M2", unitPriceHtCents: 1200, unitCostCents: 550, vatRate: 10 },
      { workItemId: workItems[5].id, type: "SERVICE", title: "Mise en peinture mur m²", description: workItems[5].description, quantity: 54, unit: "M2", unitPriceHtCents: 3200, unitCostCents: 1400, vatRate: 10 },
      { workItemId: workItems[3].id, type: "TRAVEL", title: "Déplacement forfaitaire", description: workItems[3].description, quantity: 1, unit: "PACKAGE", unitPriceHtCents: 6500, unitCostCents: 2500, vatRate: 20 },
    ],
    complianceStatus: "READY",
  });

  await createQuote({
    number: "DEV-2026-0003",
    client: clients[2],
    status: "SENT",
    trade: "TILING",
    title: "Pose carrelage cuisine",
    issueDate: new Date("2026-04-12"),
    validUntil: new Date("2026-05-12"),
    followUp: new Date("2026-04-22"),
    lines: [
      { workItemId: workItems[9].id, type: "SERVICE", title: "Ragréage sol m²", description: workItems[9].description, quantity: 18, unit: "M2", unitPriceHtCents: 2400, unitCostCents: 1200, vatRate: 10 },
      { workItemId: workItems[8].id, type: "MATERIAL", title: "Fourniture carrelage standard m²", description: workItems[8].description, quantity: 20, unit: "M2", unitPriceHtCents: 4200, unitCostCents: 2900, vatRate: 20 },
      { workItemId: workItems[7].id, type: "SERVICE", title: "Pose carrelage m²", description: workItems[7].description, quantity: 18, unit: "M2", unitPriceHtCents: 6800, unitCostCents: 3100, vatRate: 10 },
    ],
    complianceStatus: "READY",
  });

  const accepted = await createQuote({
    number: "DEV-2026-0004",
    client: clients[3],
    status: "ACCEPTED",
    trade: "GENERAL_RENOVATION",
    title: "Rénovation local atelier",
    issueDate: new Date("2026-04-15"),
    validUntil: new Date("2026-05-15"),
    lines: [
      { workItemId: workItems[2].id, type: "SERVICE", title: "Dépose ancienne installation", description: workItems[2].description, quantity: 1, unit: "PACKAGE", unitPriceHtCents: 42000, unitCostCents: 15000, vatRate: 10 },
      { workItemId: workItems[10].id, type: "SERVICE", title: "Isolation doublage m²", description: workItems[10].description, quantity: 32, unit: "M2", unitPriceHtCents: 7600, unitCostCents: 3800, vatRate: 5.5 },
      { workItemId: workItems[11].id, type: "SERVICE", title: "Habillage menuiserie", description: workItems[11].description, quantity: 4, unit: "UNIT", unitPriceHtCents: 18000, unitCostCents: 7200, vatRate: 10 },
    ],
    complianceStatus: "READY",
  });

  await createQuote({
    number: "DEV-2026-0005",
    client: clients[0],
    status: "EXPIRED",
    trade: "PLUMBING",
    title: "Remplacement ballon d'eau chaude",
    issueDate: new Date("2026-03-05"),
    validUntil: new Date("2026-04-04"),
    lines: [
      { workItemId: workItems[1].id, type: "SERVICE", title: "Remplacement ballon d'eau chaude", description: workItems[1].description, quantity: 1, unit: "UNIT", unitPriceHtCents: 89000, unitCostCents: 52000, vatRate: 10 },
      { workItemId: workItems[3].id, type: "TRAVEL", title: "Déplacement forfaitaire", description: workItems[3].description, quantity: 1, unit: "PACKAGE", unitPriceHtCents: 6500, unitCostCents: 2500, vatRate: 20 },
    ],
    complianceStatus: "READY",
  });

  const acceptedFull = await prisma.quote.findUnique({
    where: { id: accepted.id },
    include: { lines: true, client: true },
  });

  if (acceptedFull) {
    await prisma.generatedQuoteDocument.create({
      data: {
        quoteId: acceptedFull.id,
        type: "PRINTABLE_HTML",
        title: `${acceptedFull.quoteNumber} - ${acceptedFull.title}`,
        contentHtml: documentHtml(acceptedFull, acceptedFull.client, company),
        contentText: `Devis ${acceptedFull.quoteNumber}\nTotal TTC ${(acceptedFull.totalTtcCents / 100).toFixed(2)} EUR`,
      },
    });
  }

  console.log("Seed ChantierDevis terminé.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
