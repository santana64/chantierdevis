import Link from "next/link";

export const metadata = {
  title: "Conditions générales de vente — ChantierDevis",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← ChantierDevis
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-foreground">Conditions générales de vente</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : mai 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-base font-bold text-foreground">1. Objet</h2>
          <p className="mt-2">
            Les présentes conditions régissent l&apos;accès et l&apos;utilisation du service
            ChantierDevis, logiciel en ligne (SaaS) de création, gestion, export et suivi de devis
            destiné aux artisans et aux petites entreprises du secteur du bâtiment et des travaux
            publics (BTP).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">2. Offres et tarifs</h2>
          <p className="mt-2">
            ChantierDevis propose plusieurs formules d&apos;abonnement (Gratuit, Solo, Pro,
            Entreprise artisanale) dont le détail et les prix sont affichés sur la page Abonnement
            de l&apos;application et sur la page d&apos;accueil du site.
          </p>
          <p className="mt-2">
            Les abonnements payants sont à renouvellement mensuel automatique. Les prix sont
            indiqués hors taxes. La TVA applicable est celle en vigueur à la date de facturation.
          </p>
          <p className="mt-2">
            ChantierDevis se réserve le droit de modifier ses tarifs avec un préavis d&apos;au
            moins 30 jours communiqué par email.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">3. Paiement</h2>
          <p className="mt-2">
            Les paiements sont traités par <strong>Stripe</strong>, prestataire de services de
            paiement certifié PCI-DSS. ChantierDevis ne stocke aucune donnée de carte bancaire.
          </p>
          <p className="mt-2">
            En cas d&apos;échec de paiement, l&apos;accès aux fonctionnalités payantes peut être
            suspendu jusqu&apos;à régularisation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">4. Droit de rétractation</h2>
          <p className="mt-2">
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de
            rétractation ne s&apos;applique pas aux services dont l&apos;exécution a commencé
            avant l&apos;expiration du délai de rétractation avec l&apos;accord exprès de
            l&apos;utilisateur.
          </p>
          <p className="mt-2">
            En créant un compte et en accédant au service, l&apos;utilisateur reconnaît avoir
            demandé l&apos;exécution immédiate du service et renonce à son droit de rétractation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">5. Résiliation</h2>
          <p className="mt-2">
            L&apos;utilisateur peut résilier son abonnement à tout moment depuis le portail de
            facturation Stripe accessible dans l&apos;application. La résiliation prend effet à la
            fin de la période de facturation en cours.
          </p>
          <p className="mt-2">
            En cas de résiliation, les données restent accessibles en lecture seule pendant 30
            jours, puis peuvent être supprimées sur demande.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">6. Responsabilités</h2>
          <p className="mt-2">
            ChantierDevis met à disposition un outil d&apos;aide à la création de devis.
            L&apos;utilisateur doit vérifier que ses documents respectent les obligations légales
            applicables à son activité (mentions obligatoires, TVA, assurance décennale, etc.) et
            consulter un expert-comptable ou un conseiller juridique en cas de doute.
          </p>
          <p className="mt-2">
            ChantierDevis ne saurait être tenu responsable des erreurs, oublis ou inexactitudes
            figurant dans les documents générés par l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">7. Disponibilité du service</h2>
          <p className="mt-2">
            ChantierDevis s&apos;efforce d&apos;assurer la disponibilité du service 24h/24 et
            7j/7, sous réserve de maintenances planifiées ou d&apos;événements indépendants de sa
            volonté. Aucune garantie contractuelle de disponibilité n&apos;est accordée dans le
            cadre de la formule Gratuit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">8. Droit applicable</h2>
          <p className="mt-2">
            Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux
            compétents seront ceux du ressort du domicile du défendeur ou, pour un consommateur,
            du tribunal de son lieu de résidence.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">9. Contact</h2>
          <p className="mt-2">
            Pour toute question :{" "}
            <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
              contact@chantierdevis.fr
            </a>
          </p>
        </section>
      </div>

      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted">
        <Link href="/legal/mentions-legales" className="hover:text-primary hover:underline">Mentions légales</Link>
        <Link href="/legal/confidentialite" className="hover:text-primary hover:underline">Confidentialité</Link>
        <Link href="/legal/rgpd" className="hover:text-primary hover:underline">RGPD</Link>
      </nav>
    </main>
  );
}
