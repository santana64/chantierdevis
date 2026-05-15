import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

function makeHtml(params: {
  clientName: string;
  companyName: string;
  quoteNumber: string;
  quoteTitle: string;
  signUrl: string | null;
  appUrl: string;
}) {
  const { clientName, companyName, quoteNumber, quoteTitle, signUrl, appUrl } = params;
  const cta = signUrl
    ? `<p style="text-align:center;margin:24px 0">
        <a href="${signUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif;font-size:15px">
          Consulter et signer le devis &rarr;
        </a>
       </p>`
    : `<p style="margin:0 0 18px">Vous pouvez nous contacter pour toute question sur ce devis.</p>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Georgia,serif;font-size:16px;color:#1a1a1a;max-width:520px;margin:0 auto;padding:32px 20px;line-height:1.8">
<p style="margin:0 0 18px">Bonjour ${clientName},</p>
<p style="margin:0 0 18px">
  Je me permets de revenir vers vous au sujet du devis <strong>${quoteNumber}</strong>
  — <em>${quoteTitle}</em>.
</p>
<p style="margin:0 0 18px">
  Avez-vous eu le temps d'en prendre connaissance ? N'hésitez pas à me poser
  vos questions, je suis disponible pour échanger.
</p>
${cta}
<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:15px">Cordialement,</p>
<p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold">${companyName}</p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
<p style="font-size:11px;color:#bbb;line-height:1.6;margin:0;font-family:Arial,sans-serif">
  Envoyé via <a href="${appUrl}" style="color:#bbb">ChantierDevis</a>
</p>
</body></html>`;
}

function makeText(params: {
  clientName: string;
  companyName: string;
  quoteNumber: string;
  quoteTitle: string;
  signUrl: string | null;
}) {
  const { clientName, companyName, quoteNumber, quoteTitle, signUrl } = params;
  return `Bonjour ${clientName},

Je me permets de revenir vers vous au sujet du devis ${quoteNumber} — ${quoteTitle}.

Avez-vous eu le temps d'en prendre connaissance ? N'hésitez pas à me poser vos questions.
${signUrl ? `\nConsulter et signer le devis : ${signUrl}\n` : ""}
Cordialement,
${companyName}`;
}

export async function GET(req: NextRequest) {
  // Vercel envoie Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chantierdevis.fr";
  const now = new Date();

  const reminders = await prisma.followUpReminder.findMany({
    where: { status: "PENDING", dueDate: { lte: now } },
    include: {
      quote: {
        include: {
          client: { select: { name: true, companyName: true } },
          user: {
            include: {
              companyProfile: { select: { companyName: true } },
            },
          },
          emailDeliveries: {
            where: { status: "SENT" },
            orderBy: { sentAt: "desc" },
            take: 1,
            select: { toEmail: true },
          },
        },
      },
    },
    take: 100,
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const reminder of reminders) {
    const { quote } = reminder;
    const toEmail = quote.emailDeliveries[0]?.toEmail;

    if (!toEmail) {
      await prisma.followUpReminder.update({
        where: { id: reminder.id },
        data: { status: "CANCELLED" },
      });
      skipped++;
      continue;
    }

    const clientName = quote.client.companyName || quote.client.name;
    const companyName = quote.user.companyProfile?.companyName ?? "Votre prestataire";
    const signUrl = quote.signatureToken
      ? `${appUrl}/sign/${quote.signatureToken}`
      : null;

    const emailParams = {
      clientName,
      companyName,
      quoteNumber: quote.quoteNumber,
      quoteTitle: quote.title,
      signUrl,
      appUrl,
    };

    const result = await sendTransactionalEmail({
      to: toEmail,
      subject: `Rappel — devis ${quote.quoteNumber} en attente de votre accord`,
      html: makeHtml(emailParams),
      text: makeText(emailParams),
    });

    const resultStatus = result.status;
    const resultError = "errorMessage" in result ? result.errorMessage : null;
    if (resultStatus === "SENT") {
      await prisma.followUpReminder.update({
        where: { id: reminder.id },
        data: { status: "DONE" },
      });
      sent++;
    } else {
      errors.push(`${reminder.id}: ${resultError ?? resultStatus}`);
    }
  }

  return NextResponse.json({
    processed: reminders.length,
    sent,
    skipped,
    errors,
    timestamp: now.toISOString(),
  });
}
