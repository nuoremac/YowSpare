"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/useT";
import ThemeToggle from "@/components/ThemeToggle";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useT();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 flex flex-col dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              aria-label="Go to landing page"
            >
              <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-8 w-8" />
            </Link>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">YowSpare</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex dark:text-slate-300">
            <Link href="/about" className="hover:text-[var(--brand)]">{t("nav.about")}</Link>
            <Link href="/pricing" className="hover:text-[var(--brand)]">{t("nav.pricing")}</Link>
            <Link href="/help" className="hover:text-[var(--brand)]">{t("nav.help")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 md:block dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              value={lang}
              onChange={(event) => setLang(event.target.value as "en" | "fr")}
              aria-label="Language"
            >
              <option value="en">🇬🇧{t("language.english")}</option>
              <option value="fr">🇫🇷{t("language.french")}</option>
            </select>
            <ThemeToggle />
            <Link
              href="/signin"
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-strong)]"
            >
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-16">{children}</main>

      <footer className="mt-auto w-full bg-[var(--brand)] px-6 py-8 text-sm text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">YowSpare</p>
            <p className="mt-1 text-xs text-blue-100">{t("footer.tagline")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100">
            <Link href="/security" className="hover:text-white">{t("footer.security")}</Link>
            <Link href="/contact" className="hover:text-white">{t("footer.contact")}</Link>
          </div>
          <div className="text-xs text-blue-100">{t("footer.copyright")}</div>
        </div>
      </footer>
    </div>
  );
}
