"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/store/session";
import { getTenantSlugFromHost } from "@/lib/tenant";
import { seedIfEmpty } from "@/lib/seed";
import { getDB } from "@/lib/db";
import type { User } from "@/lib/type";
import { useT } from "@/components/i18n/useT";

export default function AuthClient() {
  const router = useRouter();
  const { setTenant, setUser } = useSession();
  const { t, lang, setLang } = useT();

  const [tenantSlug, setTenantSlug] = useState("demo");
  const [email, setEmail] = useState("tech@company.com");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const url = new URL(window.location.href);
      const slug =
        url.searchParams.get("tenant") || getTenantSlugFromHost(window.location.host);

      if (!alive) return;
      startTransition(() => setTenantSlug(slug));

      await seedIfEmpty(slug);

      const db = await getDB();
      const tenant = await db.get("tenant", "current");
      if (!tenant || !alive) return;

      setTenant(tenant);

      const u = await db.getAllFromIndex("users", "by_tenant", tenant.id);
      if (!alive) return;

      startTransition(() => {
        setUsers(u);
        setLoading(false);
      });
    })();

    return () => {
      alive = false;
    };
  }, [setTenant]);

  const selectedUser = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  const canEnter = !!selectedUser && !loading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-900">YowSpare</p>
              <p className="text-xs text-slate-500">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/about" className="hover:text-[var(--brand)]">{t("nav.about")}</Link>
            <Link href="/pricing" className="hover:text-[var(--brand)]">{t("nav.pricing")}</Link>
            <Link href="/help" className="hover:text-[var(--brand)]">{t("nav.help")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 md:block"
              value={lang}
              onChange={(event) => setLang(event.target.value as "en" | "fr")}
              aria-label="Language"
            >
              <option value="en">🇬🇧 {t("language.english")}</option>
              <option value="fr">🇫🇷 {t("language.french")}</option>
            </select>
            <Link
              href="#signin"
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-strong)]"
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
                <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                  {t("landing.hero.title")}
                </h1>
                <p className="mt-4 text-base text-slate-600">
                  {t("landing.hero.body")}
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <img
                src="/icons/spare.png"
                alt="Spare parts illustration"
                className="hero-float h-64 w-full object-contain"
              />
            </div>
          </div>

          <section className="mt-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t("landing.key.label")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {t("landing.key.title")}
                </h2>
              </div>
              <span className="hidden text-xs text-slate-500 md:inline">
                {t("landing.key.tagline")}
              </span>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: t("landing.tile.inventory"),
                  tone: "bg-emerald-100 text-emerald-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 7h16l-2 10H6L4 7z" strokeLinecap="round" />
                      <path d="M7 7V5h10v2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.movement"),
                  tone: "bg-amber-100 text-amber-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 8h10M14 8l-3-3m3 3-3 3" strokeLinecap="round" />
                      <path d="M20 16H10m0 0 3-3m-3 3 3 3" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.procurement"),
                  tone: "bg-rose-100 text-rose-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M7 6h10v12H7z" strokeLinecap="round" />
                      <path d="M9 10h6M9 14h6" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.mapping"),
                  tone: "bg-indigo-100 text-indigo-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 6h16v12H4z" strokeLinecap="round" />
                      <path d="M8 10h3v3H8zM13 10h3v3h-3z" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.sync"),
                  tone: "bg-cyan-100 text-cyan-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M7 8a6 6 0 0 1 10 2" strokeLinecap="round" />
                      <path d="M17 16a6 6 0 0 1-10-2" strokeLinecap="round" />
                      <path d="M16 6v4h4" strokeLinecap="round" />
                      <path d="M8 18v-4H4" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.audit"),
                  tone: "bg-violet-100 text-violet-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M8 5h8v14H8z" strokeLinecap="round" />
                      <path d="M10 9h4M10 13h4M6 7h2M6 11h2M6 15h2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.suppliers"),
                  tone: "bg-lime-100 text-lime-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M6 7h12v10H6z" strokeLinecap="round" />
                      <path d="M9 15v-4M12 15V9M15 15v-2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.access"),
                  tone: "bg-slate-100 text-slate-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4z" strokeLinecap="round" />
                      <path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
                      <path d="M17 7l2 2m0-2-2 2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.qr"),
                  tone: "bg-orange-100 text-orange-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" strokeLinecap="round" />
                      <path d="M14 14h3v3h-3zM19 19h1" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.alerts"),
                  tone: "bg-sky-100 text-sky-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 5a5 5 0 0 1 5 5v3l2 3H5l2-3v-3a5 5 0 0 1 5-5z" strokeLinecap="round" />
                      <path d="M9 19a3 3 0 0 0 6 0" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.maintenance"),
                  tone: "bg-fuchsia-100 text-fuchsia-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M6 5h12v14H6z" strokeLinecap="round" />
                      <path d="M9 3v4M15 3v4M8 11h8M8 15h5" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: t("landing.tile.reporting"),
                  tone: "bg-teal-100 text-teal-700",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M5 19V9M12 19V5M19 19v-7" strokeLinecap="round" />
                      <path d="M3 19h18" strokeLinecap="round" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                    {item.icon}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {t("landing.tile.description")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {t("landing.demo.label")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {t("landing.demo.title")}
            </h2>
          </div>

          <div className="mt-8 flex justify-center" id="signin">
            {loading ? (
              <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="space-y-3 text-sm text-slate-500">
                  <div className="h-10 w-full rounded-xl bg-slate-100" />
                  <div className="h-10 w-full rounded-xl bg-slate-100" />
                  <p>{t("landing.demo.loading")}</p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <p className="text-xs text-slate-500">{t("landing.demo.subtitle")}</p>

                  <label className="mt-6 block text-sm font-medium text-slate-700">
                    {t("landing.demo.email")}
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    placeholder="tech@company.com"
                  />

                  <div className="mt-3 text-xs text-slate-500">
                    {t("landing.demo.seeded")} {users.map((u) => u.email).join(" · ")}
                  </div>

                  <button
                    type="button"
                    disabled={!canEnter}
                    onClick={() => {
                      if (!selectedUser) return;
                      setUser(selectedUser);
                      router.push("/app");
                    }}
                    className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40"
                  >
                    {t("landing.demo.enter")}
                  </button>

                  {!selectedUser && (
                    <p className="mt-3 text-xs text-red-600">
                      {t("landing.demo.emailMissing")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

      </main>

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
