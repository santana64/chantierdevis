import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ChantierDevis - Devis BTP conformes et rentables",
  description:
    "Créez des devis BTP propres, conformes et rentables en quelques minutes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ChantierDevis",
    statusBarStyle: "default",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
