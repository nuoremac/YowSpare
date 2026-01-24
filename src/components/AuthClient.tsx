"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/store/session";
import { getTenantSlugFromHost } from "@/lib/tenant";
import { seedIfEmpty } from "@/lib/seed";
import { getDB } from "@/lib/db";
import type { Invite, User } from "@/lib/type";
import { useT } from "@/components/i18n/useT";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthClient() {
  const router = useRouter();
  const { tenant, setTenant, setUser } = useSession();
  const { t, lang, setLang } = useT();

  const [email, setEmail] = useState("tech@company.com");
  const [password, setPassword] = useState("Demo123!");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitePasswords, setInvitePasswords] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [inviteError, setInviteError] = useState("");
  useEffect(() => {
    let alive = true;

    (async () => {
      const url = new URL(window.location.href);
      const slug =
        url.searchParams.get("tenant") || getTenantSlugFromHost(window.location.host);

      await seedIfEmpty(slug);

      const db = await getDB();
      const tenant = await db.get("tenant", "current");
      if (!tenant || !alive) return;

      setTenant(tenant);

      const u = await db.getAllFromIndex("users", "by_tenant", tenant.id);
      if (!alive) return;

      startTransition(() => {
        setUsers(u);
        const raw = localStorage.getItem(`yowspare_invites_${tenant.id}`);
        setInvites(raw ? (JSON.parse(raw) as Invite[]) : []);
        setLoading(false);
      });
    })();

    return () => {
      alive = false;
    };
  }, [setTenant]);


  const selectedUser = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  const canEnter = !!selectedUser && !loading && password.trim().length > 0;

  function persistInvites(next: Invite[]) {
    if (!tenant) return;
    setInvites(next);
    localStorage.setItem(`yowspare_invites_${tenant.id}`, JSON.stringify(next));
  }

  async function handleLogin() {
    setAuthError("");
    if (!selectedUser) {
      setAuthError("No account found for this email.");
      return;
    }
    if (!selectedUser.password) {
      setAuthError("This account has no password yet. Accept the invite first.");
      return;
    }
    if (selectedUser.password !== password) {
      setAuthError("Invalid password.");
      return;
    }
    setUser(selectedUser);
    router.push("/app");
  }


  async function acceptInvite(inviteId: string) {
    setInviteError("");
    const inv = invites.find((i) => i.id === inviteId);
    if (!inv || inv.status !== "PENDING") return;
    const pwd = invitePasswords[inviteId]?.trim() || "";
    if (pwd.length < 6) {
      setInviteError("Password must be at least 6 characters.");
      return;
    }
    const db = await getDB();
    const newUser: User = {
      id: `u_${inv.id}`,
      tenantId: inv.tenantId,
      email: inv.email,
      name: inv.email.split("@")[0],
      role: inv.role,
      agencyId: inv.agencyId,
      password: pwd,
    };
    await db.put("users", newUser);
    const nextInvites = invites.map((i) =>
      i.id === inviteId ? { ...i, status: "ACCEPTED" as const } : i
    );
    persistInvites(nextInvites);
    const refreshed = await db.getAllFromIndex("users", "by_tenant", inv.tenantId);
    setUsers(refreshed);
    setEmail(inv.email);
    setPassword(pwd);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 flex flex-col dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-8 w-8" />
            </div>
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
              <option value="en">🇬🇧 {t("language.english")}</option>
              <option value="fr">🇫🇷 {t("language.french")}</option>
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

          <section className="mt-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {t("landing.key.label")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t("landing.key.title")}
                </h2>
              </div>
              <span className="hidden text-xs text-slate-500 md:inline dark:text-slate-400">
                {t("landing.key.tagline")}
              </span>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: t("landing.tile.inventory"),
                  description: t("landing.tile.inventory.desc"),
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
                  description: t("landing.tile.movement.desc"),
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
                  description: t("landing.tile.procurement.desc"),
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
                  description: t("landing.tile.mapping.desc"),
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
                  description: t("landing.tile.sync.desc"),
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
                  description: t("landing.tile.audit.desc"),
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
                  description: t("landing.tile.suppliers.desc"),
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
                  description: t("landing.tile.access.desc"),
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
                  description: t("landing.tile.qr.desc"),
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
                  description: t("landing.tile.alerts.desc"),
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
                  description: t("landing.tile.maintenance.desc"),
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
                  description: t("landing.tile.reporting.desc"),
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
                  className="rounded-3xl p-5 transition hover:-translate-y-1"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                    {item.icon}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
              <div className="text-left">
                <p className="text-2xl font-semibold uppercase tracking-[0.2em] text-slate-900 sm:text-3xl dark:text-slate-100">
                  {t("landing.cta.title")}
                </p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {t("landing.cta.subtitle")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  className="demo-arrow h-6 w-6 text-[var(--brand)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 3v14" strokeLinecap="round" />
                  <path d="m6 13 6 6 6-6" strokeLinecap="round" />
                </svg>
                <Link
                  href="/app"
                  className="demo-flip rounded-full border border-[var(--brand)] bg-[var(--brand)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
                >
                  {t("landing.cta.button")}
                </Link>
              </div>
            </div>
          </section>
        </section>

      </main>

      <footer className="mt-auto w-full bg-[var(--brand)] px-6 py-8 text-sm text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">YowSpare</p>
            <p className="mt-1 text-xs text-blue-100">{t("footer.tagline")}</p>
          </div>
          <div className="text-xs text-blue-100">
            {t("footer.register.prompt")}{" "}
            <Link href="/register" className="font-semibold text-white underline decoration-white/70">
              {t("footer.register.link")}
            </Link>
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
