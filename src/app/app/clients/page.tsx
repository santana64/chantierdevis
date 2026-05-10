import { Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { Button, Card, CardHeader, EmptyState, Field, SuccessNotice, inputClass } from "@/components/ui";
import { formatMoney, formatShortFrenchDate } from "@/domain/quotes";
import { createClientAction, deleteClientAction, updateClientAction } from "@/server/actions";
import { getClientsData } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const saved = Array.isArray(params.saved) ? params.saved[0] : params.saved;
  const deleted = Array.isArray(params.deleted) ? params.deleted[0] : params.deleted;
  const { clients } = await getClientsData(q);

  return (
    <>
      <PageHeader
        title="Clients"
        description="Gérez les coordonnées de facturation et les adresses chantier par défaut."
        action={
          <form className="relative">
            <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Nom, société, email, ville…"
              className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 sm:w-64"
            />
          </form>
        }
      />

      {saved ? (
        <div className="mb-5">
          <SuccessNotice>Client enregistré avec succès.</SuccessNotice>
        </div>
      ) : null}
      {deleted ? (
        <div className="mb-5">
          <SuccessNotice>Client supprimé.</SuccessNotice>
        </div>
      ) : null}
      {q ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
          {clients.length} résultat{clients.length !== 1 ? "s" : ""} pour «{q}» ·{" "}
          <Link href="/app/clients" className="font-semibold underline underline-offset-4">
            Voir tous les clients
          </Link>
        </div>
      ) : null}

      {params.error === "client-used" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Ce client est lié à des devis. Supprimez ou archivez les devis concernés avant
          suppression.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        {/* Create form */}
        <Card>
          <CardHeader title="Nouveau client" />
          <form action={createClientAction} className="grid gap-4 p-6">
            <Field label="Type">
              <select className={inputClass} name="type" defaultValue="INDIVIDUAL">
                <option value="INDIVIDUAL">Particulier</option>
                <option value="PROFESSIONAL">Professionnel</option>
              </select>
            </Field>
            <Field label="Nom">
              <input className={inputClass} name="name" required />
            </Field>
            <Field label="Société">
              <input className={inputClass} name="companyName" placeholder="Facultatif" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input className={inputClass} name="email" type="email" />
              </Field>
              <Field label="Téléphone">
                <input className={inputClass} name="phone" placeholder="06 00 00 00 00" />
              </Field>
            </div>
            <Field label="Adresse de facturation">
              <input className={inputClass} name="billingAddress" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code postal">
                <input className={inputClass} name="billingPostalCode" required />
              </Field>
              <Field label="Ville">
                <input className={inputClass} name="billingCity" required />
              </Field>
            </div>
            <Field label="Adresse chantier par défaut" hint="Pré-remplie lors de la création de devis.">
              <input className={inputClass} name="defaultWorkSiteAddress" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CP chantier">
                <input className={inputClass} name="defaultWorkSitePostalCode" />
              </Field>
              <Field label="Ville chantier">
                <input className={inputClass} name="defaultWorkSiteCity" />
              </Field>
            </div>
            <Field label="Notes internes">
              <textarea className={inputClass} name="notes" rows={3} />
            </Field>
            <Button type="submit">Créer le client</Button>
          </form>
        </Card>

        {/* Clients list */}
        <Card>
          <CardHeader
            title="Portefeuille clients"
            description="Statistiques calculées depuis les devis enregistrés."
          />
          <div className="divide-y divide-border">
            {clients.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Aucun client"
                  description="Ajoutez un premier client pour accélérer la création de devis."
                  icon={<Users className="h-6 w-6" />}
                />
              </div>
            ) : null}
            {clients.map((client) => {
              const acceptedQuotes = client.quotes.filter((quote) => quote.status === "ACCEPTED");
              const totalAccepted = acceptedQuotes.reduce(
                (sum, quote) => sum + quote.totalTtcCents,
                0,
              );
              const totalInvoiced = client.invoices
                .filter((inv) => inv.status !== "CANCELLED")
                .reduce((sum, inv) => sum + inv.totalTtcCents, 0);
              const lastQuote = client.quotes[0];
              return (
                <details key={client.id} className="group">
                  <summary className="cursor-pointer list-none px-6 py-5 transition hover:bg-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-primary">
                            {client.companyName || client.name}
                          </h2>
                          {client.type === "PROFESSIONAL" ? (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              Pro
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-muted">
                          {client.billingAddress}, {client.billingPostalCode} {client.billingCity}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          {client.email || "Email non renseigné"} ·{" "}
                          {client.phone || "Téléphone non renseigné"}
                        </p>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center lg:min-w-[540px]">
                        {[
                          { label: "Devis", value: `${client.quotes.length}` },
                          { label: "Acceptés", value: `${acceptedQuotes.length}` },
                          {
                            label: "Dernier devis",
                            value: lastQuote ? formatShortFrenchDate(lastQuote.issueDate) : "—",
                          },
                          { label: "CA accepté", value: formatMoney(totalAccepted) },
                          { label: "Facturé", value: formatMoney(totalInvoiced), highlight: totalInvoiced > 0 },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className={`rounded-xl border p-3 ${"highlight" in stat && stat.highlight ? "border-green-200 bg-green-50" : "border-border bg-white"}`}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                              {stat.label}
                            </p>
                            <p className={`mt-1 text-sm font-bold tabular-nums ${"highlight" in stat && stat.highlight ? "text-green-700" : "text-foreground"}`}>
                              {stat.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </summary>

                  {/* Edit form */}
                  <form
                    action={updateClientAction.bind(null, client.id)}
                    className="mx-6 mb-5 mt-3 grid gap-4 rounded-xl border border-border bg-white p-5 md:grid-cols-2"
                  >
                    <Field label="Type">
                      <select className={inputClass} name="type" defaultValue={client.type}>
                        <option value="INDIVIDUAL">Particulier</option>
                        <option value="PROFESSIONAL">Professionnel</option>
                      </select>
                    </Field>
                    <Field label="Nom">
                      <input className={inputClass} name="name" defaultValue={client.name} required />
                    </Field>
                    <Field label="Société">
                      <input
                        className={inputClass}
                        name="companyName"
                        defaultValue={client.companyName ?? ""}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        className={inputClass}
                        name="email"
                        defaultValue={client.email ?? ""}
                        type="email"
                      />
                    </Field>
                    <Field label="Téléphone">
                      <input
                        className={inputClass}
                        name="phone"
                        defaultValue={client.phone ?? ""}
                      />
                    </Field>
                    <Field label="Adresse facturation">
                      <input
                        className={inputClass}
                        name="billingAddress"
                        defaultValue={client.billingAddress}
                        required
                      />
                    </Field>
                    <Field label="Code postal">
                      <input
                        className={inputClass}
                        name="billingPostalCode"
                        defaultValue={client.billingPostalCode}
                        required
                      />
                    </Field>
                    <Field label="Ville">
                      <input
                        className={inputClass}
                        name="billingCity"
                        defaultValue={client.billingCity}
                        required
                      />
                    </Field>
                    <Field label="Adresse chantier par défaut">
                      <input
                        className={inputClass}
                        name="defaultWorkSiteAddress"
                        defaultValue={client.defaultWorkSiteAddress ?? ""}
                      />
                    </Field>
                    <Field label="Code postal chantier">
                      <input
                        className={inputClass}
                        name="defaultWorkSitePostalCode"
                        defaultValue={client.defaultWorkSitePostalCode ?? ""}
                      />
                    </Field>
                    <Field label="Ville chantier">
                      <input
                        className={inputClass}
                        name="defaultWorkSiteCity"
                        defaultValue={client.defaultWorkSiteCity ?? ""}
                      />
                    </Field>
                    <Field label="Notes internes">
                      <textarea
                        className={inputClass}
                        name="notes"
                        rows={3}
                        defaultValue={client.notes ?? ""}
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <Button type="submit">Enregistrer</Button>
                      <Link
                        href={`/app/quotes?client=${client.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-white"
                      >
                        Voir les devis
                      </Link>
                      <Link
                        href={`/app/invoices?client=${client.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-white"
                      >
                        Voir les factures
                      </Link>
                    </div>
                  </form>
                  <form
                    action={deleteClientAction.bind(null, client.id)}
                    className="mx-6 mb-5"
                  >
                    <Button type="submit" variant="danger" size="sm">
                      <Trash2 aria-hidden className="h-3.5 w-3.5" />
                      Supprimer si inutilisé
                    </Button>
                  </form>
                </details>
              );
            })}
          </div>
        </Card>
      </section>
    </>
  );
}
