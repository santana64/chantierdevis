import { ArrowRight, CheckCircle2, Clock, Hammer, Sparkles, TrendingUp, Zap } from "lucide-react";
import type { Metadata } from "next";
import { DemoCTA, StickyBar } from "../demo/demo-cta";

export const metadata: Metadata = {
  title: "Bienvenue — ChantierDevis",
  description: "Créez votre premier devis BTP en 2 minutes. IA, marge visible, signature en ligne.",
};

const DEMO_LINES = [
  { title: "Dépose ancienne installation", qty: "1", unit: "forfait", pu: "280,00 €", total: "280,00 €", margin: "38 %" },
  { title: "Pose carrelage sol 8 m²", qty: "8", unit: "m²", pu: "55,00 €", total: "440,00 €", margin: "41 %" },
  { title: "Faïence murale 22 m²", qty: "22", unit: "m²", pu: "58,00 €", total: "1 276,00 €", margin: "43 %" },
  { title: "WC suspendu bâti-support", qty: "1", unit: "u", pu: "480,00 €", total: "480,00 €", margin: "35 %" },
  { title: "Robinetterie douche", qty: "1", unit: "u", pu: "320,00 €", total: "320,00 €", margin: "39 %" },
  { title: "Main-d'œuvre qualifiée", qty: "18", unit: "h", pu: "60,00 €", total: "1 080,00 €", margin: "52 %" },
];

export default function BienvenueePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-foreground pb-24">
      <StickyBar />

      {/* Nav minimaliste */}
      <header className="bg-[#0f1f31] px-4 py-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
          <Hammer aria-hidden className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-black tracking-tight text-white">ChantierDevis</span>
      </header>

      {/* Hero ultra-direct */}
      <section className="bg-[#0f1f31] pb-10 pt-8 text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-semibold text-green-400">
            <Zap className="h-3.5 w-3.5" />
            Vous avez reçu notre email — voilà ce qu&apos;on fait exactement
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Un devis BTP complet<br />
            <span className="text-accent">en 2 minutes chrono.</span>
          </h1>
          <p className="mt-4 text-base text-white/60">
            Décrivez votre chantier en une phrase. L&apos;IA génère les lignes, les prix, la TVA et votre marge.
            Votre client signe depuis son téléphone.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <DemoCTA label="Créer mon premier devis gratuitement" size="lg" position="bienvenue_hero" />
            <p className="text-xs text-white/30">Sans carte bancaire · Accès immédiat · 0 €</p>
          </div>
        </div>
      </section>

      {/* Preuve immédiate — le devis généré */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-center text-sm font-semibold text-muted uppercase tracking-wider">
          Exemple réel — généré en 28 secondes
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          {/* Header devis */}
          <div className="flex items-center justify-between border-b border-border bg-[#0f1f31] px-5 py-3 text-white">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Devis</p>
              <p className="font-bold text-sm">DEV-2026-0042 — Rénovation salle de bain</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3 w-3" />
              IA
            </div>
          </div>

          {/* Prompt */}
          <div className="border-b border-border bg-accent/5 px-5 py-2.5">
            <p className="text-xs text-accent font-semibold">Description tapée :</p>
            <p className="mt-0.5 text-sm italic text-muted">
              &ldquo;Rénovation salle de bain 8m², dépose, carrelage sol et mur, WC suspendu, robinetterie, main-d&apos;œuvre&rdquo;
            </p>
          </div>

          {/* Lignes */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 text-left">Prestation</th>
                  <th className="px-3 py-2.5 text-right">Qté</th>
                  <th className="px-3 py-2.5">Unité</th>
                  <th className="px-3 py-2.5 text-right">PU HT</th>
                  <th className="px-3 py-2.5 text-right">Total HT</th>
                  <th className="px-3 py-2.5 text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_LINES.map((l, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2.5 font-medium">{l.title}</td>
                    <td className="px-3 py-2.5 text-right text-muted tabular-nums">{l.qty}</td>
                    <td className="px-3 py-2.5 text-muted">{l.unit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{l.pu}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{l.total}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">{l.margin}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total + marge */}
          <div className="border-t border-border bg-slate-50 px-5 py-3 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-muted">
                <span>Total HT</span><span className="tabular-nums font-medium">3 196,67 €</span>
              </div>
              <div className="flex justify-between rounded-lg bg-[#0f1f31] px-3 py-2 text-white font-bold">
                <span>Total TTC</span><span className="tabular-nums">3 872,00 €</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />Marge estimée
                </span>
                <span className="font-black text-green-600 tabular-nums">41,2 %</span>
              </div>
            </div>
          </div>

          {/* Mentions conformité */}
          <div className="flex flex-wrap gap-3 border-t border-border px-5 py-3 text-xs">
            {["SIRET présent", "Décennale", "TVA correcte", "Bon pour accord"].map(m => (
              <span key={m} className="flex items-center gap-1 text-green-600 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3 arguments courts */}
      <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <Clock className="h-6 w-6 text-accent mx-auto" />
            <p className="mt-2 text-2xl font-black">2 min</p>
            <p className="text-xs text-muted mt-1">par devis au lieu de 45 min</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto" />
            <p className="mt-2 text-2xl font-black text-green-600">Marge visible</p>
            <p className="text-xs text-muted mt-1">sur chaque ligne avant envoi</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <CheckCircle2 className="h-6 w-6 text-blue-500 mx-auto" />
            <p className="mt-2 text-2xl font-black">100% légal</p>
            <p className="text-xs text-muted mt-1">mentions obligatoires vérifiées</p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-2xl px-4 pb-10 sm:px-6">
        <div className="rounded-2xl bg-[#0f1f31] p-8 text-center text-white">
          <p className="text-xl font-bold">Testez sur votre prochain chantier.</p>
          <p className="mt-2 text-sm text-white/50">
            Gratuit. Sans carte. Votre premier devis en 2 minutes.
          </p>
          <div className="mt-5">
            <DemoCTA label="Créer mon compte — 0 €" size="lg" position="bienvenue_footer" />
          </div>
          <p className="mt-3 text-xs text-white/30">Sans engagement · Accès immédiat</p>
        </div>
      </section>
    </main>
  );
}
