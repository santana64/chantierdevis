import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { resetPasswordAction } from "@/server/auth-actions";

function message(error?: string | string[]) {
  const value = Array.isArray(error) ? error[0] : error;
  if (value === "invalid") return "Lien invalide, expiré ou déjà utilisé.";
  if (value === "locked") return "Trop de tentatives. Réessayez dans quelques minutes.";
  return null;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const error = message(params.error);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-bold text-primary">
          <Building2 aria-hidden className="h-5 w-5" />
          ChantierDevis
        </Link>
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-muted">Choisissez un mot de passe solide pour récupérer l&apos;accès à votre compte.</p>
        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
        ) : null}
        {!token ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Le lien de réinitialisation est manquant.
          </p>
        ) : (
          <form action={resetPasswordAction} className="mt-6 grid gap-4">
            <input type="hidden" name="token" value={token} />
            <Field label="Nouveau mot de passe" hint="10 caractères minimum.">
              <input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={10} required />
            </Field>
            <Button type="submit">Modifier le mot de passe</Button>
          </form>
        )}
        <p className="mt-5 text-sm text-muted">
          Besoin d&apos;un nouveau lien ?{" "}
          <Link href="/forgot-password" className="font-semibold text-primary underline">
            Recommencer
          </Link>
        </p>
      </section>
    </main>
  );
}
