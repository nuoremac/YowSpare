"use client";

import { useEffect, useState } from "react";
import {
  AgenciesService,
  EmployeesRolesService,
  OrganizationsService,
  SettingsService,
  SystemAuditsService,
  UsersService,
} from "@/lib";
import type { Agency, Organization, OrganizationMember, Role, SystemAudit, AppBusinessSettings, User } from "@/lib";
import { useSession } from "@/store/session";

export default function AdminPage() {
  const { setTenant, tenant } = useSession();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [employees, setEmployees] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [settings, setSettings] = useState<AppBusinessSettings | null>(null);
  const [audits, setAudits] = useState<SystemAudit[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [o, a, e, r, s, au, u] = await Promise.all([
        OrganizationsService.getMyOrganizations(),
        AgenciesService.getAgencies(),
        EmployeesRolesService.getEmployees(),
        EmployeesRolesService.getRoles(),
        SettingsService.getGlobalOptions(),
        SystemAuditsService.getOrganizationActivity(10),
        UsersService.getMe(),
      ]);
      setOrgs(o || []);
      setAgencies(a || []);
      setEmployees(e || []);
      setRoles(r || []);
      setSettings(s || null);
      setAudits(au || []);
      setMe(u || null);
      if (!tenant && o?.[0]) setTenant(o[0]);
      setLoading(false);
    })();
  }, [setTenant, tenant]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Administration</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Organization, agencies, employees & roles, settings, audits, and user profile.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading admin data…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Organizations</h3>
            <div className="mt-3 space-y-2">
              {orgs.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{o.email || "—"}</div>
                </div>
              ))}
              {!orgs.length && <div className="text-sm text-gray-600 dark:text-slate-400">No organizations.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Agencies</h3>
            <div className="mt-3 space-y-2">
              {agencies.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-gray-600 dark:text-slate-400">{a.type || "—"}</div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{a.city || a.country || "—"}</div>
                </div>
              ))}
              {!agencies.length && <div className="text-sm text-gray-600 dark:text-slate-400">No agencies.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Employees</h3>
            <div className="mt-3 space-y-2">
              {employees.map((e) => (
                <div key={e.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div className="font-medium">{e.userEmail || e.userId || "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{e.roleName || "—"}</div>
                </div>
              ))}
              {!employees.length && <div className="text-sm text-gray-600 dark:text-slate-400">No employees.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Roles</h3>
            <div className="mt-3 space-y-2">
              {roles.map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{r.description || "—"}</div>
                </div>
              ))}
              {!roles.length && <div className="text-sm text-gray-600 dark:text-slate-400">No roles.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Global settings</h3>
            {settings ? (
              <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                <div>Org prefix: {settings.organizationPrefix || "—"}</div>
                <div>VAT invoice length: {settings.lengthOfVatInvoiceNumber ?? "—"}</div>
                <div>Low stock alert: {settings.lowStockAlert ? "On" : "Off"}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-600 dark:text-slate-400">No settings yet.</div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">System audits</h3>
            <div className="mt-3 space-y-2">
              {audits.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div className="font-medium">{a.action || "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{a.date || "—"}</div>
                </div>
              ))}
              {!audits.length && <div className="text-sm text-gray-600 dark:text-slate-400">No audits.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">My profile</h3>
            {me ? (
              <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                <div>Email: {me.email}</div>
                <div>Roles: {(me.roles || []).join(", ") || "—"}</div>
                <div>Status: {me.active ? "Active" : "Inactive"}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-600 dark:text-slate-400">No profile.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
