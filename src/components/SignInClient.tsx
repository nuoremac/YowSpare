"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { getTenantSlugFromHost } from "@/lib/tenant";
import { seedIfEmpty } from "@/lib/seed";
import { getDB } from "@/lib/db";
import type { Agency, Invite, User, UserAgency } from "@/lib/type";
import { useT } from "@/components/i18n/useT";

export default function SignInClient() {
  const router = useRouter();
  const { setTenant, setUser, setRole, setActiveAgencyId } = useSession();
  const { t } = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userAgencies, setUserAgencies] = useState<UserAgency[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
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
      const ua = await db.getAllFromIndex("user_agencies", "by_tenant", tenant.id);
      const ag = await db.getAllFromIndex("agencies", "by_org", tenant.id);
      if (!alive) return;

      startTransition(() => {
        setUsers(u);
        setUserAgencies(ua);
        setAgencies(ag);
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
  const memberships = selectedUser
    ? userAgencies.filter((ua) => ua.userId === selectedUser.id)
    : [];
  const selectedMembership =
    memberships.find((m) => m.agencyId === selectedAgencyId) || memberships[0];
  const canEnter = !!selectedUser && !loading && password.trim().length > 0;

  useEffect(() => {
    if (memberships.length && !selectedAgencyId) {
      setSelectedAgencyId(memberships[0].agencyId);
    }
  }, [memberships, selectedAgencyId]);

  function persistInvites(next: Invite[]) {
    if (!selectedUser && !users.length) return;
    setInvites(next);
    const tenantId = users[0]?.tenantId;
    if (!tenantId) return;
    localStorage.setItem(`yowspare_invites_${tenantId}`, JSON.stringify(next));
  }

  async function handleLogin() {
    setAuthError("");
    if (!selectedUser) {
      setAuthError(t("auth.error.noAccount"));
      return;
    }
    if (!selectedUser.password) {
      setAuthError(t("auth.error.noPassword"));
      return;
    }
    if (selectedUser.password !== password) {
      setAuthError(t("auth.error.invalidPassword"));
      return;
    }
    if (!selectedMembership) {
      setAuthError(t("auth.error.noAgency"));
      return;
    }
    setUser(selectedUser);
    setRole(selectedMembership.role);
    setActiveAgencyId(selectedMembership.agencyId);
    router.push("/app");
  }

  async function acceptInvite(inviteId: string) {
    setInviteError("");
    const inv = invites.find((i) => i.id === inviteId);
    if (!inv || inv.status !== "PENDING") return;
    const pwd = invitePasswords[inviteId]?.trim() || "";
    if (pwd.length < 6) {
      setInviteError(t("auth.error.shortPassword"));
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
    if (inv.agencyId) {
      const membership: UserAgency = {
        id: `ua_${inv.id}`,
        tenantId: inv.tenantId,
        userId: newUser.id,
        agencyId: inv.agencyId,
        role: inv.role,
      };
      await db.put("user_agencies", membership);
    }
    const nextInvites = invites.map((i) =>
      i.id === inviteId ? { ...i, status: "ACCEPTED" as const } : i
    );
    persistInvites(nextInvites);
    const refreshed = await db.getAllFromIndex("users", "by_tenant", inv.tenantId);
    const refreshedAgencies = await db.getAllFromIndex("user_agencies", "by_tenant", inv.tenantId);
    setUsers(refreshed);
    setUserAgencies(refreshedAgencies);
    setEmail(inv.email);
    setPassword(pwd);
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 bg-cover bg-center text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
      style={{ backgroundImage: "url(/icons/bgsignin1.webp)" }}
    >
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] leading-tight dark:text-slate-100">
              {t("auth.signin.label")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight dark:text-slate-100">
              {t("auth.signin.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-tight dark:text-slate-100">
              {t("auth.signin.subtitle")}
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center text-white hover:text-[var(--brand)]"
                aria-label={t("auth.signin.back")}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {loading ? (
              <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                <p>{t("auth.signin.loading")}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-center">
                  <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                    <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                    YowSpare
                  </div>
                </div>
                <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("auth.signin.email")}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="name@company.com"
                />

                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("auth.signin.password")}
                </label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M4 4l16 16" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {memberships.length > 1 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("auth.signin.agency")}
                    </label>
                    <select
                      value={selectedAgencyId || memberships[0]?.agencyId || ""}
                      onChange={(e) => setSelectedAgencyId(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                    >
                      {memberships.map((membership) => {
                        const agency = agencies.find((a) => a.id === membership.agencyId);
                        return (
                          <option key={membership.id} value={membership.agencyId}>
                            {agency?.name || membership.agencyId}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div className="mt-2 text-right">
                  <Link href="/help" className="text-xs text-[var(--brand)] hover:text-[var(--brand)] dark:text-slate-400">
                    {t("auth.signin.forgot")}
                  </Link>
                </div>

                <button
                  type="button"
                  disabled={!canEnter}
                  onClick={handleLogin}
                  className="mt-6 w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-40"
                >
                  {t("auth.signin.button")}
                </button>

                {authError && (
                  <p className="mt-3 text-xs text-red-600">{authError}</p>
                )}

                <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                  {t("auth.signin.noAccount")}{" "}
                  <Link href="/register" className="font-semibold text-[var(--brand)]">
                    {t("auth.signin.register")}
                  </Link>
                </div>

                {invites.some((inv) => inv.status === "PENDING") && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t("auth.invites.title")}
                    </p>
                    <div className="mt-3 space-y-3">
                      {invites
                        .filter((inv) => inv.status === "PENDING")
                        .map((inv) => (
                          <div key={inv.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.email}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Role: {inv.role}</div>
                            <input
                              type="password"
                              value={invitePasswords[inv.id] || ""}
                              onChange={(e) =>
                                setInvitePasswords((prev) => ({ ...prev, [inv.id]: e.target.value }))
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                              placeholder={t("auth.invites.passwordPlaceholder")}
                            />
                            <button
                              type="button"
                              onClick={() => acceptInvite(inv.id)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                            >
                              {t("auth.invites.accept")}
                            </button>
                          </div>
                        ))}
                    </div>
                    {inviteError && (
                      <p className="mt-3 text-xs text-red-600">{inviteError}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
