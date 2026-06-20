"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgenciesService, AuthenticationService, OrganizationsService, UsersService } from "@/lib";
import type { Organization } from "@/lib";
import { InvitationsService } from "@/lib-spare/appServices";
import type { InvitationDto } from "@/lib-spare/models/InvitationDto";
import { useSession } from "@/store/session";
import { setOrganizationId, setTenantId } from "@/lib/api";
import { withAppBasePath } from "@/lib/basePath";

const ROLE_LABELS: Record<string, string> = {
  AGENCY_MANAGER: "Agency Manager",
  DEPARTMENT_CHIEF: "Department Chief",
  STAFF: "Staff Member",
};

export default function AcceptInvitationClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const { setTenant, setUser, setRoles, setActiveAgencyId, setToken } = useSession();

  const [invitation, setInvitation] = useState<InvitationDto | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err && "body" in err) {
      const body = (err as { body?: { message?: string } }).body;
      if (body?.message) return body.message;
    }
    if (typeof err === "object" && err && "message" in err) {
      return String((err as { message?: string }).message ?? "");
    }
    return "An unexpected error occurred.";
  };

  useEffect(() => {
    if (!token) {
      setInvitationError("No invitation token found in the URL.");
      setLoadingInvitation(false);
      return;
    }
    InvitationsService.validate(token)
      .then((inv) => setInvitation(inv))
      .catch((err) => setInvitationError(getErrorMessage(err) || "This invitation is invalid or has expired."))
      .finally(() => setLoadingInvitation(false));
  }, [token]);

  useEffect(() => {
    setSubmitError("");
    setFieldErrors({});
  }, [firstName, lastName, password, confirmPassword]);

  function validate() {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "Required";
    if (!lastName.trim()) errors.lastName = "Required";
    const pwd = password.trim();
    if (!pwd) {
      errors.password = "Required";
    } else if (pwd.length < 6 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      errors.password = "Min 6 chars, one uppercase letter and one number";
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Required";
    } else if (pwd && pwd !== confirmPassword.trim()) {
      errors.confirmPassword = "Passwords do not match";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleAccept() {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const res = await AuthenticationService.acceptInvitation({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: password.trim(),
      });

      if (!res?.token) {
        setSubmitError("Failed to accept invitation. Please try again.");
        return;
      }

      setToken(res.token);

      const me = res.user ?? (await UsersService.getMe());
      setUser(me);
      setRoles(me?.roles ?? []);

      const orgId = me?.organizationId ?? null;
      let org: Organization | null = null;

      if (orgId) {
        setTenantId(me?.tenantId || null);
        setOrganizationId(orgId);
        try {
          org = await OrganizationsService.getOrganizationById(orgId);
        } catch {
          org = { id: orgId };
        }
      }

      setTenant(org);

      const agencies = await AgenciesService.getAgencies();
      const primaryAgencyId = agencies?.[0]?.id ?? null;

      startTransition(() => {
        setActiveAgencyId(primaryAgencyId);
      });

      router.push("/app");
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err));
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
          {/* Left panel */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Invitation
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
              You&apos;ve been invited
            </h1>
            {invitation && (
              <p className="mt-4 max-w-xl text-base text-white">
                Join <strong>{invitation.organizationName ?? "your organization"}</strong> as{" "}
                <strong>{ROLE_LABELS[invitation.role ?? ""] ?? invitation.role}</strong>.
                Create your account below to get started.
              </p>
            )}
          </div>

          {/* Right panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-center gap-2 text-center">
              <div className="h-9 w-9 overflow-hidden rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <img src={withAppBasePath("/icons/yowspareicon.png")} alt="YowSpare icon" className="h-full w-full object-cover" />
              </div>
              <div className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                YowSpare
              </div>
            </div>

            {loadingInvitation ? (
              <p className="mt-6 text-center text-sm text-slate-500">Validating invitation…</p>
            ) : invitationError ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {invitationError}
              </div>
            ) : (
              <>
                {/* Invitation badge */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Invited to</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {invitation?.organizationName ?? "—"}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      · {ROLE_LABELS[invitation?.role ?? ""] ?? invitation?.role}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{invitation?.email}</p>
                </div>

                {/* Form */}
                <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  First name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Jamie"
                />
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}

                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Doe"
                />
                {fieldErrors.lastName && <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>}

                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
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
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}

                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm password
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
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
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
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}

                {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAccept}
                  className="mt-6 w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
                >
                  {loading ? "Creating your account…" : "Accept invitation & join"}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
