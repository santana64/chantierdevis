import { Building2, Lock } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/server/auth-actions";
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/lib/auth";
import { Button, Field, inputClass } from "@/components/ui";

function message(error?: string) {
  if (error === "credentials") return "Email ou mot de passe incorrect.";
  if (error === "invalid") return "Formulaire invalide.";
  if (error === "locked") return "Trop de tentatives. Réessayez dans quelques minutes.";
  return null;
}

function successMessage(reset?: string | string[]) {
  const value = Array.isArray(reset) ? reset[0] : reset;
  if (value === "success") return "Mot de passe modifié. Vous pouvez vous connecter.";
  return null;
}

function verificationMessage(verify?: string | string[]) {
  const value = Array.isArray(verify) ? verify[0] : verify;
  if (value === "success") return "Email vérifié. Vous pouvez vous connecter.";
  return null;
}

function verificationError(verify?: string | string[]) {
  const value = Array.isArray(verify) ? verify[0] : verify;
  if (value === "invalid") return "Lien de vérification invalide, expiré ou déjà utilisé.";
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next ?? "/app";
  const error =
    message(Array.isArray(params.error) ? params.error[0] : params.error) ??
    verificationError(params.verify);
  const success = successMessage(params.reset) ?? verificationMessage(params.verify);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8">
              <Lock aria-hidden className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Connexion</h1>
              <p className="text-sm text-muted">Accédez à votre cockpit devis.</p>
            </div>
          </div>

          {/* Alerts */}
          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
          ) : null}

          {/* Form */}
          <form action={loginAction} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
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
            <Field label="Mot de passe">
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                required
              />
            </Field>
            <Button type="submit" size="lg" className="mt-1 w-full">
              Se connecter
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 rounded-xl border border-border bg-slate-50 px-4 py-3 text-xs text-muted">
            <p className="font-semibold text-foreground">Compte de démonstration</p>
            <p className="mt-1">
              {DEMO_USER_EMAIL} · {DEMO_USER_PASSWORD}
            </p>
          </div>

          {/* Links */}
          <div className="mt-5 space-y-2.5 text-sm text-muted">
            <p>
              Pas encore de compte ?{" "}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="font-semibold text-primary underline underline-offset-4"
              >
                Créer un compte
              </Link>
            </p>
            <p>
              Mot de passe oublié ?{" "}
              <Link
                href="/forgot-password"
                className="font-semibold text-primary underline underline-offset-4"
              >
                Réinitialiser
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted/70">
          En vous connectant, vous acceptez nos{" "}
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
