import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ChantierDevis — Devis BTP avec IA, facturation Factur-X",
    template: "%s | ChantierDevis",
  },
  description:
    "Créez des devis BTP conformes et rentables en 2 minutes. IA générative, marge visible, signature électronique, facturation Factur-X EN 16931. À partir de 19 €/mois.",
  keywords: ["devis BTP", "logiciel devis artisan", "facturation Factur-X", "devis plombier", "devis peintre", "conformité devis"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "ChantierDevis",
    title: "ChantierDevis — Devis BTP avec IA, facturation Factur-X",
    description: "Créez des devis BTP conformes et rentables en 2 minutes. IA générative, marge visible, signature électronique, facturation Factur-X.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChantierDevis — Devis BTP avec IA",
    description: "Devis BTP conformes et rentables en 2 minutes.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ChantierDevis",
    statusBarStyle: "default",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#e86218" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SwRegister />
      </body>
    </html>
  );
}
