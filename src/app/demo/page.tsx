import { CheckCircle2, Clock, Hammer, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { DemoCTA, StickyBar, CountUp } from "./demo-cta";

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
    icon: "💬",
  },
  {
    num: "02",
    title: "L'IA génère les lignes",
    text: "6 postes avec prix, quantités et TVA en quelques secondes. Vous modifiez ce que vous voulez.",
    highlight: false,
    icon: "⚡",
  },
  {
    num: "03",
    title: "Marge visible avant envoi",
    text: "Chaque ligne affiche votre marge brute. Vous savez si le chantier est rentable avant d'envoyer.",
    highlight: false,
    icon: "📊",
  },
  {
    num: "04",
    title: "Le client signe depuis son téléphone",
    text: "Un lien WhatsApp ou email. Il ouvre, il signe. Le devis passe en accepté automatiquement.",
    highlight: false,
    icon: "✍️",
  },
];

const TESTIMONIALS = [
  { text: "Je faisais mes devis sur Word, ça me prenait 45 min. Là c'est 3 minutes top.", name: "Karim B.", role: "Carreleur — Lyon" },
  { text: "La marge visible sur chaque ligne, ça change tout. J'ai arrêté de vendre à perte.", name: "Thomas M.", role: "Plombier — Bordeaux" },
  { text: "Le client a signé depuis son portable en 2 minutes. Je l'ai vu faire en temps réel.", name: "Sébastien R.", role: "Électricien — Paris" },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-foreground pb-20">
      <StickyBar />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1f31]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <Hammer aria-hidden className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black tracking-tight">ChantierDevis</span>
          </Link>
          <DemoCTA label="Essayer gratuitement — 0 €" size="sm" position="nav" />
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
            L&apos;IA a généré ces 6 lignes à partir d&apos;une description en langage naturel.
          </p>

          {/* Stats rapides */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-black text-accent">
                <CountUp target={2} suffix=" min" />
              </p>
              <p className="text-xs text-white/50 mt-0.5">par devis</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-black text-green-400">
                <CountUp target={41} suffix=" %" />
              </p>
              <p className="text-xs text-white/50 mt-0.5">marge moyenne</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-black text-white">
                <CountUp target={0} suffix=" €" />
              </p>
              <p className="text-xs text-white/50 mt-0.5">pour commencer</p>
            </div>
          </div>
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

          {/* Timer IA */}
          <div className="flex items-center gap-3 border-b border-border bg-green-50 px-5 py-2">
            <Zap className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-green-700">
              Généré en <strong>28 secondes</strong> — sans aucun clic, juste une phrase
            </p>
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

        {/* CTA principal sous le devis */}
        <div className="mt-8 rounded-2xl bg-[#0f1f31] p-8 text-center text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-xs font-semibold text-green-400">
            <Users className="h-3 w-3" />
            Rejoignez les artisans qui gagnent du temps chaque semaine
          </div>
          <p className="text-xl font-bold">Maintenant testez avec votre propre chantier.</p>
          <p className="mt-2 text-sm text-white/60">
            Décrivez-le en une phrase — l&apos;IA génère vos lignes, vos prix, vos marges.<br />
            Votre premier devis est prêt en 2 minutes.
          </p>
          <div className="mt-6">
            <DemoCTA label="Créer mon premier devis" size="lg" position="main_cta" />
          </div>
          <p className="mt-3 text-xs text-white/40">Aucune carte bancaire · Accès immédiat · 0 €</p>
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
                <span className="text-2xl">{step.icon}</span>
                <h3 className="mt-2 text-sm font-bold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Temps gagné */}
      <section className="bg-[#f8f7f4] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-xl font-bold">Combien de temps ça prend vraiment ?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-5">
              <Clock className="h-5 w-5 text-red-400 mx-auto" />
              <p className="mt-2 text-3xl font-black text-red-400">45 min</p>
              <p className="text-xs text-muted mt-1">Devis Word / Excel classique</p>
            </div>
            <div className="flex items-center justify-center text-2xl font-black text-muted">→</div>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <Zap className="h-5 w-5 text-green-600 mx-auto" />
              <p className="mt-2 text-3xl font-black text-green-600">2 min</p>
              <p className="text-xs text-green-700 mt-1">Avec ChantierDevis</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Sur 10 devis par mois : <strong className="text-foreground">+7h de libérées</strong> pour être sur le chantier.
          </p>
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold">Ce que disent les artisans</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-border bg-[#fefcf7] p-5">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-muted italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-3 text-xs font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#0f1f31] py-14 text-white text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold">Votre prochain devis en 2 minutes.</h2>
          <p className="mt-3 text-sm text-white/60">
            Gratuit. Sans carte. Sans engagement. Juste votre premier devis.
          </p>
          <div className="mt-6">
            <DemoCTA label="Créer mon compte gratuitement" size="lg" position="footer_cta" />
          </div>
          <p className="mt-3 text-xs text-white/30">0 € · Accès immédiat · Sans carte bancaire</p>
        </div>
      </section>
    </main>
  );
}
