import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button, Card, CardHeader, Field, LegalDisclaimer, SectionDivider, inputClass } from "@/components/ui";
import { saveCompanyProfileAction } from "@/server/actions";
import { updateAccountAction } from "@/server/auth-actions";
import { getAppContext } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { user, company } = await getAppContext();

  const completionChecks = [
    { label: "Nom entreprise", done: !!company?.companyName },
    { label: "Adresse complète", done: !!(company?.address && company?.postalCode && company?.city) },
    { label: "SIRET", done: !!company?.siret },
    { label: "Téléphone ou email", done: !!(company?.phone || company?.email) },
    { label: "Assurance décennale", done: !!(company?.insuranceProvider && company?.insurancePolicyNumber) },
  ];
  const completionPct = Math.round((completionChecks.filter((c) => c.done).length / completionChecks.length) * 100);

  return (
    <>
      <PageHeader
        title="Paramètres entreprise"
        description="Ces informations alimentent les devis, la conformité, la TVA et le pied de document."
      />
      {/* Profile completion */}
      {completionPct < 100 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-900">
                Profil complété à {completionPct} %
              </p>
            </div>
            <div className="shrink-0 text-xs font-semibold text-amber-700">
              {completionChecks.filter((c) => c.done).length}/{completionChecks.length}
            </div>
          </div>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {completionChecks.map((check) => (
              <span
                key={check.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  check.done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
                }`}
              >
                <CheckCircle2 className={`h-3 w-3 ${check.done ? "text-green-600" : "text-amber-500"}`} />
                {check.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {params.saved ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
          Profil entreprise enregistré avec succès.
        </div>
      ) : null}
      {params.account === "saved" ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
          Informations du compte mises à jour.
        </div>
      ) : null}
      {params.account === "wrong-password" ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Mot de passe actuel incorrect.
        </div>
      ) : null}
      {params.account === "weak-password" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Le nouveau mot de passe doit contenir au moins 8 caractères.
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
              <p className="font-semibold text-foreground">Logo entreprise</p>
              <p className="mt-1">
                Renseignez le nom, l&apos;adresse et les coordonnées ci-dessus : ils apparaissent en
                en-tête de chaque devis. L&apos;import de logo personnalisé sera disponible dans une
                prochaine version.
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

      {/* Account settings */}
      <Card className="mt-6">
        <CardHeader
          title="Mon compte"
          description="Modifiez votre nom affiché ou changez votre mot de passe."
        />
        <form action={updateAccountAction} className="grid gap-4 p-6 md:grid-cols-2">
          <Field label="Nom affiché">
            <input
              className={inputClass}
              name="name"
              defaultValue={user.name}
              required
              minLength={2}
            />
          </Field>
          <Field label="Email (lecture seule)">
            <input
              className={inputClass}
              value={user.email}
              disabled
              readOnly
            />
          </Field>
          <div className="md:col-span-2">
            <SectionDivider label="Changer le mot de passe (optionnel)" />
          </div>
          <Field label="Mot de passe actuel">
            <input className={inputClass} name="currentPassword" type="password" autoComplete="current-password" />
          </Field>
          <Field label="Nouveau mot de passe (8 car. min)">
            <input className={inputClass} name="newPassword" type="password" autoComplete="new-password" minLength={8} />
          </Field>
          <div>
            <Button type="submit">Mettre à jour le compte</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
