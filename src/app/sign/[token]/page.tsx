import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateDeposit, formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { SignaturePad } from "./SignaturePad";

export const dynamic = "force-dynamic";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { signatureToken: token },
    select: {
      id: true,
      quoteNumber: true,
      title: true,
      validUntil: true,
      paymentTerms: true,
      depositPercent: true,
      depositAmountCents: true,
      subtotalHtCents: true,
      totalVatCents: true,
      totalTtcCents: true,
      clientSignedAt: true,
      lines: {
        orderBy: { position: "asc" },
        select: { id: true, type: true, title: true, description: true, quantity: true, unit: true, unitPriceHtCents: true, vatRate: true, totalHtCents: true },
      },
      client: { select: { name: true, companyName: true } },
      user: {
        select: {
          companyProfile: {
            select: { companyName: true, address: true, postalCode: true, city: true, phone: true, email: true },
          },
        },
      },
    },
  });

  if (!quote) notFound();

  const company = quote.user.companyProfile;
  const clientName = quote.client.companyName || quote.client.name;
  const isSigned = !!quote.clientSignedAt;
  const isExpired = quote.validUntil < new Date();
  const depositAmount = quote.depositAmountCents ?? calculateDeposit(quote.totalTtcCents, Number(quote.depositPercent));
  const unitLabels: Record<string, string> = {
    UNIT: "u", HOUR: "h", DAY: "j", M2: "m²", M3: "m³", ML: "ml", PACKAGE: "forfait",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm font-bold text-[#e86218]">ChantierDevis</p>
          <p className="text-xs text-slate-400">Document sécurisé</p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{quote.quoteNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">{quote.title}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {company ? (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Artisan</p>
                <p className="mt-1.5 font-semibold text-slate-800">{company.companyName}</p>
                <p className="text-sm text-slate-500">{company.address}, {company.postalCode} {company.city}</p>
                {company.phone ? <p className="text-sm text-slate-500">{company.phone}</p> : null}
              </div>
            ) : null}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client</p>
              <p className="mt-1.5 font-semibold text-slate-800">{clientName}</p>
              <p className="text-sm text-slate-500">
                Valable jusqu&apos;au {formatShortFrenchDate(quote.validUntil)}
              </p>
            </div>
          </div>

          {/* Lines */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 pr-4">Désignation</th>
                  <th className="pb-2 pr-4 text-right">Qté</th>
                  <th className="pb-2 pr-4">Unité</th>
                  <th className="pb-2 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.lines
                  .filter((l) => l.type !== "SECTION")
                  .map((line) => (
                    <tr key={line.id} className="align-top">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-slate-800">{line.title}</p>
                        {line.description ? (
                          <p className="text-xs text-slate-400">{line.description}</p>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-slate-600">
                        {Number(line.quantity).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">{unitLabels[line.unit] ?? line.unit}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-slate-800">
                        {formatMoney(line.totalHtCents)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Total HT</span>
              <span className="tabular-nums">{formatMoney(quote.subtotalHtCents)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>TVA</span>
              <span className="tabular-nums">{formatMoney(quote.totalVatCents)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-[#e86218] px-4 py-2.5 font-bold text-white">
              <span>Total TTC</span>
              <span className="tabular-nums">{formatMoney(quote.totalTtcCents)}</span>
            </div>
            {depositAmount > 0 ? (
              <div className="flex justify-between pt-1 text-slate-500">
                <span>Acompte demandé{quote.depositPercent ? ` (${Number(quote.depositPercent)} %)` : ""}</span>
                <span className="tabular-nums">{formatMoney(depositAmount)}</span>
              </div>
            ) : null}
          </div>

          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            <strong className="text-slate-700">Conditions de paiement : </strong>
            {quote.paymentTerms}
          </p>
        </div>

        {isSigned ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <p className="text-lg font-bold text-green-800">Ce devis a déjà été signé</p>
            <p className="mt-1 text-sm text-green-700">
              Signé le {formatShortFrenchDate(quote.clientSignedAt)}.
            </p>
          </div>
        ) : isExpired ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-lg font-bold text-red-800">Ce devis est expiré</p>
            <p className="mt-1 text-sm text-red-700">
              Il était valable jusqu&apos;au {formatShortFrenchDate(quote.validUntil)}.
              Contactez l&apos;artisan pour en obtenir un nouveau.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Valider et signer le devis</h2>
            <p className="mt-1 text-sm text-slate-500">
              En signant, vous acceptez les conditions du devis {quote.quoteNumber} pour un montant total de{" "}
              <strong>{formatMoney(quote.totalTtcCents)}</strong> TTC.
            </p>
            <SignaturePad token={token} />
            <p className="mt-5 text-xs text-slate-400">
              Cette signature électronique a valeur d&apos;accord commercial. Le prestataire reste responsable de la conformité légale finale du document.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
