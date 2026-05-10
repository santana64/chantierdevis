import { Copy, LibraryBig, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button, Card, CardHeader, EmptyState, Field, LinkButton, inputClass } from "@/components/ui";
import { formatMoney } from "@/domain/quotes";
import {
  createWorkItemAction,
  deleteWorkItemAction,
  duplicateWorkItemAction,
  updateWorkItemAction,
} from "@/server/actions";
import { getWorkItemsData } from "@/server/queries";

export const dynamic = "force-dynamic";

const trades = ["ALL", "PLUMBING", "ELECTRICITY", "PAINTING", "MASONRY", "ROOFING", "CARPENTRY", "TILING", "HEATING", "INSULATION", "GENERAL_RENOVATION", "OTHER"];
const tradeLabels: Record<string, string> = {
  ALL: "Tous métiers",
  PLUMBING: "Plomberie",
  ELECTRICITY: "Électricité",
  PAINTING: "Peinture",
  MASONRY: "Maçonnerie",
  ROOFING: "Couverture",
  CARPENTRY: "Menuiserie",
  TILING: "Carrelage",
  HEATING: "Chauffage",
  INSULATION: "Isolation",
  GENERAL_RENOVATION: "Rénovation générale",
  OTHER: "Autre",
};
const units = ["UNIT", "HOUR", "DAY", "M2", "M3", "ML", "PACKAGE"];
const unitLabels: Record<string, string> = {
  UNIT: "Unité",
  HOUR: "Heure",
  DAY: "Jour",
  M2: "m²",
  M3: "m³",
  ML: "ml",
  PACKAGE: "Forfait",
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] : entry ?? "";
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = { q: value(params, "q"), trade: value(params, "trade") };
  const { workItems } = await getWorkItemsData(filters);

  return (
    <>
      <PageHeader
        title="Bibliothèque d'ouvrages"
        description="Préparez vos prestations réutilisables avec prix, coût, TVA et description chantier."
        action={<LinkButton href="/app/quotes/new">Utiliser dans un devis</LinkButton>}
      />

      {params.error === "item-used" ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Cet ouvrage est déjà utilisé dans un devis. Dupliquez-le ou modifiez-le au lieu de le supprimer.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Créer un ouvrage" />
          <form action={createWorkItemAction} className="grid gap-4 p-5">
            <Field label="Titre">
              <input className={inputClass} name="title" required placeholder="Pose WC suspendu" />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} name="description" rows={4} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Métier">
                <select className={inputClass} name="trade" defaultValue="GENERAL_RENOVATION">
                  {trades.filter((trade) => trade !== "ALL").map((trade) => (
                    <option key={trade} value={trade}>{tradeLabels[trade]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Unité">
                <select className={inputClass} name="unit" defaultValue="PACKAGE">
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unitLabels[unit]}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prix unitaire HT (€)">
                <input className={inputClass} name="defaultUnitPrice" inputMode="decimal" required />
              </Field>
              <Field label="Coût HT (€)">
                <input className={inputClass} name="defaultCost" inputMode="decimal" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="TVA (%)">
                <select className={inputClass} name="defaultVatRate" defaultValue="20">
                  {[0, 5.5, 10, 20].map((rate) => (
                    <option key={rate} value={rate}>{rate} %</option>
                  ))}
                </select>
              </Field>
              <Field label="Heures par défaut">
                <input className={inputClass} name="defaultLaborHours" inputMode="decimal" />
              </Field>
            </div>
            <Field label="Notes internes">
              <textarea className={inputClass} name="notes" rows={3} />
            </Field>
            <Button type="submit">
              <LibraryBig aria-hidden className="h-4 w-4" />
              Créer l&apos;ouvrage
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <label className="relative">
                <span className="sr-only">Recherche</span>
                <Search aria-hidden className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input className={`${inputClass} w-full pl-9`} name="q" defaultValue={filters.q} placeholder="Rechercher un ouvrage" />
              </label>
              <select className={inputClass} name="trade" defaultValue={filters.trade || "ALL"} aria-label="Métier">
                {trades.map((trade) => (
                  <option key={trade} value={trade}>{tradeLabels[trade]}</option>
                ))}
              </select>
              <Button type="submit" variant="secondary">Filtrer</Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Ouvrages enregistrés" />
            <div className="divide-y divide-border">
              {workItems.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="Aucun ouvrage" description="Créez vos premières prestations réutilisables pour accélérer la saisie des devis." />
                </div>
              ) : null}
              {workItems.map((item) => (
                <details key={item.id} className="group p-5">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="font-semibold text-primary">{item.title}</h2>
                        <p className="mt-1 text-sm text-muted">{tradeLabels[item.trade]} · {unitLabels[item.unit]} · utilisé {item._count.quoteLines} fois</p>
                        <p className="mt-2 max-w-2xl text-sm text-slate-700">{item.description}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm lg:min-w-[360px]">
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs text-muted">Prix HT</p>
                          <p className="font-bold">{formatMoney(item.defaultUnitPriceCents)}</p>
                        </div>
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs text-muted">Coût HT</p>
                          <p className="font-bold">{formatMoney(item.defaultCostCents)}</p>
                        </div>
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs text-muted">TVA</p>
                          <p className="font-bold">{Number(item.defaultVatRate).toLocaleString("fr-FR")} %</p>
                        </div>
                      </div>
                    </div>
                  </summary>
                  <form action={updateWorkItemAction.bind(null, item.id)} className="mt-5 grid gap-4 rounded-lg bg-white p-4 md:grid-cols-2">
                    <Field label="Titre">
                      <input className={inputClass} name="title" defaultValue={item.title} required />
                    </Field>
                    <Field label="Métier">
                      <select className={inputClass} name="trade" defaultValue={item.trade}>
                        {trades.filter((trade) => trade !== "ALL").map((trade) => (
                          <option key={trade} value={trade}>{tradeLabels[trade]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Description">
                      <textarea className={inputClass} name="description" rows={4} defaultValue={item.description} required />
                    </Field>
                    <div className="grid gap-4">
                      <Field label="Unité">
                        <select className={inputClass} name="unit" defaultValue={item.unit}>
                          {units.map((unit) => (
                            <option key={unit} value={unit}>{unitLabels[unit]}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Heures par défaut">
                        <input className={inputClass} name="defaultLaborHours" defaultValue={item.defaultLaborHours ? String(item.defaultLaborHours) : ""} />
                      </Field>
                    </div>
                    <Field label="Prix unitaire HT (€)">
                      <input className={inputClass} name="defaultUnitPrice" defaultValue={(item.defaultUnitPriceCents / 100).toFixed(2)} />
                    </Field>
                    <Field label="Coût HT (€)">
                      <input className={inputClass} name="defaultCost" defaultValue={(item.defaultCostCents / 100).toFixed(2)} />
                    </Field>
                    <Field label="TVA (%)">
                      <select className={inputClass} name="defaultVatRate" defaultValue={String(item.defaultVatRate)}>
                        {[0, 5.5, 10, 20].map((rate) => (
                          <option key={rate} value={rate}>{rate} %</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Notes">
                      <textarea className={inputClass} name="notes" rows={3} defaultValue={item.notes ?? ""} />
                    </Field>
                    <div className="md:col-span-2">
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={duplicateWorkItemAction.bind(null, item.id)}>
                      <Button type="submit" variant="secondary">
                        <Copy aria-hidden className="h-4 w-4" />
                        Dupliquer
                      </Button>
                    </form>
                    <form action={deleteWorkItemAction.bind(null, item.id)}>
                      <Button type="submit" variant="danger" disabled={item._count.quoteLines > 0}>
                        <Trash2 aria-hidden className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </form>
                  </div>
                </details>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
