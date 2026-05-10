import Link from "next/link";

export default function GdprPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="font-semibold text-primary">ChantierDevis</Link>
      <h1 className="mt-6 text-3xl font-bold">RGPD et sous-traitance</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
        <p>ChantierDevis agit comme sous-traitant pour les données de clients et chantiers saisies par les artisans.</p>
        <p>Les données sont isolées par compte utilisateur et toutes les requêtes métier sont scopées par <code>userId</code> côté serveur.</p>
        <p>Les exports et suppressions de données sont disponibles dans l&apos;application, section Données et RGPD.</p>
        <p>Les secrets de production doivent être stockés dans l&apos;environnement de déploiement, jamais dans le dépôt.</p>
      </div>
    </main>
  );
}
