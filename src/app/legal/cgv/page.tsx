import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="font-semibold text-primary">ChantierDevis</Link>
      <h1 className="mt-6 text-3xl font-bold">Conditions générales de vente</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
        <p>ChantierDevis fournit un service SaaS de création, gestion, export et suivi de devis pour artisans et petites entreprises du BTP.</p>
        <p>Les abonnements payants sont mensuels, traités par Stripe, avec accès aux fonctionnalités et limites indiquées sur la page Abonnement.</p>
        <p>L&apos;utilisateur reste responsable du contenu des documents, des prix, des mentions spécifiques à son activité et de la vérification juridique ou comptable.</p>
        <p>Le service peut évoluer pour améliorer la sécurité, la conformité et les fonctionnalités métier.</p>
      </div>
    </main>
  );
}
