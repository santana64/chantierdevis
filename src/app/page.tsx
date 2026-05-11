import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  FileSignature,
  Hammer,
  Percent,
  Receipt,
  Send,
  Shield,
  Sparkles,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

const useCases = [
  {
    role: "Situation type — Plombier indépendant",
    text: "Un artisan qui passait 2 heures par devis sur Excel peut décrire son chantier en langage naturel, laisser l'assistant IA générer les lignes, vérifier la marge et envoyer. Le client signe depuis son téléphone.",
  },
  {
    role: "Situation type — Peintre en bâtiment",
    text: "La checklist de conformité signale les mentions manquantes avant l'envoi : numéro de décennale, SIRET, assurance. Zéro oubli sur un devis envoyé à un maître d'ouvrage.",
  },
  {
    role: "Situation type — Carreleur",
    text: "La marge brute est calculée ligne par ligne, coût de revient inclus. L'artisan sait si le chantier est rentable avant même d'envoyer le devis. La facturation Factur-X suit en un clic.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Assistant IA pour vos devis",
    text: "Décrivez votre chantier en langage naturel : l'assistant génère les lignes de devis avec prix, coût de revient et TVA adaptés au BTP français. Modifiez chaque ligne avant d'envoyer.",
  },
  {
    icon: Percent,
    title: "Marge en temps réel",
    text: "Chaque ligne calcule HT, TVA, TTC, coût de revient et marge brute. Vous savez si le chantier tient la route avant d'envoyer.",
  },
  {
    icon: FileSignature,
    title: "Signature électronique",
    text: "Générez un lien sécurisé, partagez par WhatsApp ou email. Le client signe depuis son téléphone. Le devis passe en accepté automatiquement.",
    badge: "Nouveau",
  },
  {
    icon: ClipboardCheck,
    title: "Conformité automatique",
    text: "SIRET, TVA, assurance décennale, bon pour accord : les oublis sont signalés avant l'envoi. Zéro mention manquante.",
  },
  {
    icon: BookOpenText,
    title: "Bibliothèque BTP pré-remplie",
    text: "60+ ouvrages types par métier (plomberie, peinture, carrelage…) avec prix, coût et TVA. Importez-les en un clic, personnalisez ensuite.",
  },
  {
    icon: Send,
    title: "Suivi et relances",
    text: "Devis envoyés sans réponse, expirés, à relancer : vous voyez tout d'un coup d'œil. Relances automatiques 7 jours après l'envoi.",
  },
  {
    icon: Smartphone,
    title: "Fonctionne sur mobile",
    text: "Application installable sur iPhone et Android. Créez un devis en déplacement, signez depuis le chantier.",
  },
  {
    icon: Receipt,
    title: "Facturation Factur-X",
    text: "Convertissez un devis accepté en facture en un clic. Export Factur-X (norme EN 16931) pour Chorus Pro et la conformité 2026. Relances email automatiques.",
    badge: "Nouveau",
  },
  {
    icon: Shield,
    title: "Données isolées et sécurisées",
    text: "Vos clients et devis ne sont jamais accessibles à d'autres utilisateurs. Hébergement EU, chiffrement HTTPS, mots de passe jamais stockés en clair.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Décrivez votre chantier",
    text: "Tapez une description en langage naturel ou sélectionnez un client existant. L'adresse chantier se pré-remplit.",
  },
  {
    step: "02",
    title: "L'IA génère les lignes",
    text: "En quelques secondes, l'assistant IA propose les prestations avec prix, coût de revient et TVA indicatifs. Ajustez chaque ligne avant d’enregistrer.",
  },
  {
    step: "03",
    title: "Marge et conformité en direct",
    text: "Le panneau latéral affiche les totaux, la marge brute et les mentions manquantes en temps réel pendant la saisie.",
  },
  {
    step: "04",
    title: "Signature et facture",
    text: "Envoyez un lien de signature par WhatsApp. Quand le client signe, convertissez en facture en un clic. Zéro bricolage.",
  },
];

const comparison = [
  { feature: "IA générative pour devis", chantierdevis: true, tolteck: false, synobat: false },
  { feature: "Marge visible ligne par ligne", chantierdevis: true, tolteck: true, synobat: false },
  { feature: "Signature électronique", chantierdevis: true, tolteck: true, synobat: true },
  { feature: "Facturation + export Factur-X", chantierdevis: true, tolteck: false, synobat: false },
  { feature: "WhatsApp share en 1 clic", chantierdevis: true, tolteck: false, synobat: false },
  { feature: "PWA installable mobile", chantierdevis: true, tolteck: false, synobat: false },
  { feature: "Bibliothèque BTP pré-remplie", chantierdevis: true, tolteck: true, synobat: true },
  { feature: "Conformité mentions guidée", chantierdevis: true, tolteck: true, synobat: false },
  { feature: "Prix mensuel HT", chantierdevis: "19 €", tolteck: "29 €", synobat: "25 €" },
];

const pricing = [
  {
    name: "Gratuit",
    price: "0 €",
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
    price: "19 €",
    period: "/mois",
    description: "Pour l’artisan indépendant actif.",
    items: [
      "Devis illimités",
      "20 clients",
      "Assistant IA illimité",
      "Signature électronique",
      "Export PDF et impression",
      "Suivi basique",
    ],
    cta: "Choisir Solo",
    ctaVariant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "29 €",
    period: "/mois",
    description: "Pour optimiser chaque chantier.",
    recommended: true,
    items: [
      "Clients illimités",
      "Ouvrages illimités",
      "Suivi des marges avancé",
      "Checklist de conformité",
      "Duplication et modèles",
      "Relances et rappels automatiques",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    ctaVariant: "primary" as const,
  },
  {
    name: "Entreprise artisanale",
    price: "49 €",
    period: "/mois",
    description: "Pour la structure en croissance.",
    items: [
      "Tout le plan Pro",
      "Paramètres avancés de structure",
      "Modèles multi-corps de métier",
      "Support dédié",
    ],
    cta: "Créer un compte",
    ctaVariant: "secondary" as const,
  },
];

const faqs = [
  {
    q: "Comment fonctionne l’assistant IA ?",
    a: "Décrivez votre chantier en quelques phrases (\"rénovation cuisine 12m², plomberie et carrelage\"). L'IA génère les lignes de devis avec des prix réalistes du marché BTP français 2026, que vous pouvez modifier avant d'enregistrer.",
  },
  {
    q: "La signature électronique a-t-elle une valeur légale ?",
    a: "La signature canvas constitue un accord commercial entre vous et votre client. Pour des chantiers importants, nous recommandons de compléter par un bon de commande papier signé. ChantierDevis ne remplace pas un conseil juridique.",
  },
  {
    q: "Est-ce un outil juridique ?",
    a: "Non. ChantierDevis aide à vérifier les mentions courantes, mais ne remplace pas un expert-comptable, un avocat ou votre fédération professionnelle.",
  },
  {
    q: "La franchise en base de TVA est-elle gérée ?",
    a: "Oui. Le mode franchise force la TVA à 0 sur toutes les lignes et ajoute la mention légale « TVA non applicable, art. 293 B du CGI ».",
  },
  {
    q: "Puis-je réutiliser mes prestations habituelles ?",
    a: "Oui. La bibliothèque d’ouvrages conserve prix de vente, coût de revient, TVA et description. Ajoutez-les en un clic ou importez les 60+ ouvrages BTP pré-remplis par métier.",
  },
  {
    q: "Comment fonctionne la facturation Factur-X ?",
    a: "Une fois un devis accepté, convertissez-le en facture en un clic. Chaque facture est exportable en XML Factur-X (norme EN 16931 COMFORT), compatible Chorus Pro et la réglementation française 2026. Le suivi des encaissements, les relances email et la détection automatique des retards sont inclus.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Chaque compte est strictement isolé côté serveur. Vos clients, devis et ouvrages ne sont jamais accessibles à d’autres utilisateurs. Données hébergées en Europe (AWS eu-west-2).",
  },
];

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      {/* STICKY NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1f31]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <Hammer aria-hidden className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black tracking-tight">ChantierDevis</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 sm:flex" aria-label="Navigation principale">
            <Link href="#workflow" className="transition hover:text-white">Fonctionnement</Link>
            <Link href="#fonctionnalites" className="transition hover:text-white">Fonctionnalités</Link>
            <Link href="#temoignages" className="transition hover:text-white">Témoignages</Link>
            <Link href="#tarifs" className="transition hover:text-white">Tarifs</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-white/70 transition hover:text-white sm:inline-flex"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#cc5810]"
            >
              Essai gratuit
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0f1f31] text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(90deg,#fff 1px,transparent 1px),linear-gradient(#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-sm font-semibold text-accent">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              Assistant IA intégré pour vos devis BTP
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-semibold text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden />
              Lien de signature · PWA mobile
            </div>
          </div>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Devis BTP{" "}
            <span className="text-accent">intelligents, rentables</span>
            {" "}du marché. À 19 €/mois.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Décrivez votre chantier, l&apos;IA génère les lignes. Marge visible avant envoi.
            Lien de signature par WhatsApp. Mentions vérifiées automatiquement.
            Sans Excel, sans Word, sans bricolage.
          </p>

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

          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { icon: Sparkles, text: "IA pour chaque devis" },
              { icon: TrendingUp, text: "Marge visible avant envoi" },
              { icon: Zap, text: "Sans Word ni Excel" },
              { icon: Receipt, text: "Export XML Factur-X inclus" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-white/60">
                <Icon aria-hidden className="h-4 w-4 text-accent" />
                {text}
              </div>
            ))}
          </div>

          {/* Social proof bar */}
          <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8">
            {[
              { value: "< 5 min", label: "De la description au devis envoyé" },
              { value: "0 €", label: "Sans carte bancaire, 14 jours offerts" },
              { value: "EN 16931", label: "Format Factur-X compatible Chorus Pro" },
            ].map(({ value, label }) => (
              <div key={label} className="text-white">
                <p className="text-2xl font-black tabular-nums text-accent">{value}</p>
                <p className="mt-0.5 text-xs text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-amber-400/60" />
              <div className="h-3 w-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-white/40">ChantierDevis · Assistant IA · DEV-2026-0042</span>
            </div>
            <div className="grid gap-0 md:grid-cols-[1fr_300px]">
              <div className="border-r border-white/10 bg-[#fefcf7] p-6 text-slate-900">
                <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
                  <p className="text-xs font-semibold text-accent">
                    ✨ IA — Rénovation salle de bain 8m², plomberie + carrelage
                  </p>
                  <p className="mt-1 text-xs text-slate-500">6 lignes générées · Prix indicatifs BTP, ajustables</p>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Dépose ancienne installation", "1 FORFAIT", "280,00 €"],
                    ["Pose carrelage sol 8m²", "8 m²", "440,00 €"],
                    ["Faïence murale 22m²", "22 m²", "1 276,00 €"],
                    ["WC suspendu bâti-support", "1 U", "480,00 €"],
                    ["Robinetterie douche", "1 U", "320,00 €"],
                    ["Main-d’œuvre qualifiée", "18 h", "1 080,00 €"],
                  ].map(([item, qty, price]) => (
                    <div key={item} className="flex items-center justify-between border-b border-slate-100 py-2">
                      <div>
                        <span className="font-medium text-slate-800">{item}</span>
                        <span className="ml-2 text-xs text-slate-400">{qty}</span>
                      </div>
                      <strong className="tabular-nums">{price}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between rounded-lg bg-[#1e3a5a] px-3 py-2 text-base font-bold text-white">
                  <span>Total TTC</span><strong>4 542,00 €</strong>
                </div>
              </div>
              <div className="grid content-between gap-3 p-4">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Marge brute</p>
                  <p className="mt-1 text-3xl font-bold text-green-400">41,2 %</p>
                  <p className="mt-1 text-xs text-white/50">Coût intégré par ligne</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Prêt à signer</p>
                  <p className="mt-2 text-sm font-semibold text-white">Lien WhatsApp généré →</p>
                  <p className="mt-1 text-xs text-white/50">Client signe depuis son téléphone</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 text-center">
                  <CheckCircle2 aria-hidden className="mx-auto h-6 w-6 text-green-400" />
                  <p className="mt-1.5 text-xs text-white/70">Checklist OK · 0 mention manquante détectée</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Fonctionnement</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Du chantier au devis signé en quelques minutes.
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
      <section id="fonctionnalites" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Fonctionnalités</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Tout ce qu&apos;un outil BTP doit faire.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                {feature.badge ? (
                  <span className="absolute right-4 top-4 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                    {feature.badge}
                  </span>
                ) : null}
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

      {/* COMPARISON TABLE */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Comparatif</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              ChantierDevis vs la concurrence.
            </h2>
            <p className="mt-3 text-base text-muted">Conçu spécifiquement pour les artisans BTP, avec assistant IA et export Factur-X.</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#0f1f31] text-white">
                  <th className="px-5 py-4 text-left font-semibold">Fonctionnalité</th>
                  <th className="px-4 py-4 text-center font-bold text-accent">ChantierDevis</th>
                  <th className="px-4 py-4 text-center font-semibold text-white/70">Tolteck</th>
                  <th className="px-4 py-4 text-center font-semibold text-white/70">Synobat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparison.map((row) => (
                  <tr key={row.feature} className="bg-card hover:bg-white transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.feature}</td>
                    {[row.chantierdevis, row.tolteck, row.synobat].map((value, i) => (
                      <td key={i} className="px-4 py-3.5 text-center">
                        {typeof value === "boolean" ? (
                          value ? (
                            <CheckCircle2 aria-label="Oui" className="mx-auto h-5 w-5 text-green-500" />
                          ) : (
                            <span aria-label="Non" className="text-slate-300 text-lg">×</span>
                          )
                        ) : (
                          <span className={i === 0 ? "font-bold text-accent" : "text-muted"}>{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-center" style={{color:"#94a3b8"}}>
            Comparatif indicatif basé sur les fonctionnalités publiquement visibles au moment de l’analyse. Données susceptibles d’évoluer.
          </p>
        </div>
      </section>

      {/* USE CASES */}
      <section id="temoignages" className="bg-[#fefcf7] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Cas d&apos;usage</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Pourquoi les artisans l&apos;utilisent.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {useCases.map((uc) => (
              <article key={uc.role} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-7 shadow-sm">
                <BookOpenText aria-hidden className="h-8 w-8 text-accent/30" />
                <p className="flex-1 text-sm leading-relaxed text-muted">{uc.text}</p>
                <div>
                  <p className="mt-2 font-bold text-foreground text-sm">{uc.role}</p>
                </div>
              </article>
            ))}
          </div>
          {/* Trust logos strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["Chorus Pro", "Factur-X EN 16931", "RGPD UE", "AWS eu-west-2"].map((logo) => (
              <span key={logo} className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COCKPIT */}
      <section className="bg-[#1e3a5a] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-accent/80">Le cockpit</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Votre activité, lisible en un coup d&apos;œil.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/65">
              Le tableau de bord affiche les devis à relancer, les brouillons incomplets, les
              montants acceptés et votre marge moyenne du mois.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Montant devisé, accepté et facturé",
                "Taux d’acceptation et marge moyenne",
                "Devis expirés, à relancer, à compléter",
                "Factures en retard et encaissements",
                "Graphique chiffre d’affaires 12 mois",
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
                { label: "Montant accepté", value: "18 640 €" },
                { label: "Marge moyenne", value: "41 %" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-slate-200">
              {[
                { ref: "DEV-2026-0042", title: "Salle de bain — IA", badge: "Signé ✓", color: "green" },
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
                      row.color === "green" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
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
            Commencez gratuitement. L&apos;assistant IA est inclus dès le plan Solo.
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
                  <span className="text-3xl font-black tabular-nums text-foreground">{plan.price}</span>
                  {plan.period ? <span className="text-sm text-muted">{plan.period}</span> : null}
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
        <div className="relative overflow-hidden rounded-2xl bg-[#0f1f31] p-10 text-white shadow-2xl sm:p-14">
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
              Prêt à essayer le devis BTP avec IA ?
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/65">
              Décrivez votre premier chantier, laissez l&apos;IA générer les lignes, ajustez et
              envoyez. En moins de 5 minutes. Gratuit pour commencer.
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

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-950">
          <p>
            <strong>Avertissement :</strong> ChantierDevis est un outil d&apos;aide à la création de
            devis. Il ne remplace pas un expert-comptable, un avocat, une fédération professionnelle
            ou un conseil juridique personnalisé. Les prix générés par l&apos;IA sont indicatifs.
          </p>
        </div>

        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-label="Liens légaux">
          <Link href="/legal/mentions-legales" className="hover:text-primary hover:underline">Mentions légales</Link>
          <Link href="/legal/confidentialite" className="hover:text-primary hover:underline">Confidentialité</Link>
          <Link href="/legal/cgv" className="hover:text-primary hover:underline">CGV</Link>
          <Link href="/legal/rgpd" className="hover:text-primary hover:underline">RGPD</Link>
          <span className="ml-auto text-muted/60">© 2026 ChantierDevis</span>
        </nav>
      </section>
    </main>
  );
}
