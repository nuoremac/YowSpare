import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YowSpare",
    short_name: "YowSpare",
    description: "Offline-first spare parts management for MRO",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/image copy.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/image.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
