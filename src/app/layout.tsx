import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LangProvider } from "@/components/i18n/LangProvider";
import { withAppBasePath } from "@/lib/basePath";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});


export const metadata: Metadata = {
  title: "YowSpare | Offline-first stock spare management",
  description: "Control spare parts inventory, warehouse locations, procurement, approvals, and traceability for maintenance teams.",
  manifest: withAppBasePath("/manifest.webmanifest"),
  applicationName: "YowSpare",
  icons: {
    icon: withAppBasePath("/icons/yowspareicon.png"),
    apple: withAppBasePath("/icons/yowspareicon.png"),
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("yowspare-theme");
                  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var theme = stored === "dark" || stored === "light" ? stored : (prefersDark ? "dark" : "light");
                  var root = document.documentElement;
                  root.classList.remove("theme-light", "theme-dark");
                  root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
                  root.classList.toggle("dark", theme === "dark");
                  root.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}>
        <LangProvider>{children}</LangProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('${withAppBasePath("/sw.js")}').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
