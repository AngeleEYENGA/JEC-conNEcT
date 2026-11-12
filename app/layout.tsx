import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "JEC-conNEcT — La communauté JEC, unie",
  description: "La plateforme collaborative, communautaire et institutionnelle de la Jeunesse Étudiante Chrétienne.",
  applicationName: "JEC-conNEcT",
  manifest: "/manifest.webmanifest",
  themeColor: "#202A46",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JEC Connect"
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
