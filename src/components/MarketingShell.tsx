"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/components/i18n/useT";
import ThemeToggle from "@/components/ThemeToggle";
import { withAppBasePath } from "@/lib/basePath";

const copy = {
  en: {
    nav: {
      features: "Features",
      benefits: "Benefits",
      pricing: "Pricing",
      security: "Security",
      contact: "Contact",
      signIn: "Sign in",
      start: "Start free",
      language: "Language",
    },
    footer: {
      tagline: "Offline-first stock spare, procurement, and warehouse control for maintenance teams.",
      product: "Product",
      company: "Company",
      legal: "Legal",
      features: "Features",
      pricing: "Pricing",
      security: "Security",
      about: "About",
      contact: "Contact",
      careers: "Careers",
      help: "Help center",
      privacy: "Privacy policy",
      terms: "Terms of service",
      copyright: "© 2026 YowSpare. All rights reserved.",
    },
  },
  fr: {
    nav: {
      features: "Fonctionnalites",
      benefits: "Avantages",
      pricing: "Tarifs",
      security: "Securite",
      contact: "Contact",
      signIn: "Se connecter",
      start: "Demarrer",
      language: "Langue",
    },
    footer: {
      tagline: "Gestion offline-first du stock spare, des achats et des entrepots pour les equipes maintenance.",
      product: "Produit",
      company: "Entreprise",
      legal: "Legal",
      features: "Fonctionnalites",
      pricing: "Tarifs",
      security: "Securite",
      about: "A propos",
      contact: "Contact",
      careers: "Carrieres",
      help: "Centre d'aide",
      privacy: "Confidentialite",
      terms: "Conditions",
      copyright: "© 2026 YowSpare. Tous droits reserves.",
    },
  },
} as const;

export default function MarketingShell({ children }: { children: ReactNode }) {
  const { lang, setLang } = useT();
  const c = copy[lang];

  return (
    <div className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="YowSpare">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Image src={withAppBasePath("/icons/yowspareicon.png")} alt="" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-slate-950 dark:text-white">YowSpare</p>
              <p className="hidden text-xs text-slate-500 sm:block">Stock Spare OS</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex dark:text-slate-300">
            <Link href="/#features" className="transition hover:text-blue-600 dark:hover:text-blue-400">{c.nav.features}</Link>
            <Link href="/#benefits" className="transition hover:text-blue-600 dark:hover:text-blue-400">{c.nav.benefits}</Link>
            <Link href="/pricing" className="transition hover:text-blue-600 dark:hover:text-blue-400">{c.nav.pricing}</Link>
            <Link href="/security" className="transition hover:text-blue-600 dark:hover:text-blue-400">{c.nav.security}</Link>
            <Link href="/contact" className="transition hover:text-blue-600 dark:hover:text-blue-400">{c.nav.contact}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={lang}
              onChange={(event) => setLang(event.target.value as "en" | "fr")}
              aria-label={c.nav.language}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
            <ThemeToggle />
            <Link
              href="/signin"
              className="hidden h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              {c.nav.signIn}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {c.nav.start}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white px-6 py-12 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1.25fr_2fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Image src={withAppBasePath("/icons/yowspareicon.png")} alt="" width={40} height={40} className="h-full w-full object-cover" />
              </div>
              <p className="text-lg font-bold text-slate-950 dark:text-white">YowSpare</p>
            </div>
            <p className="mt-4 leading-relaxed">{c.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="font-semibold text-slate-950 dark:text-white">{c.footer.product}</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/#features" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.features}</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.pricing}</Link></li>
                <li><Link href="/security" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.security}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 dark:text-white">{c.footer.company}</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.about}</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.contact}</Link></li>
                <li><Link href="/careers" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.careers}</Link></li>
                <li><Link href="/help" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.help}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 dark:text-white">{c.footer.legal}</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">{c.footer.terms}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-slate-200 pt-6 text-center dark:border-slate-800">
          <p>{c.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
