import { CheckCircle2, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button, Card, CardHeader, LegalDisclaimer } from "@/components/ui";
import { PLAN_LIMITS } from "@/domain/billing/plans";
import {
  createBillingPortalSessionAction,
  createCheckoutSessionAction,
  switchToFreePlanAction,
} from "@/server/billing-actions";
import { getBillingData } from "@/server/queries";

export const dynamic = "force-dynamic";

function UsageBar({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) return <p className="text-sm font-semibold text-success">Illimité</p>;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-success";
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums">
        {used} / {limit}
      </p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { user, usage } = await getBillingData();

  return (
    <>
      <PageHeader
        title="Abonnement"
        description="Gérez votre formule, vos limites d\u2019utilisation et votre portail de facturation."
      />

      {/* Alerts */}
      {params.limit ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Limite atteinte.</strong> Passez sur une offre supérieure pour continuer.
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Paiement non disponible\u00a0: vérifiez la configuration Stripe.
        </div>
      ) : null}
      {params.checkout === "success" ? (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
          Paiement validé. L&apos;abonnement sera synchronisé par webhook Stripe.
        </div>
      ) : null}

      {/* Current plan */}
      <Card className="mb-6">
        <CardHeader title="Votre formule actuelle" />
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Formule</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {PLAN_LIMITS[user.plan].label}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Statut Stripe</p>
            <p className="mt-2 font-bold text-foreground">{user.subscriptionStatus ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Clients utilisés</p>
            <div className="mt-2">
              <UsageBar used={usage.clients} limit={PLAN_LIMITS[user.plan].clients} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Devis utilisés</p>
            <div className="mt-2">
              <UsageBar used={usage.quotes} limit={PLAN_LIMITS[user.plan].quotes} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Ouvrages bibliothèque</p>
            <div className="mt-2">
              <UsageBar used={usage.workItems} limit={PLAN_LIMITS[user.plan].workItems} />
            </div>
          </div>
        </div>
      </Card>

      {/* Plan cards */}
      <section className="grid gap-5 lg:grid-cols-4">
        {Object.entries(PLAN_LIMITS).map(([plan, details]) => {
          const isCurrent = plan === user.plan;
          return (
            <article
              key={plan}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
                isCurrent
                  ? "border-accent bg-white shadow-md ring-2 ring-accent/20"
                  : "border-border bg-card"
              }`}
            >
              {isCurrent ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white shadow">
                    Formule actuelle
                  </span>
                </div>
              ) : null}
              <div>
                <h2 className="text-base font-bold text-foreground">{details.label}</h2>
                <p className="mt-3 text-2xl font-black tabular-nums text-primary">
                  {details.price}
                </p>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {details.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-muted">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan === "FREE" ? (
                  <form action={switchToFreePlanAction}>
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isCurrent}
                      className="w-full"
                    >
                      {isCurrent ? "Formule active" : "Annuler et passer en Gratuit"}
                    </Button>
                  </form>
                ) : (
                  <form action={createCheckoutSessionAction}>
                    <input type="hidden" name="plan" value={plan} />
                    <Button
                      type="submit"
                      className={`w-full ${isCurrent ? "opacity-50" : ""}`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Formule active" : `Choisir ${details.label}`}
                    </Button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Stripe portal */}
      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard aria-hidden className="h-5 w-5 text-muted" />
              <h2 className="font-semibold text-foreground">Portail de facturation Stripe</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              Gérez vos informations de paiement, factures Stripe et annulation d&apos;abonnement.
            </p>
          </div>
          <form action={createBillingPortalSessionAction}>
            <Button type="submit" variant="secondary">Ouvrir le portail Stripe</Button>
          </form>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="mt-6">
        <LegalDisclaimer>
          ChantierDevis est un outil d&apos;aide à la création de devis. Il ne remplace pas un
          expert-comptable, un avocat ou un conseil juridique personnalisé.
        </LegalDisclaimer>
      </div>
    </>
  );
}
