import { PageHeader } from "@/components/app-shell";
import { Button, Card, CardHeader, Field, LinkButton, inputClass } from "@/components/ui";
import { deleteAccountAction, requestDataExportAction } from "@/server/data-actions";

export const dynamic = "force-dynamic";

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        title="Données et RGPD"
        description="Exportez vos données, gérez vos demandes et supprimez votre compte."
      />

      {params.error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Impossible de traiter la demande : vérifiez le mot de passe et la confirmation.
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Export des données" description="Télécharge un fichier JSON contenant vos clients, devis, factures, documents et relances." />
          <div className="space-y-4 p-5">
            <form action={requestDataExportAction}>
              <Button type="submit">Préparer et télécharger l&apos;export</Button>
            </form>
            <LinkButton href="/app/data/export" variant="secondary">Télécharger directement</LinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="Suppression du compte" description="Suppression définitive du compte et des données associées." />
          <form action={deleteAccountAction} className="grid gap-4 p-5">
            <Field label="Mot de passe">
              <input className={inputClass} name="password" type="password" required />
            </Field>
            <Field label="Confirmation" hint='Tapez exactement "SUPPRIMER".'>
              <input className={inputClass} name="confirmation" required />
            </Field>
            <Button type="submit" variant="danger">Supprimer définitivement</Button>
          </form>
        </Card>
      </section>
    </>
  );
}
