"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AgenciesService,
  AuthenticationService,
  BusinessActorsService,
  OrganizationsService,
  UsersService,
} from "@/lib";
import type { User } from "@/lib";
import { useSession } from "@/store/session";
import { useT } from "@/components/i18n/useT";
import { setOrganizationId, setTenantId } from "@/lib/api";
import { withAppBasePath } from "@/lib/basePath";

export default function RegisterClient() {
  const router = useRouter();
  const { setTenant, setUser, setRoles, setActiveAgencyId, setToken } = useSession();
  const { t } = useT();

  const [step, setStep] = useState<1 | 2>(1);
  const [hqLocation, setHqLocation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    setError("");
    setFieldErrors({});
  }, [firstName, lastName, company, email, password, confirmPassword, hqLocation, step]);

  function validateStep(nextStep?: 1 | 2) {
    const targetStep = nextStep ?? step;
    const nextErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (!firstName.trim()) nextErrors.firstName = t("auth.register.error.required");
      if (!lastName.trim()) nextErrors.lastName = t("auth.register.error.required");
      if (!company.trim()) nextErrors.company = t("auth.register.error.required");
      if (!email.trim()) nextErrors.email = t("auth.register.error.required");
      if (!password.trim()) nextErrors.password = t("auth.register.error.required");
      if (!confirmPassword.trim()) nextErrors.confirmPassword = t("auth.register.error.required");
      const pwd = password.trim();
      if (pwd && (pwd.length < 6 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd))) {
        nextErrors.password = t("auth.register.error.passwordRules");
      }
      if (pwd && confirmPassword.trim() && pwd !== confirmPassword.trim()) {
        nextErrors.confirmPassword = t("auth.register.error.mismatch");
      }
    } else {
      if (!hqLocation.trim()) nextErrors.hqLocation = t("auth.register.error.required");
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleRegister() {
    setError("");
    if (!validateStep(2) || !validateStep(1)) return;

    setLoading(true);
    try {
      const pwd = password.trim();
      // register is now idempotent and returns a token directly (same shape as login)
      const regResponse = await AuthenticationService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        password: pwd,
      }) as unknown as {
        token?: string;
        user?: User;
      };

      if (!regResponse?.token) {
        setError(t("auth.register.error.failed"));
        return;
      }
      setToken(regResponse.token);
      setTenantId(regResponse.user?.tenantId || null);

      const businessActor = await BusinessActorsService.onboardUser({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        businessAddress: hqLocation.trim(),
        businessProfile: company.trim(),
      });

      await UsersService.updateMyPlan({ plan: "FREELANCE" });

      const organization = await OrganizationsService.createOrganization({
        businessActorId: businessActor.id,
        name: company.trim(),
        email: email.trim().toLowerCase(),
        description: `${company.trim()} HQ`,
      });

      setOrganizationId(organization?.id || null);

      let authenticatedUser = regResponse.user;
      try {
        const refreshedSession = await AuthenticationService.login({
          email: email.trim().toLowerCase(),
          password: pwd,
        });
        if (refreshedSession?.token) {
          setToken(refreshedSession.token);
          authenticatedUser = refreshedSession.user || authenticatedUser;
          setTenantId(authenticatedUser?.tenantId || null);
        }
      } catch {
        // The owner check still grants the correct UI access if session refresh is temporarily unavailable.
      }

      const agencies = await AgenciesService.getAgencies();
      const agency = agencies?.[0];

      const baseUser = authenticatedUser || (await UsersService.getMe());
      const me = {
        ...baseUser,
        firstName: baseUser.firstName || firstName.trim(),
        lastName: baseUser.lastName || lastName.trim(),
      };

      startTransition(() => {
        setTenant(organization || null);
        setUser(me);
        setRoles(me?.roles || []);
        setActiveAgencyId(agency?.id || null);
      });

      router.push("/app");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t("auth.register.error.failed"));
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
              {t("auth.register.label")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
              {t("auth.register.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white">
              {t("auth.register.subtitle")}
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
              <div className="h-9 w-9 overflow-hidden rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <img src={withAppBasePath("/icons/yowspareicon.png")} alt="YowSpare icon" className="h-full w-full object-cover" />
              </div>
            <div className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
              YowSpare
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <span>{step === 1 ? t("auth.register.step1") : t("auth.register.step2")}</span>
            <span className="text-slate-400 dark:text-slate-500">{t("auth.register.stepTotal")}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {step === 1 ? t("auth.register.step1.help") : t("auth.register.step2.help")}
          </p>

          {step === 1 ? (
            <>
              <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.firstName")}
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Jamie"
              />
              {fieldErrors.firstName && <p className="mt-2 text-xs text-red-600">{fieldErrors.firstName}</p>}

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.lastName")}
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Doe"
              />
              {fieldErrors.lastName && <p className="mt-2 text-xs text-red-600">{fieldErrors.lastName}</p>}

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.email")}
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="you@company.com"
              />
              {fieldErrors.email && <p className="mt-2 text-xs text-red-600">{fieldErrors.email}</p>}

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.company")}
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="YowSpare Industries"
              />
              {fieldErrors.company && <p className="mt-2 text-xs text-red-600">{fieldErrors.company}</p>}

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.password")}
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
                  aria-label={showPassword ? t("auth.register.hide") : t("auth.register.show")}
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
              {fieldErrors.password && <p className="mt-2 text-xs text-red-600">{fieldErrors.password}</p>}

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.confirmPassword")}
              </label>
              <div className="relative mt-2">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? t("auth.register.hide") : t("auth.register.show")}
                >
                  {showConfirm ? (
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
              {fieldErrors.confirmPassword && (
                <p className="mt-2 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </>
          ) : (
            <>
              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.hqLocation")}
              </label>
              <input
                value={hqLocation}
                onChange={(e) => setHqLocation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Douala, Cameroon"
              />
              {fieldErrors.hqLocation && <p className="mt-2 text-xs text-red-600">{fieldErrors.hqLocation}</p>}
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(1)) setStep(2);
                }}
                className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
              >
                {t("auth.register.next")}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleRegister}
                className="w-2/3 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
              >
                {loading ? t("auth.register.loading") : t("auth.register.button")}
              </button>
            )}
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
