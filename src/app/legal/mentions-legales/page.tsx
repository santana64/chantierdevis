import Link from "next/link";

export const metadata = {
  title: "Mentions légales — ChantierDevis",
};

export default function LegalNoticePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← ChantierDevis
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-foreground">Mentions légales</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : mai 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-base font-bold text-foreground">Éditeur du service</h2>
          <p className="mt-2">
            ChantierDevis est édité par Noah Piessé, entrepreneur individuel.
          </p>
          <p className="mt-1">7 rue Inkermann, 37000 Tours, France</p>
          <p className="mt-1">
            Email :{" "}
            <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
              contact@chantierdevis.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Hébergement</h2>
          <p className="mt-2">
            Le service est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133,
            Covina, CA 91723, États-Unis —{" "}
            <a href="https://vercel.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              vercel.com
            </a>
            .
          </p>
          <p className="mt-1">
            Les données de base de données sont stockées par <strong>Neon Inc.</strong> sur
            infrastructure AWS eu-west-2 (Europe, Londres).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Propriété intellectuelle</h2>
          <p className="mt-2">
            L&apos;ensemble des éléments composant le service ChantierDevis (code, design, textes,
            logotypes) est protégé par le droit d&apos;auteur. Toute reproduction ou utilisation
            sans autorisation préalable est interdite.
          </p>
          <p className="mt-2">
            Les contenus générés par l&apos;utilisateur (devis, fiches clients, ouvrages) restent
            la propriété exclusive de l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Limitation de responsabilité</h2>
          <p className="mt-2">
            ChantierDevis est un outil d&apos;aide à la création de devis. Il ne fournit pas de
            conseil juridique, fiscal ou comptable. L&apos;utilisateur reste seul responsable du
            contenu de ses documents et de leur conformité aux obligations légales applicables à
            son activité.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Contact</h2>
          <p className="mt-2">
            Pour toute question relative aux présentes mentions légales :{" "}
            <a href="mailto:contact@chantierdevis.fr" className="text-primary underline">
              contact@chantierdevis.fr
            </a>
          </p>
        </section>
      </div>

      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted">
        <Link href="/legal/cgv" className="hover:text-primary hover:underline">CGV</Link>
        <Link href="/legal/confidentialite" className="hover:text-primary hover:underline">Confidentialité</Link>
        <Link href="/legal/rgpd" className="hover:text-primary hover:underline">RGPD</Link>
      </nav>
    </main>
  );
}
