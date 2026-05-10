import Link from "next/link";

export default function LegalNoticePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="font-semibold text-primary">ChantierDevis</Link>
      <h1 className="mt-6 text-3xl font-bold">Mentions légales</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
        <p>Éditeur : ChantierDevis, service logiciel de création et suivi de devis BTP.</p>
        <p>Contact : support@chantierdevis.fr.</p>
        <p>Hébergement : à renseigner selon le prestataire retenu au déploiement.</p>
        <p>ChantierDevis est un outil d&apos;aide administrative et commerciale. Il ne fournit pas de conseil juridique personnalisé.</p>
      </div>
    </main>
  );
}
