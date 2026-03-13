import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CJ Student",
    short_name: "CJ Student",
    description: "Install CJ Student for full-screen live classes and quick access to recordings.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#143f46",
    theme_color: "#143f46",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/pwa/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Live Classes",
        short_name: "Live",
        description: "Jump into the CJ live class list.",
        url: "/live",
      },
      {
        name: "Recordings",
        short_name: "Recordings",
        description: "Open recent CJ class recordings.",
        url: "/live/recordings",
      },
      {
        name: "Dashboard",
        short_name: "Home",
        description: "Open the CJ student dashboard.",
        url: "/dashboard",
      },
    ],
  };
}
