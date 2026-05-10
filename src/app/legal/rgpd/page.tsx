import Link from "next/link";

export const metadata = {
  title: "RGPD et sous-traitance — ChantierDevis",
};

export default function GdprPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← ChantierDevis
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-foreground">RGPD — Vos données</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : mai 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-base font-bold text-foreground">ChantierDevis et le RGPD</h2>
          <p className="mt-2">
            ChantierDevis respecte le Règlement général sur la protection des données (RGPD,
            UE 2016/679) et la loi Informatique et Libertés modifiée.
          </p>
          <p className="mt-2">
            Lorsque vous utilisez ChantierDevis pour gérer vos clients et vos chantiers,
            vous agissez en tant que <strong>responsable du traitement</strong> des données de vos
            clients. ChantierDevis intervient comme <strong>sous-traitant</strong> et traite ces
            données uniquement selon vos instructions et aux fins du service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Isolation des données</h2>
          <p className="mt-2">
            Chaque compte est strictement isolé. Toutes les requêtes vers la base de données sont
            filtrées par identifiant utilisateur côté serveur. Aucune donnée de votre compte
            n&apos;est accessible à un autre utilisateur du service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Exercer vos droits</h2>
          <p className="mt-2">Pour exercer vos droits RGPD, plusieurs options s&apos;offrent à vous :</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Export de vos données :</strong> depuis l&apos;espace &ldquo;Données et RGPD&rdquo;
              de l&apos;application, vous pouvez télécharger l&apos;intégralité de vos données au
              format JSON.
            </li>
            <li>
              <strong>Suppression du compte :</strong> depuis ce même espace, vous pouvez demander
              la suppression définitive de votre compte et de toutes les données associées. La
              suppression est effective sous 30 jours.
            </li>
            <li>
              <strong>Demande par email :</strong> pour toute demande de rectification, limitation
              ou opposition, écrivez à{" "}
              <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
                contact@chantierdevis.fr
              </a>
              . Délai de réponse : 30 jours maximum.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Sous-traitants et transferts hors UE</h2>
          <p className="mt-2">
            ChantierDevis fait appel à des sous-traitants dont certains sont établis hors de
            l&apos;Union européenne (Vercel, Stripe, Resend — États-Unis). Ces transferts sont
            encadrés par des clauses contractuelles types (CCT) approuvées par la Commission
            européenne, conformément à l&apos;article 46 du RGPD.
          </p>
          <p className="mt-2">
            Les données de base de données sont stockées en Europe (AWS eu-west-2, Londres).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Sécurité technique</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Mots de passe hachés avec scrypt + sel aléatoire (jamais stockés en clair)</li>
            <li>Tokens de session de 32 octets aléatoires, stockés uniquement sous forme hachée</li>
            <li>Toutes les communications chiffrées via HTTPS / TLS 1.2+</li>
            <li>Accès à la base de données restreint aux services internes via SSL</li>
            <li>Aucune donnée bancaire stockée (délégation à Stripe PCI-DSS niveau 1)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Contact DPO / réclamation</h2>
          <p className="mt-2">
            Pour toute question relative à la protection de vos données :{" "}
            <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
              contact@chantierdevis.fr
            </a>
          </p>
          <p className="mt-2">
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
            réclamation auprès de la CNIL :{" "}
            <a href="https://www.cnil.fr/fr/plaintes" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              cnil.fr/fr/plaintes
            </a>
          </p>
        </section>
      </div>

      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted">
        <Link href="/legal/mentions-legales" className="hover:text-primary hover:underline">Mentions légales</Link>
        <Link href="/legal/cgv" className="hover:text-primary hover:underline">CGV</Link>
        <Link href="/legal/confidentialite" className="hover:text-primary hover:underline">Confidentialité</Link>
      </nav>
    </main>
  );
}
