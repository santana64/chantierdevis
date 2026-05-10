import { PageHeader } from "@/components/app-shell";
import { Button, Card, CardHeader, Field, LegalDisclaimer, SectionDivider, inputClass } from "@/components/ui";
import { saveCompanyProfileAction } from "@/server/actions";
import { getAppContext } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { company } = await getAppContext();

  return (
    <>
      <PageHeader
        title="Paramètres entreprise"
        description="Ces informations alimentent les devis, la conformité, la TVA et le pied de document."
      />
      {params.saved ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
          Profil entreprise enregistré avec succès.
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Profil et documents"
          description="Renseignez les informations qui apparaîtront sur vos devis et factures."
        />
        <form action={saveCompanyProfileAction} className="divide-y divide-border">
          {/* Identité */}
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="md:col-span-3">
              <SectionDivider label="Identité légale" />
            </div>
            <Field label="Nom entreprise">
              <input
                className={inputClass}
                name="companyName"
                defaultValue={company?.companyName ?? ""}
                required
              />
            </Field>
            <Field label="Forme juridique">
              <input
                className={inputClass}
                name="legalForm"
                defaultValue={company?.legalForm ?? ""}
                placeholder="EI, SASU, SARL…"
              />
            </Field>
            <Field label="Nom du dirigeant">
              <input
                className={inputClass}
                name="ownerName"
                defaultValue={company?.ownerName ?? ""}
              />
            </Field>
            <Field label="SIRET">
              <input
                className={inputClass}
                name="siret"
                defaultValue={company?.siret ?? ""}
                placeholder="14 chiffres"
              />
            </Field>
            <Field label="SIREN">
              <input
                className={inputClass}
                name="siren"
                defaultValue={company?.siren ?? ""}
                placeholder="9 chiffres"
              />
            </Field>
            <Field label="N° TVA intracommunautaire">
              <input
                className={inputClass}
                name="vatNumber"
                defaultValue={company?.vatNumber ?? ""}
                placeholder="FR…"
              />
            </Field>
            <Field label="Régime TVA">
              <select
                className={inputClass}
                name="vatMode"
                defaultValue={company?.vatMode ?? "STANDARD"}
              >
                <option value="STANDARD">TVA standard</option>
                <option value="FRANCHISE_BASE">Franchise en base de TVA (art. 293 B du CGI)</option>
              </select>
            </Field>
          </div>

          {/* Coordonnées */}
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="md:col-span-3">
              <SectionDivider label="Coordonnées" />
            </div>
            <Field label="Adresse">
              <input
                className={inputClass}
                name="address"
                defaultValue={company?.address ?? ""}
                required
              />
            </Field>
            <Field label="Code postal">
              <input
                className={inputClass}
                name="postalCode"
                defaultValue={company?.postalCode ?? ""}
                required
              />
            </Field>
            <Field label="Ville">
              <input
                className={inputClass}
                name="city"
                defaultValue={company?.city ?? ""}
                required
              />
            </Field>
            <Field label="Téléphone">
              <input
                className={inputClass}
                name="phone"
                defaultValue={company?.phone ?? ""}
                placeholder="06 00 00 00 00"
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                name="email"
                defaultValue={company?.email ?? ""}
              />
            </Field>
            <Field label="Site web">
              <input
                className={inputClass}
                name="website"
                defaultValue={company?.website ?? ""}
                placeholder="https://…"
              />
            </Field>
          </div>

          {/* Assurance */}
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="md:col-span-3">
              <SectionDivider label="Assurance décennale" />
            </div>
            <Field label="Assureur">
              <input
                className={inputClass}
                name="insuranceProvider"
                defaultValue={company?.insuranceProvider ?? ""}
              />
            </Field>
            <Field label="N° de police">
              <input
                className={inputClass}
                name="insurancePolicyNumber"
                defaultValue={company?.insurancePolicyNumber ?? ""}
              />
            </Field>
            <Field label="Mention décennale" hint="Texte affiché sur les devis si requis.">
              <textarea
                className={inputClass}
                name="decennaleMention"
                rows={3}
                defaultValue={company?.decennaleMention ?? ""}
              />
            </Field>
          </div>

          {/* Documents */}
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="md:col-span-3">
              <SectionDivider label="Documents et conditions" />
            </div>
            <Field
              label="Conditions de paiement par défaut"
              hint="Texte pré-rempli sur les nouveaux devis."
            >
              <textarea
                className={inputClass}
                name="defaultPaymentTerms"
                rows={4}
                defaultValue={
                  company?.defaultPaymentTerms ??
                  "Acompte de 30 % à la signature, solde à réception des travaux."
                }
                required
              />
            </Field>
            <div className="grid gap-4 content-start">
              <Field label="Validité devis par défaut (jours)">
                <input
                  className={inputClass}
                  type="number"
                  name="defaultQuoteValidityDays"
                  min="1"
                  max="365"
                  defaultValue={company?.defaultQuoteValidityDays ?? 30}
                />
              </Field>
              <Field label="Acompte par défaut (%)">
                <input
                  className={inputClass}
                  type="number"
                  name="defaultDepositPercent"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={
                    company?.defaultDepositPercent ? String(company.defaultDepositPercent) : "30"
                  }
                />
              </Field>
            </div>
            <Field label="Signature par défaut">
              <textarea
                className={inputClass}
                name="defaultSignature"
                rows={4}
                defaultValue={company?.defaultSignature ?? ""}
              />
            </Field>
            <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted md:col-span-2">
              <p className="font-semibold text-foreground">Logo</p>
              <p className="mt-1">
                La personnalisation du logo n&apos;est pas activée dans cette version. Les documents
                utilisent l&apos;identité entreprise renseignée ci-dessus.
              </p>
            </div>
            <Field label="Pied de document">
              <textarea
                className={inputClass}
                name="documentFooterText"
                rows={4}
                defaultValue={company?.documentFooterText ?? ""}
              />
            </Field>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-4 p-6">
            <LegalDisclaimer>
              ChantierDevis est un outil d&apos;aide à la création de devis. Il ne remplace pas un
              expert-comptable, un avocat, une fédération professionnelle ou un conseil juridique
              personnalisé.
            </LegalDisclaimer>
            <div>
              <Button type="submit">Enregistrer les paramètres</Button>
            </div>
          </div>
        </form>
      </Card>
    </>
  );
}
