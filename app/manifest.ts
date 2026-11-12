import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "JEC-conNEcT",
    short_name: "JEC Connect",
    description: "La communauté JEC, unie. Connecter, collaborer, construire ensemble.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F7F7FA",
    theme_color: "#202A46",
    lang: "fr",
    categories: ["education", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
    ]
  };
}
