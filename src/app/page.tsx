import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  Hammer,
  Percent,
  Send,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: ClipboardCheck,
    title: "Conformité guidée",
    text: "SIRET, TVA, assurance décennale, bon pour accord : les oublis visibles sont signalés avant l’envoi.",
  },
  {
    icon: Percent,
    title: "Marge en temps réel",
    text: "Chaque ligne calcule HT, TVA, TTC, coût de revient et marge brute. Vous savez si le chantier tient la route.",
  },
  {
    icon: BookOpenText,
    title: "Bibliothèque d\u2019ouvrages",
    text: "Enregistrez vos prestations habituelles avec prix, coût et TVA. Ajoutez-les en un clic sur chaque devis.",
  },
  {
    icon: Send,
    title: "Suivi et relances",
    text: "Devis envoyés sans réponse, expirés, à relancer : vous voyez tout de suite où reprendre contact.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Client et chantier",
    text: "Sélectionnez un client existant ou créez-le sans quitter le devis. L\u2019adresse chantier se pré-remplit.",
  },
  {
    step: "02",
    title: "Ouvrages réutilisables",
    text: "Piochez dans votre bibliothèque ou ajoutez des lignes manuelles. Sections, remises et forfaits disponibles.",
  },
  {
    step: "03",
    title: "Marge et conformité",
    text: "Le panneau latéral affiche les totaux, la marge et les mentions manquantes en direct pendant la saisie.",
  },
  {
    step: "04",
    title: "Document prêt à signer",
    text: "Générez un PDF imprimable ou envoyez le devis par email depuis le cockpit. Pas de Word, pas de bricolage.",
  },
];

const pricing = [
  {
    name: "Gratuit",
    price: "0\u00a0€",
    period: "",
    description: "Pour tester sans engagement.",
    items: [
      "1 client, 1 devis",
      "Aperçu du document",
      "Bibliothèque limitée",
    ],
    cta: "Commencer gratuitement",
    ctaVariant: "secondary" as const,
  },
  {
    name: "Solo",
    price: "19\u00a0€",
    period: "/mois",
    description: "Pour l\u2019artisan indépendant actif.",
    items: [
      "Devis illimités",
      "20 clients",
      "Ouvrages réutilisables",
      "Export PDF et impression",
      "Suivi basique",
    ],
    cta: "Choisir Solo",
    ctaVariant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "29\u00a0€",
    period: "/mois",
    description: "Pour optimiser chaque chantier.",
    recommended: true,
    items: [
      "Clients illimités",
      "Ouvrages illimités",
      "Suivi des marges",
      "Checklist de conformité",
      "Duplication et modèles",
      "Relances et rappels",
    ],
    cta: "Choisir Pro",
    ctaVariant: "primary" as const,
  },
  {
    name: "Entreprise artisanale",
    price: "49\u00a0€",
    period: "/mois",
    description: "Pour la structure en croissance.",
    items: [
      "Paramètres avancés de structure",
      "Paramètres documents avancés",
      "Support prioritaire",
      "Modèles multi-corps de métier",
    ],
    cta: "Créer un compte",
    ctaVariant: "secondary" as const,
  },
];

const faqs = [
  {
    q: "Est-ce un outil juridique\u00a0?",
    a: "Non. ChantierDevis aide à vérifier les mentions courantes et à structurer vos documents, mais ne remplace pas un expert-comptable, un avocat ou votre fédération professionnelle.",
  },
  {
    q: "La franchise en base de TVA est-elle gérée\u00a0?",
    a: "Oui. Le mode franchise force la TVA à 0 sur toutes les lignes et ajoute automatiquement la mention légale \u00ab\u00a0TVA non applicable, art.\u00a0293\u00a0B du CGI\u00a0\u00bb.",
  },
  {
    q: "Puis-je réutiliser mes prestations habituelles\u00a0?",
    a: "Oui. La bibliothèque d\u2019ouvrages permet de conserver prix de vente, coût de revient, TVA et description. Ajoutez-les en un clic sur chaque devis.",
  },
  {
    q: "Comment fonctionne la conversion en facture\u00a0?",
    a: "Un devis accepté peut être converti en facture en un clic. Les coordonnées, lignes et montants sont repris automatiquement.",
  },
  {
    q: "Mes données sont-elles privées\u00a0?",
    a: "Chaque compte dispose d\u2019un espace isolé. Vos clients, devis et ouvrages ne sont jamais accessibles à d\u2019autres utilisateurs.",
  },
];

const trustPoints = [
  { icon: Shield, text: "Devis prêts à signer" },
  { icon: Zap, text: "Sans Word ni Excel" },
  { icon: TrendingUp, text: "Marge visible avant envoi" },
];

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0f1f31] text-white">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(90deg,#fff 1px,transparent 1px),linear-gradient(#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-semibold text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Devis BTP, marges et relances au même endroit
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Des devis BTP{" "}
            <span className="text-accent">propres, rentables</span>
            {" "}et prêts à signer en quelques minutes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            ChantierDevis aide les artisans à créer des devis professionnels, calculer leurs
            marges, vérifier les points à compléter et envoyer des documents prêts à signer.
            Sans Excel, sans Word, sans bricolage.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register?next=/app/quotes/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-base font-bold text-white shadow-lg transition hover:bg-[#cc5810] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Créer mon premier devis
              <ArrowRight aria-hidden className="h-5 w-5" />
            </Link>
            <Link
              href="#workflow"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/8 px-6 text-base font-semibold text-white transition hover:bg-white/15"
            >
              Voir le fonctionnement
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap gap-6">
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.text} className="flex items-center gap-2 text-sm text-white/60">
                  <Icon aria-hidden className="h-4 w-4 text-accent" />
                  {point.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-amber-400/60" />
              <div className="h-3 w-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-white/40">ChantierDevis · Devis DEV-2026-0042</span>
            </div>
            <div className="grid gap-0 md:grid-cols-[1fr_300px]">
              {/* Quote preview */}
              <div className="border-r border-white/10 bg-[#fefcf7] p-6 text-slate-900">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#1e3a5a]">DEV-2026-0042</p>
                    <h2 className="mt-1 text-lg font-bold">Rénovation salle de bain complète</h2>
                    <p className="mt-0.5 text-sm text-slate-500">M. Martin · Chantier : 92100 Boulogne-Billancourt</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                    Prêt à envoyer
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {[
                    ["Dépose ancienne installation", "420,00 €"],
                    ["Pose carrelage 18 m²", "1\u00a0260,00 €"],
                    ["Remplacement ballon eau chaude", "890,00 €"],
                    ["Main-d\u2019œuvre qualifiée", "1\u00a0116,00 €"],
                  ].map(([item, price]) => (
                    <div key={item} className="flex items-center justify-between border-b border-slate-100 py-2">
                      <span className="text-slate-700">{item}</span>
                      <strong className="tabular-nums">{price}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Total HT</span><strong>3\u00a0686,00 €</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA 20%</span><strong>737,20 €</strong>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#1e3a5a] px-3 py-2 text-base font-bold text-white">
                    <span>Total TTC</span><strong>4\u00a0423,20 €</strong>
                  </div>
                </div>
              </div>
              {/* Side panel */}
              <div className="grid content-between gap-3 p-4">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Marge brute</p>
                  <p className="mt-1 text-3xl font-bold text-green-400">38,4 %</p>
                  <p className="mt-1 text-xs text-white/50">Coût intégré ligne par ligne</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Conformité</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                    {["SIRET renseigné", "TVA par ligne", "Adresse chantier", "Bon pour accord"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0 text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-white/10 p-4 text-center">
                  <p className="text-xs text-white/50">Action suivante</p>
                  <p className="mt-1 text-sm font-semibold text-white">Envoyer au client</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Le problème</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Un devis, c&apos;est plus que remplir un modèle Word.
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-muted">
            <p>
              Un artisan doit aller vite, rassurer le client, ne rien oublier, préserver sa marge
              et garder une trace claire de chaque échange.
            </p>
            <p>
              Word, Excel et les modèles bricolés finissent par mélanger prix, TVA, descriptions,
              mentions obligatoires et relances client. Sans calcul automatique, une ligne sous-cotée
              passe inaperçue jusqu&apos;à la fin du chantier.
            </p>
            <p className="font-semibold text-foreground">
              ChantierDevis remplace tout ça par un poste de pilotage simple, pensé pour le terrain.
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Fonctionnement</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              De zéro au devis prêt à signer en quelques minutes.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step) => (
              <div key={step.step} className="relative rounded-2xl border border-border bg-[#fefcf7] p-6 shadow-sm">
                <span className="text-3xl font-black tabular-nums text-accent/20">{step.step}</span>
                <h3 className="mt-3 text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Fonctionnalités</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Ce que ChantierDevis remplace.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Icon aria-hidden className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-5 font-bold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* PRODUCT OVERVIEW */}
      <section className="bg-[#1e3a5a] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-accent/80">Le cockpit</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Votre activité, lisible en un coup d&apos;œil.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/65">
              Le tableau de bord affiche les devis à relancer, les brouillons incomplets, les
              montants acceptés et votre marge moyenne du mois. Pas besoin de fouiller.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Montant devisé et accepté ce mois",
                "Taux d\u2019acceptation et marge moyenne",
                "Devis expirés, à relancer, à compléter",
                "Conversion en facture en un clic",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-white shadow-2xl text-slate-900">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cockpit devis · Mai 2026</p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {[
                { label: "Devis ce mois", value: "12" },
                { label: "Montant accepté", value: "18\u00a0640\u00a0€" },
                { label: "À relancer", value: "3" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-slate-200">
              {[
                { ref: "DEV-2026-0042", title: "Rénovation salle de bain", badge: "Envoyé", color: "amber" },
                { ref: "DEV-2026-0041", title: "Mise en peinture", badge: "Accepté", color: "green" },
                { ref: "DEV-2026-0040", title: "Pose carrelage", badge: "À relancer", color: "red" },
              ].map((row, i) => (
                <div
                  key={row.ref}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${i < 2 ? "border-b border-slate-100" : ""}`}
                >
                  <div>
                    <p className="font-semibold text-[#1e3a5a]">{row.ref}</p>
                    <p className="text-xs text-slate-500">{row.title}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      row.color === "green"
                        ? "bg-green-50 text-green-800"
                        : row.color === "amber"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {row.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Tarifs</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Une formule claire pour chaque profil.</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            Commencez gratuitement. Passez à une formule payante quand vous en avez besoin.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {pricing.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
                plan.recommended
                  ? "border-accent bg-white shadow-lg ring-2 ring-accent/20"
                  : "border-border bg-card"
              }`}
            >
              {plan.recommended ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow">
                    Recommandé
                  </span>
                </div>
              ) : null}
              <div>
                <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums text-foreground">
                    {plan.price}
                  </span>
                  {plan.period ? (
                    <span className="text-sm text-muted">{plan.period}</span>
                  ) : null}
                </div>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-muted">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/register"
                  className={`flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                    plan.recommended
                      ? "bg-accent text-white hover:bg-[#cc5810]"
                      : "border border-border bg-card text-foreground hover:bg-white hover:border-[#c0c9d8]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold">Questions fréquentes</h2>
          </div>
          <div className="mt-10 divide-y divide-border">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none font-semibold text-foreground">
                  {q}
                  <span className="shrink-0 text-muted transition group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg bg-[#0f1f31] p-10 text-white shadow-2xl sm:p-14">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(90deg,#fff 1px,transparent 1px),linear-gradient(#fff 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative">
          <Hammer aria-hidden className="h-10 w-10 text-accent" />
          <h2 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Prêt à remplacer vos modèles Word et Excel\u00a0?
          </h2>
          <p className="mt-4 max-w-xl text-lg text-white/65">
            Créez un premier devis, ajoutez vos ouvrages habituels, puis générez un document
            imprimable et professionnel. En quelques minutes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register?next=/app/quotes/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-base font-bold text-white shadow-lg transition hover:bg-[#cc5810]"
            >
              Créer mon premier devis
              <ArrowRight aria-hidden className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/8 px-6 text-base font-semibold text-white transition hover:bg-white/15"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-950">
          <p>
            <strong>Avertissement\u00a0:</strong> ChantierDevis est un outil d&apos;aide à la création de
            devis. Il ne remplace pas un expert-comptable, un avocat, une fédération professionnelle
            ou un conseil juridique personnalisé. Vérifiez toujours vos documents auprès d&apos;un
            professionnel compétent avant envoi.
          </p>
        </div>

        {/* Footer nav */}
        <nav
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
          aria-label="Liens légaux"
        >
          <Link href="/legal/mentions-legales" className="hover:text-primary hover:underline">
            Mentions légales
          </Link>
          <Link href="/legal/confidentialite" className="hover:text-primary hover:underline">
            Confidentialité
          </Link>
          <Link href="/legal/cgv" className="hover:text-primary hover:underline">
            CGV
          </Link>
          <Link href="/legal/rgpd" className="hover:text-primary hover:underline">
            RGPD
          </Link>
          <span className="ml-auto text-muted/60">© 2026 ChantierDevis</span>
        </nav>
      </section>
    </main>
  );
}
