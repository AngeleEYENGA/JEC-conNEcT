import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import NotificationCenter from "@/components/notification-center";

export const metadata: Metadata = {
  title: "JEC-conNEcT — La communauté JEC, unie",
  description: "La plateforme collaborative, communautaire et institutionnelle de la Jeunesse Étudiante Chrétienne.",
  applicationName: "JEC-conNEcT",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JEC Connect"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#202A46",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><LanguageProvider><NotificationCenter />{children}</LanguageProvider></body>
    </html>
  );
}
