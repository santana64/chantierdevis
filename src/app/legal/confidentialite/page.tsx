import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — ChantierDevis",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← ChantierDevis
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-foreground">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : mai 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-base font-bold text-foreground">1. Responsable du traitement</h2>
          <p className="mt-2">
            Le responsable du traitement des données personnelles est Noah Piessé, éditeur de
            ChantierDevis. Contact :{" "}
            <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
              contact@chantierdevis.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">2. Données collectées</h2>
          <p className="mt-2">ChantierDevis traite les catégories de données suivantes :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Identité et coordonnées du compte (email, mot de passe haché)</li>
            <li>Profil entreprise (nom, SIRET, SIREN, adresse, TVA, assurance)</li>
            <li>Données clients et chantiers saisies par l&apos;utilisateur</li>
            <li>Lignes de devis, bibliothèque d&apos;ouvrages, documents générés</li>
            <li>Données de session (token haché, adresse IP, user-agent)</li>
            <li>Données de facturation Stripe (plan, statut d&apos;abonnement — sans coordonnées bancaires)</li>
            <li>Logs d&apos;emails transactionnels (envoi, ouverture, erreurs)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">3. Finalités et bases légales</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left font-semibold">
                  <th className="py-2 pr-4">Finalité</th>
                  <th className="py-2">Base légale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Création et gestion du compte", "Exécution du contrat"],
                  ["Génération des devis et documents", "Exécution du contrat"],
                  ["Facturation et gestion de l'abonnement", "Exécution du contrat"],
                  ["Envoi d'emails transactionnels", "Exécution du contrat"],
                  ["Sécurité et prévention des fraudes", "Intérêt légitime"],
                  ["Amélioration du service", "Intérêt légitime"],
                  ["Respect des obligations légales", "Obligation légale"],
                ].map(([finalite, base]) => (
                  <tr key={finalite}>
                    <td className="py-2 pr-4">{finalite}</td>
                    <td className="py-2 text-muted">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">4. Sous-traitants</h2>
          <p className="mt-2">ChantierDevis fait appel aux sous-traitants suivants :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Vercel Inc.</strong> — Hébergement de l&apos;application (États-Unis, réseau Edge)</li>
            <li><strong>Neon Inc.</strong> — Base de données PostgreSQL (AWS eu-west-2, Europe)</li>
            <li><strong>Stripe Inc.</strong> — Traitement des paiements (États-Unis, certifié PCI-DSS)</li>
            <li><strong>Resend Inc.</strong> — Envoi des emails transactionnels</li>
          </ul>
          <p className="mt-2">
            Ces sous-traitants sont soumis à des obligations contractuelles de confidentialité et
            ne traitent les données qu&apos;aux fins décrites ci-dessus.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">5. Durée de conservation</h2>
          <p className="mt-2">
            Les données de compte et les documents sont conservés pendant toute la durée de
            l&apos;abonnement actif, puis pendant 30 jours après résiliation avant suppression
            définitive, sauf obligation légale contraire.
          </p>
          <p className="mt-2">
            Les données de session expirent après 30 jours d&apos;inactivité.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">6. Vos droits</h2>
          <p className="mt-2">
            Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Droit d&apos;accès et de portabilité</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement (droit à l&apos;oubli)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit d&apos;opposition</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits ou formuler une réclamation, contactez-nous à{" "}
            <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
              contact@chantierdevis.fr
            </a>
            . Vous pouvez également saisir la CNIL (
            <a href="https://www.cnil.fr" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              cnil.fr
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">7. Cookies et traceurs</h2>
          <p className="mt-2">
            ChantierDevis n&apos;utilise pas de cookies publicitaires ni de traceurs tiers
            d&apos;analyse comportementale. Un cookie de session strictement nécessaire au
            fonctionnement du service est déposé lors de la connexion. Ce cookie est supprimé à la
            déconnexion ou à l&apos;expiration de la session.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">8. Sécurité</h2>
          <p className="mt-2">
            Les mots de passe sont hachés avec scrypt (sel aléatoire). Les sessions sont
            identifiées par un token aléatoire de 32 octets stocké haché en base. Les
            communications sont chiffrées via HTTPS (TLS 1.2+).
          </p>
        </section>
      </div>

      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted">
        <Link href="/legal/mentions-legales" className="hover:text-primary hover:underline">Mentions légales</Link>
        <Link href="/legal/cgv" className="hover:text-primary hover:underline">CGV</Link>
        <Link href="/legal/rgpd" className="hover:text-primary hover:underline">RGPD</Link>
      </nav>
    </main>
  );
}
