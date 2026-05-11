import { ArrowRight, CheckCircle2, Hammer, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo — ChantierDevis",
  description: "Voyez ChantierDevis en action : devis BTP généré par IA, marge visible, signature en ligne. Sans créer de compte.",
};

const DEMO_LINES = [
  { title: "Dépose ancienne installation", qty: "1 forfait", unit: "FORFAIT", pu: "280,00 €", total: "280,00 €", margin: "38 %" },
  { title: "Pose carrelage sol 8 m²", qty: "8", unit: "m²", pu: "55,00 €", total: "440,00 €", margin: "41 %" },
  { title: "Faïence murale 22 m²", qty: "22", unit: "m²", pu: "58,00 €", total: "1 276,00 €", margin: "43 %" },
  { title: "WC suspendu bâti-support", qty: "1", unit: "u", pu: "480,00 €", total: "480,00 €", margin: "35 %" },
  { title: "Robinetterie douche", qty: "1", unit: "u", pu: "320,00 €", total: "320,00 €", margin: "39 %" },
  { title: "Main-d'œuvre qualifiée", qty: "18", unit: "h", pu: "60,00 €", total: "1 080,00 €", margin: "52 %" },
];

const STEPS = [
  {
    num: "01",
    title: "Vous décrivez le chantier",
    text: "\"Rénovation salle de bain 8m², dépose + carrelage sol et mur + WC suspendu + robinetterie\"",
    highlight: true,
  },
  {
    num: "02",
    title: "L'IA génère les lignes",
    text: "6 postes avec prix, quantités et TVA en quelques secondes. Vous modifiez ce que vous voulez.",
    highlight: false,
  },
  {
    num: "03",
    title: "Marge visible avant envoi",
    text: "Chaque ligne affiche votre marge brute. Vous savez si le chantier est rentable avant d'envoyer.",
    highlight: false,
  },
  {
    num: "04",
    title: "Le client signe depuis son téléphone",
    text: "Un lien WhatsApp ou email. Il ouvre, il signe. Le devis passe en accepté automatiquement.",
    highlight: false,
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1f31]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <Hammer aria-hidden className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black tracking-tight">ChantierDevis</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-green-600"
          >
            Essayer gratuitement — 0 €
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0f1f31] py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-sm font-semibold text-accent">
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            Démo interactive — sans créer de compte
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Voilà ce que ChantierDevis génère en{" "}
            <span className="text-accent">30 secondes</span>
          </h1>
          <p className="mt-4 text-base text-white/65">
            Exemple réel : rénovation salle de bain 8 m², plomberie + carrelage.
            L'IA a généré ces 6 lignes à partir d'une description en langage naturel.
          </p>
        </div>
      </section>

      {/* Demo devis */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
          {/* Barre titre */}
          <div className="flex items-center justify-between border-b border-border bg-[#0f1f31] px-5 py-3 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Devis</p>
              <p className="font-bold">DEV-2026-0042 — Rénovation salle de bain</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles aria-hidden className="h-3 w-3" />
              Généré par IA
            </div>
          </div>

          {/* Prompt IA */}
          <div className="border-b border-border bg-accent/5 px-5 py-3">
            <p className="text-xs font-semibold text-accent">Votre description :</p>
            <p className="mt-0.5 text-sm italic text-muted">
              &ldquo;Rénovation salle de bain 8m², dépose ancienne installation, carrelage sol et mur, WC suspendu bâti-support, robinetterie douche, main-d&apos;œuvre qualifiée&rdquo;
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Prestation</th>
                  <th className="px-4 py-3 text-right">Qté</th>
                  <th className="px-4 py-3">Unité</th>
                  <th className="px-4 py-3 text-right">PU HT</th>
                  <th className="px-4 py-3 text-right">Total HT</th>
                  <th className="px-4 py-3 text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_LINES.map((line, i) => (
                  <tr key={i} className="border-t border-border hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium">{line.title}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{line.qty}</td>
                    <td className="px-4 py-3 text-muted">{line.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{line.pu}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{line.total}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        {line.margin}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex flex-col items-end gap-0 border-t border-border bg-slate-50 px-5 py-4">
            <div className="flex w-full max-w-xs flex-col gap-1 text-sm">
              <div className="flex justify-between text-muted">
                <span>Total HT</span><span className="tabular-nums font-medium">3 196,67 €</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>TVA 10 %</span><span className="tabular-nums font-medium">319,67 €</span>
              </div>
              <div className="mt-1 flex justify-between rounded-lg bg-[#0f1f31] px-4 py-2.5 text-base font-bold text-white">
                <span>Total TTC</span><span className="tabular-nums">3 872,00 €</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-2">
                <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Marge brute estimée
                </span>
                <span className="text-lg font-black text-green-600 tabular-nums">41,2 %</span>
              </div>
            </div>
          </div>

          {/* Conformite */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border px-5 py-3 text-xs">
            <span className="flex items-center gap-1.5 text-green-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SIRET présent
            </span>
            <span className="flex items-center gap-1.5 text-green-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Assurance décennale
            </span>
            <span className="flex items-center gap-1.5 text-green-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              TVA correcte
            </span>
            <span className="flex items-center gap-1.5 text-green-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Bon pour accord
            </span>
            <span className="ml-auto rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
              Checklist OK — 0 mention manquante
            </span>
          </div>
        </div>

        {/* CTA sous le devis */}
        <div className="mt-8 rounded-2xl bg-[#0f1f31] p-8 text-center text-white">
          <p className="text-lg font-bold">Ce devis a été généré en 30 secondes.</p>
          <p className="mt-2 text-sm text-white/60">
            Créez votre compte gratuitement et envoyez votre premier devis aujourd&apos;hui.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-green-600"
          >
            Commencer gratuitement — 0 €
            <ArrowRight aria-hidden className="h-5 w-5" />
          </Link>
          <p className="mt-3 text-xs text-white/40">Aucune carte bancaire · Annulez à tout moment</p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold">Comment ça marche</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`rounded-2xl border p-5 ${step.highlight ? "border-accent/30 bg-accent/5" : "border-border bg-[#fefcf7]"}`}
              >
                <span className="text-3xl font-black tabular-nums text-accent/20">{step.num}</span>
                <h3 className="mt-2 text-sm font-bold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-[#cc5810]"
            >
              Créer mon compte gratuitement
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <p className="mt-2 text-xs text-muted">0 € · Sans carte · Accès immédiat</p>
          </div>
        </div>
      </section>
    </main>
  );
}
