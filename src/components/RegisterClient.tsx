"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { getDB } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import type { Agency, Tenant, User } from "@/lib/type";
import { uid } from "@/lib/utils";
import { useT } from "@/components/i18n/useT";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "demo";
}

export default function RegisterClient() {
  const router = useRouter();
  const { setTenant, setUser, setRole, setActiveAgencyId } = useSession();
  const { t } = useT();

  const [orgName, setOrgName] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setError("");
    setFieldErrors({});
  }, [orgName, name, email, password, confirmPassword]);

  async function handleRegister() {
    setError("");
    const nextErrors: Record<string, string> = {};
    if (!orgName.trim()) nextErrors.orgName = t("auth.register.error.required");
    if (!hqLocation.trim()) nextErrors.hqLocation = t("auth.register.error.required");
    if (!name.trim()) nextErrors.adminName = t("auth.register.error.required");
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
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    const slug = slugify(orgName);
    await seedIfEmpty(slug);
    const db = await getDB();

    const tenant = await db.get("tenant", "current");
    if (!tenant) {
      setLoading(false);
      setError(t("auth.register.error.failed"));
      return;
    }

    const existing = await db.getAllFromIndex("users", "by_tenant", tenant.id);
    if (existing.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setLoading(false);
      setError(t("auth.register.error.emailTaken"));
      return;
    }

    const nextTenant: Tenant = {
      ...tenant,
      name: orgName.trim(),
      profile: {
        ...tenant.profile,
        email: email.trim().toLowerCase(),
        headquarterAgencyId: "a_hq",
      },
    };
    await db.put("tenant", nextTenant, "current");

    const agencyId = "a_hq";
    const agency: Agency = {
      id: agencyId,
      organizationId: nextTenant.id,
      name: t("auth.register.hqName"),
      location: hqLocation.trim() || undefined,
      ownerId: "u_org_admin",
    };

    await db.clear("users");
    await db.clear("agencies");

    const admin: User = {
      id: "u_org_admin",
      tenantId: nextTenant.id,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: "ORG_ADMIN",
      agencyId,
      password: password.trim(),
    };

    await db.put("agencies", agency);
    await db.put("users", admin);
    await db.put("user_agencies", {
      id: "ua_org_admin_hq",
      tenantId: nextTenant.id,
      userId: admin.id,
      agencyId,
      role: "ORG_ADMIN",
    });

    startTransition(() => {
      setTenant(nextTenant);
      setUser(admin);
      setRole("ORG_ADMIN");
      setActiveAgencyId(agencyId);
    });

    router.push("/app");
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 bg-cover bg-center text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
      style={{ backgroundImage: "url(/icons/bgsignin1.webp)" }}
    >
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {t("auth.register.label")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight dark:text-slate-100">
              {t("auth.register.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
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
              <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <img src="/icons/yowspareicon.png" alt="YowSpare icon" className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                YowSpare
              </div>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.orgName")}
            </label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
              placeholder="YowSpare Industries"
            />
            {fieldErrors.orgName && <p className="mt-2 text-xs text-red-600">{fieldErrors.orgName}</p>}

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

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.adminName")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
              placeholder="Admin name"
            />
            {fieldErrors.adminName && <p className="mt-2 text-xs text-red-600">{fieldErrors.adminName}</p>}

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.email")}
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
              placeholder="name@company.com"
            />
            {fieldErrors.email && <p className="mt-2 text-xs text-red-600">{fieldErrors.email}</p>}

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.password")}
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
            {fieldErrors.password && <p className="mt-2 text-xs text-red-600">{fieldErrors.password}</p>}

            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.confirmPassword")}
            </label>
            <div className="relative mt-2">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                {showConfirm ? (
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
            {fieldErrors.confirmPassword && (
              <p className="mt-2 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-40"
            >
              {t("auth.register.button")}
            </button>

            <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              {t("auth.register.haveAccount")}{" "}
              <Link href="/signin" className="font-semibold text-[var(--brand)]">
                {t("auth.register.signin")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
