"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/useT";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthClient() {
  const { t, lang, setLang } = useT();
  const modules = [
    { label: t("landing.module.inventory"), icon: "boxes", color: "from-amber-400/30 via-amber-100 to-white text-amber-600" },
    { label: t("landing.module.stockLevels"), icon: "levels", color: "from-emerald-400/30 via-emerald-100 to-white text-emerald-600" },
    { label: t("landing.module.movements"), icon: "swap", color: "from-sky-400/30 via-sky-100 to-white text-sky-600" },
    { label: t("landing.module.catalog"), icon: "tag", color: "from-violet-400/30 via-violet-100 to-white text-violet-600" },
    { label: t("landing.module.agencies"), icon: "building", color: "from-rose-400/30 via-rose-100 to-white text-rose-600" },
    { label: t("landing.module.users"), icon: "users", color: "from-teal-400/30 via-teal-100 to-white text-teal-600" },
    { label: t("landing.module.audits"), icon: "shield", color: "from-indigo-400/30 via-indigo-100 to-white text-indigo-600" },
    { label: t("landing.module.files"), icon: "file", color: "from-orange-400/30 via-orange-100 to-white text-orange-600" },
    { label: t("landing.module.settings"), icon: "settings", color: "from-fuchsia-400/30 via-fuchsia-100 to-white text-fuchsia-600" },
    { label: t("landing.module.reports"), icon: "chart", color: "from-lime-400/30 via-lime-100 to-white text-lime-600" },
    { label: t("landing.module.planning"), icon: "calendar", color: "from-cyan-400/30 via-cyan-100 to-white text-cyan-600" },
    { label: t("landing.module.automation"), icon: "bolt", color: "from-yellow-400/30 via-yellow-100 to-white text-yellow-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 flex flex-col dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="border-b border-blue-100 bg-[var(--brand)] px-6 py-5 text-white shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-blue-500 bg-white/10 dark:border-slate-700 dark:bg-slate-900">
              <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">YowSpare</p>
              <p className="text-xs text-blue-100 dark:text-slate-400">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-blue-100 md:flex dark:text-slate-300">
            <Link href="/about" className="hover:text-white dark:hover:text-slate-100">{t("nav.about")}</Link>
            <Link href="/pricing" className="hover:text-white dark:hover:text-slate-100">{t("nav.pricing")}</Link>
            <Link href="/help" className="hover:text-white dark:hover:text-slate-100">{t("nav.help")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="hidden rounded-full border border-blue-400 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={lang}
              onChange={(event) => setLang(event.target.value as "en" | "fr")}
              aria-label="Language"
            >
              <option value="en">🇬🇧 {t("language.english")}</option>
              <option value="fr">🇫🇷 {t("language.french")}</option>
            </select>
            <ThemeToggle />
            <Link
              href="/signin"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-16">
        <section className="mx-auto w-full max-w-6xl pt-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="max-w-xl">
                <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
                  {t("landing.hero.title")}
                </h1>
                <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
                  {t("landing.hero.body")}
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <img
                src="/icons/spare1.png"
                alt="Spare parts illustration"
                className="hero-float h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 w-full max-w-6xl">
          <div className="text-center">
            <h2 className="hand-drawn text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {t("landing.modules.title")}
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[var(--brand)]/80" />
          </div>
          <div className="mt-6 grid grid-cols-4 justify-items-center gap-2">
            {modules.map((item) => (
              <div
                key={item.label}
                className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${item.color} shadow-sm dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100`}
                >
                  {item.icon === "boxes" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 7h7v7H4zM13 4h7v6h-7zM13 12h7v8h-7zM4 16h7v4H4z" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "levels" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 20h16M7 16h3v4H7zM11 12h3v8h-3zM15 8h3v12h-3z" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "swap" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.icon === "tag" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M7 7h7l5 5-7 7-5-5V7z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="10" r="1.5" />
                    </svg>
                  )}
                  {item.icon === "building" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 20V4h8v16M12 8h8v12" strokeLinecap="round" />
                      <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "users" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM16 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeLinecap="round" />
                      <path d="M3.5 20v-1.5a4.5 4.5 0 0 1 9 0V20M13.5 20v-1a3.5 3.5 0 0 1 7 0V20" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "shield" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" strokeLinecap="round" />
                      <path d="m9.5 12.5 1.8 1.8 3.2-3.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "file" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M6 4h9l3 3v13H6z" strokeLinecap="round" />
                      <path d="M9 4v6h6" strokeLinecap="round" />
                      <path d="M9 16h6" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "settings" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z" strokeLinecap="round" />
                      <path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4M6.3 17.7l1.4-1.4m8.6-8.6 1.4-1.4" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "chart" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 20V4h16" strokeLinecap="round" />
                      <path d="M7 16l4-4 3 2 4-6" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "calendar" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M6 4v3M18 4v3M4 9h16M5 20h14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1z" strokeLinecap="round" />
                      <path d="M8 13h4" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "bolt" && (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="text-[11px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 w-full max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-2xl font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {t("landing.demo.title")}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t("landing.demo.subtitle")}
                </h3>
              </div>
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <svg
                    className="absolute -top-9 left-1/2 h-8 w-8 -translate-x-1/2 text-blue-500 animate-bounce"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path d="M12 4v14" strokeLinecap="round" />
                    <path d="M8 14l4 4 4-4" strokeLinecap="round" />
                  </svg>
                  <Link
                    href="/signin"
                    className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
                  >
                    {t("landing.demo.button")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto w-full bg-[var(--brand)] px-6 py-8 text-sm text-white dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">YowSpare</p>
            <p className="mt-1 text-xs text-blue-100 dark:text-slate-400">{t("footer.tagline")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100 dark:text-slate-400">
            <Link href="/security" className="hover:text-white dark:hover:text-slate-100">{t("footer.security")}</Link>
            <Link href="/contact" className="hover:text-white dark:hover:text-slate-100">{t("footer.contact")}</Link>
            <span className="text-blue-100/70 dark:text-slate-500">•</span>
            <span>{t("footer.register.prompt")}</span>
            <Link href="/register" className="font-semibold text-white hover:opacity-90 dark:text-slate-100">
              {t("footer.register.link")}
            </Link>
          </div>
          <div className="text-xs text-blue-100 dark:text-slate-400">{t("footer.copyright")}</div>
        </div>
      </footer>
    </div>
  );
}
