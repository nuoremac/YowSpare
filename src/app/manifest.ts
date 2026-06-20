import type { MetadataRoute } from "next";
import { withAppBasePath } from "@/lib/basePath";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YowSpare",
    short_name: "YowSpare",
    description: "Offline-first spare parts management for MRO",
    start_url: withAppBasePath("/"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: withAppBasePath("/icons/image copy.png"), sizes: "192x192", type: "image/png" },
      { src: withAppBasePath("/icons/image.png"), sizes: "512x512", type: "image/png" }
    ]
  };
}
