import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { requestPasswordResetAction } from "@/server/auth-actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sent = Boolean(params.sent);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-bold text-primary">
          <Building2 aria-hidden className="h-5 w-5" />
          ChantierDevis
        </Link>
        <h1 className="text-2xl font-bold">Réinitialiser le mot de passe</h1>
        <p className="mt-2 text-sm text-muted">
          Entrez votre email. Si un compte existe, un lien sécurisé valable 1 heure sera envoyé.
        </p>
        {sent ? (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Si un compte correspond à cet email, les instructions viennent d&apos;être envoyées.
          </p>
        ) : null}
        <form action={requestPasswordResetAction} className="mt-6 grid gap-4">
          <Field label="Email">
            <input className={inputClass} name="email" type="email" autoComplete="email" required />
          </Field>
          <Button type="submit">Envoyer le lien</Button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Vous connaissez votre mot de passe ?{" "}
          <Link href="/login" className="font-semibold text-primary underline">
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
}
