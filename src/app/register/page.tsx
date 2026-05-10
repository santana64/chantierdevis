import { Building2, CheckCircle2, UserPlus } from "lucide-react";
import Link from "next/link";
import { registerAction } from "@/server/auth-actions";
import { Button, Field, inputClass } from "@/components/ui";

function message(error?: string) {
  if (error === "exists") return "Un compte existe déjà avec cet email.";
  if (error === "invalid")
    return "Renseignez un nom, un email valide et un mot de passe de 10 caractères minimum.";
  if (error === "locked") return "Trop de tentatives. Réessayez dans quelques minutes.";
  return null;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next ?? "/app";
  const error = message(Array.isArray(params.error) ? params.error[0] : params.error);

  return (
    <main className="grid min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-sm self-center">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2.5 font-bold text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Building2 aria-hidden className="h-4 w-4 text-white" />
          </div>
          ChantierDevis
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <UserPlus aria-hidden className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Créer un compte</h1>
              <p className="text-sm text-muted">Gratuit, sans carte bancaire.</p>
            </div>
          </div>

          {/* Alert */}
          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {/* Form */}
          <form action={registerAction} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <Field label="Nom">
              <input
                className={inputClass}
                name="name"
                autoComplete="name"
                placeholder="Jean Dupont"
                required
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.fr"
                required
              />
            </Field>
            <Field label="Mot de passe" hint="10 caractères minimum.">
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••"
                minLength={10}
                required
              />
            </Field>
            <Button type="submit" size="lg" className="mt-1 w-full">
              Créer mon compte
            </Button>
          </form>

          {/* Link */}
          <p className="mt-5 text-sm text-muted">
            Déjà inscrit ?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="font-semibold text-primary underline underline-offset-4"
            >
              Se connecter
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <ul className="mt-6 space-y-2">
          {[
            "1 client + 1 devis gratuit sans carte",
            "IA générative pour vos lignes de prestations",
            "Marge, conformité et signature électronique inclus",
            "Export Factur-X EN 16931 (obligation 2026)",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted">
              <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0 text-green-500" />
              {item}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted/70">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/legal/cgv" className="underline hover:text-muted">
            CGV
          </Link>{" "}
          et notre{" "}
          <Link href="/legal/confidentialite" className="underline hover:text-muted">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
