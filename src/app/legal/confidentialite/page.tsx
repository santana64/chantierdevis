import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="font-semibold text-primary">ChantierDevis</Link>
      <h1 className="mt-6 text-3xl font-bold">Politique de confidentialité</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
        <p>Les données traitées servent à créer des comptes, gérer des clients, produire des devis, factures, relances et abonnements.</p>
        <p>Données concernées : identité du compte, profil entreprise, clients, chantiers, lignes de devis, documents générés, emails envoyés, données de facturation Stripe.</p>
        <p>Base légale : exécution du contrat, obligations précontractuelles, intérêt légitime de sécurisation et obligations légales applicables.</p>
        <p>Les paiements sont opérés par Stripe. Les emails transactionnels peuvent être opérés par Resend lorsque configuré.</p>
        <p>Vous pouvez exporter vos données et demander la suppression du compte depuis l&apos;espace Données et RGPD.</p>
      </div>
    </main>
  );
}
