import { ArrowRight, CheckCircle2, Hammer, Lock, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalCurrentUser } from "@/lib/auth";
import { registerAction } from "@/server/auth-actions";
import { Button, Field, inputClass } from "@/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte gratuit — ChantierDevis",
  description: "Créez votre compte gratuit ChantierDevis. Devis BTP par IA, marge visible, signature en ligne. Sans carte bancaire.",
};

function message(error?: string) {
  if (error === "exists") return "Un compte existe déjà avec cet email.";
  if (error === "invalid")
    return "Renseignez un nom, un email valide et un mot de passe de 8 caractères minimum.";
  if (error === "locked") return "Trop de tentatives. Réessayez dans quelques minutes.";
  return null;
}

const PREVIEW_LINES = [
  { label: "Pose carrelage sol 8 m²", total: "440 €", margin: "41 %" },
  { label: "WC suspendu bâti-support", total: "480 €", margin: "35 %" },
  { label: "Main-d'œuvre qualifiée", total: "1 080 €", margin: "52 %" },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const existing = await getOptionalCurrentUser();
  if (existing) redirect("/app");

  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next ?? "/app";
  const error = message(Array.isArray(params.error) ? params.error[0] : params.error);

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      {/* Nav minimaliste */}
      <header className="border-b border-white/10 bg-[#0f1f31]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <Hammer aria-hidden className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black tracking-tight">ChantierDevis</span>
          </Link>
          <span className="text-xs text-white/50">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-white/80 underline underline-offset-2">
              Se connecter
            </Link>
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-16 lg:py-16">

        {/* Colonne gauche — aperçu du produit */}
        <div className="order-2 lg:order-1">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles aria-hidden className="h-3 w-3" />
              Voici ce que vous allez créer en 2 minutes
            </div>
            <h2 className="text-2xl font-bold text-[#0f1f31]">Un devis pro, rentable, prêt à signer</h2>
            <p className="mt-2 text-sm text-muted">
              Décrivez le chantier en langage naturel — l&apos;IA génère les lignes, les prix et les marges.
            </p>
          </div>

          {/* Mini aperçu devis */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-border bg-[#0f1f31] px-4 py-2.5 text-white">
              <span className="text-sm font-bold">DEV-2026-0043 — Rénovation salle de bain</span>
              <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
                <Sparkles aria-hidden className="h-2.5 w-2.5" /> IA
              </span>
            </div>
            <div className="border-b border-border bg-accent/5 px-4 py-2">
              <p className="text-xs italic text-muted">&ldquo;Rénovation salle de bain 8m², carrelage + WC + main-d&apos;œuvre&rdquo;</p>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2">Prestation</th>
                  <th className="px-3 py-2 text-right">Total HT</th>
                  <th className="px-3 py-2 text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {PREVIEW_LINES.map((line) => (
                  <tr key={line.label} className="border-t border-border">
                    <td className="px-4 py-2 font-medium text-foreground">{line.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{line.total}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">{line.margin}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border bg-slate-50 px-4 py-2.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                <TrendingUp aria-hidden className="h-3 w-3" />
                Marge brute estimée
              </span>
              <span className="text-base font-black text-green-600">41,2 %</span>
            </div>
          </div>

          {/* Garanties */}
          <ul className="mt-5 space-y-2">
            {[
              "1 client + 1 devis gratuit, sans carte bancaire",
              "L'IA génère vos lignes de prestations en 30 secondes",
              "Marge visible sur chaque ligne avant d'envoyer",
              "Le client signe directement depuis son téléphone",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-green-500" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-1.5 text-xs text-muted/70">
            <Lock aria-hidden className="h-3 w-3" />
            Données hébergées en France · Connexion sécurisée HTTPS
          </div>
        </div>

        {/* Colonne droite — formulaire */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h1 className="mb-1 text-2xl font-bold text-foreground">Créer mon compte gratuit</h1>
            <p className="mb-6 text-sm text-muted">Sans carte bancaire · Accès immédiat · Annulez quand vous voulez</p>

            {error ? (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <form action={registerAction} className="grid gap-4">
              <input type="hidden" name="next" value={next} />
              <Field label="Votre nom ou raison sociale">
                <input
                  className={inputClass}
                  name="name"
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  required
                />
              </Field>
              <Field label="Email professionnel">
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.fr"
                  required
                />
              </Field>
              <Field label="Mot de passe" hint="8 caractères minimum.">
                <input
                  className={inputClass}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full">
                Créer mon compte — c&apos;est gratuit
                <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted/70">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/legal/cgv" className="underline hover:text-muted">CGV</Link>{" "}
              et notre{" "}
              <Link href="/legal/confidentialite" className="underline hover:text-muted">politique de confidentialité</Link>.
            </p>
          </div>

          {/* Social proof */}
          <div className="mt-4 rounded-xl border border-border bg-white/60 px-5 py-4">
            <div className="flex items-center gap-0.5 mb-2">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.062 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>
              ))}
            </div>
            <p className="text-sm text-foreground/80 italic">
              &ldquo;Je passais 1h sur chaque devis. Maintenant je le fais en 5 minutes depuis mon camion — et je sais si le chantier est rentable avant d&apos;envoyer.&rdquo;
            </p>
            <p className="mt-2 text-xs text-muted">— Plombier indépendant, 12 ans d&apos;expérience</p>
          </div>
        </div>

      </div>
    </main>
  );
}
