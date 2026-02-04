"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgenciesService, AuthenticationService, OrganizationsService, UsersService } from "@/lib";
import { useSession } from "@/store/session";
import { useT } from "@/components/i18n/useT";

export default function SignInClient() {
  const router = useRouter();
  const { setTenant, setUser, setRoles, setActiveAgencyId, setToken } = useSession();
  const { t } = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const getErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err && "body" in err) {
      const body = (err as { body?: { message?: string } }).body;
      if (body?.message) return body.message;
    }
    if (typeof err === "object" && err && "message" in err) {
      return String((err as { message?: string }).message || "");
    }
    return "";
  };

  async function handleLogin() {
    setAuthError("");
    if (!email.trim() || !password.trim()) {
      setAuthError(t("auth.error.invalidPassword"));
      return;
    }

    setLoading(true);
    try {
      const res = await AuthenticationService.login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (!res?.token) {
        setAuthError(t("auth.error.invalidPassword"));
        return;
      }
      setToken(res.token);

      const me = res.user || (await UsersService.getMe());
      setUser(me);
      setRoles(me?.roles || []);

      const orgs = await OrganizationsService.getMyOrganizations();
      setTenant(orgs?.[0] || null);

      const agencies = await AgenciesService.getAgencies();
      setActiveAgencyId(agencies?.[0]?.id || null);

      router.push("/app");
    } catch (err: unknown) {
      setAuthError(getErrorMessage(err) || t("auth.error.invalidPassword"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 bg-cover bg-center text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
      style={{ backgroundImage: "url(/icons/bgsignin1.webp)" }}
    >
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] leading-tight text-white">
              {t("auth.signin.label")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
              {t("auth.signin.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-tight text-white">
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
              placeholder="you@company.com"
            />

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.signin.password")}
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t("auth.signin.hide") : t("auth.signin.show")}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 3l18 18" strokeLinecap="round" />
                    <path d="M10.6 10.6a2.5 2.5 0 0 0 3.3 3.3" strokeLinecap="round" />
                    <path d="M9.3 5.7A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a18.4 18.4 0 0 1-4 4.9" strokeLinecap="round" />
                    <path d="M6.2 6.2A18.6 18.6 0 0 0 2.5 12s3.5 7 9.5 7a10.6 10.6 0 0 0 4.2-.9" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>

            {authError && <p className="mt-4 text-sm text-red-600">{authError}</p>}

            <button
              type="button"
              disabled={loading || !email.trim() || !password.trim()}
              onClick={handleLogin}
              className="mt-6 w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {loading ? t("auth.signin.loading") : t("auth.signin.button")}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              {t("auth.signin.noAccount")}{" "}
              <Link href="/register" className="font-semibold text-slate-900 underline dark:text-slate-100">
                {t("auth.signin.register")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
