import "./globals.css";
import type { Metadata } from "next";
import { LangProvider } from "@/components/i18n/LangProvider";

export const metadata: Metadata = {
  title: "YowSpare",
  description: "Offline-first spare parts management for MRO",
  manifest: "/manifest.webmanifest",
  applicationName: "YowSpare",
  themeColor: "#111827",
  icons: {
    icon: "/icons/yowspareicon.png",
    apple: "/icons/yowspareicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <LangProvider>{children}</LangProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
