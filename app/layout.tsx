import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JEC-conNEcT — La communauté JEC, unie",
  description: "La plateforme collaborative, communautaire et institutionnelle de la Jeunesse Étudiante Chrétienne.",
  applicationName: "JEC-conNEcT"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
