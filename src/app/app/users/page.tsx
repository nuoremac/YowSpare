"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useT } from "@/components/i18n/useT";
import { AgenciesService, EmployeesRolesService, OrganizationsService } from "@/lib";
import type { Agency, Organization, OrganizationMember, Role } from "@/lib";
import { useSession } from "@/store/session";
import MovableModal from "@/components/MovableModal";
import { formatRole } from "@/lib/formatRole";
import { enrichOrganizationMembers } from "@/lib/enrichOrganizationMembers";

const formatJoinedAt = (value?: string) => {
 if (!value) return "—";
 const date = new Date(value);
 return Number.isNaN(date.getTime())
 ? value
 : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export default function UsersPage() {
 const { t } = useT();
 const { tenant, user, roles: securityRoles } = useSession();

 const [loading, setLoading] = useState(true);
 const [forbidden, setForbidden] = useState(false);
 const [error, setError] = useState("");
 const [members, setMembers] = useState<OrganizationMember[]>([]);
 const [roles, setRoles] = useState<Role[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);
 const [orgs, setOrgs] = useState<Organization[]>([]);

 const [search, setSearch] = useState("");
 const [roleFilter, setRoleFilter] = useState<string>("");
 const [agencyFilter, setAgencyFilter] = useState<string>("");
 const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

 const [selected, setSelected] = useState<OrganizationMember | null>(null);

 function Modal({
 open,
 title,
 children,
 onClose,
 }: {
 open: boolean;
 title: string;
 children: ReactNode;
 onClose: () => void;
 }) {
 return (
 <MovableModal open={open} title={title} onClose={onClose} initialWidth={760} initialHeight={560}>
 <div className="mt-4">{children}</div>
 </MovableModal>
 );
 }

 useEffect(() => {
 let mounted = true;
 (async () => {
 setLoading(true);
 setForbidden(false);
 setError("");
 try {
 const results = await Promise.allSettled([
 EmployeesRolesService.getEmployees(),
 EmployeesRolesService.getRoles(),
 AgenciesService.getAgencies(),
 OrganizationsService.getMyOrganizations(),
 ]);

 const employeesRes = results[0];
 if (employeesRes.status !== "fulfilled") {
 const status = (employeesRes.reason as any)?.status;
 if (status === 403) setForbidden(true);
 }

 const rolesRes = results[1];
 const loadedRoles = rolesRes.status === "fulfilled" ? rolesRes.value || [] : [];
 setRoles(loadedRoles);

 const agenciesRes = results[2];
 const loadedAgencies = agenciesRes.status === "fulfilled" ? agenciesRes.value || [] : [];
 setAgencies(loadedAgencies);

 if (employeesRes.status === "fulfilled") {
 setMembers(enrichOrganizationMembers(employeesRes.value || [], loadedRoles, loadedAgencies));
 }

 const orgsRes = results[3];
 if (orgsRes.status === "fulfilled") setOrgs(orgsRes.value || []);
 } catch {
 if (!mounted) return;
 setError(t("app.users.error.load"));
 } finally {
 if (mounted) setLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [t]);

 const selfMember = useMemo(() => {
 if (!user?.id && !user?.email) return null;
 return (members || []).find(
 (m) =>
 (!!user?.id && m.userId === user.id) ||
 (!!user?.email && !!m.userEmail && m.userEmail.toLowerCase() === user.email.toLowerCase())
 );
 }, [members, user?.email, user?.id]);

 const isAdmin = useMemo(() => {
 if ((securityRoles || []).some((r) => /ADMIN|OWNER/i.test(r))) return true;
 if (selfMember?.roleName && /ADMIN|OWNER/i.test(selfMember.roleName)) return true;
 // Owner heuristic: user's businessActorId equals org businessActorId (if we have it)
 if (user?.businessActorId && (orgs || []).some((o) => o.businessActorId === user.businessActorId)) return true;
 return false;
 }, [orgs, securityRoles, selfMember?.roleName, user?.businessActorId]);

 const q = search.trim().toLowerCase();
 const filtered = useMemo(() => {
 return (members || [])
 .filter((m) => {
 if (roleFilter && (m.roleId || "") !== roleFilter) return false;
 if (agencyFilter && (m.agencyId || "") !== agencyFilter) return false;
 if (statusFilter !== "all") {
 const active = m.active !== false;
 if (statusFilter === "active" && !active) return false;
 if (statusFilter === "inactive" && active) return false;
 }
 if (!q) return true;
 const hay =
 `${m.userFirstName || ""} ${m.userLastName || ""} ${m.userEmail || ""} ${m.roleName || ""} ${m.agencyName || ""}`.toLowerCase();
 return hay.includes(q);
 })
 .sort((a, b) => String(a.userEmail || "").localeCompare(String(b.userEmail || "")));
 }, [agencyFilter, members, q, roleFilter, statusFilter]);

 const roleOptions = useMemo(() => {
 const used = new Map<string, string>();
 (roles || []).forEach((r) => {
 if (r.id && r.name) used.set(r.id, r.name);
 });
 return Array.from(used.entries()).map(([id, name]) => ({ id, name }));
 }, [roles]);

 const agencyOptions = useMemo(() => {
 return (agencies || [])
 .filter((a) => !!a.id)
 .map((a) => ({ id: a.id as string, name: a.name || "—" }))
 .sort((a, b) => a.name.localeCompare(b.name));
 }, [agencies]);

 const removeMember = async (m: OrganizationMember) => {
 if (!m.id) return;
 const ok = window.confirm(t("app.users.remove.confirm"));
 if (!ok) return;
 try {
 await EmployeesRolesService.removeEmployee(m.id);
 setMembers((prev) => prev.filter((x) => x.id !== m.id));
 setSelected(null);
 } catch {
 setError(t("app.users.remove.error"));
 }
 };

 return (
 <main className="p-6 space-y-4">
 <div className="ys-header-card p-5">
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground ">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM16 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeLinecap="round" />
 <path d="M3.5 20v-1.5a4.5 4.5 0 0 1 9 0V20M13.5 20v-1a3.5 3.5 0 0 1 7 0V20" strokeLinecap="round" />
 </svg>
 </span>
 <h2 className="text-lg font-semibold">{t("app.users.title")}</h2>
 </div>
 <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">{t("app.users.subtitle")}</p>
 </div>

 <section className="ys-card p-5">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
 <div className="w-full max-w-xl">
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.users.search")}</label>
 <div className="relative mt-1">
 <svg
 viewBox="0 0 24 24"
 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
 fill="none"
 stroke="currentColor"
 strokeWidth="1.6"
 >
 <path d="M10.5 18a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 10.5 18Z" strokeLinecap="round" />
 <path d="M16.3 16.3 21 21" strokeLinecap="round" />
 </svg>
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder={t("app.users.search.placeholder")}
 className="w-full border border-border bg-card rounded-xl py-2 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-blue-300 dark:focus:border-blue-600"
 />
 </div>
 </div>
 <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.users.filter.role")}</label>
 <select
 value={roleFilter}
 onChange={(e) => setRoleFilter(e.target.value)}
 className="mt-1 w-full border border-border bg-card rounded-xl px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-300 "
 >
 <option value="">{t("app.users.filter.allRoles")}</option>
 {roleOptions.map((r) => (
 <option key={r.id} value={r.id}>
 {r.name}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.users.filter.agency")}</label>
 <select
 value={agencyFilter}
 onChange={(e) => setAgencyFilter(e.target.value)}
 className="mt-1 w-full border border-border bg-card rounded-xl px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-300 "
 >
 <option value="">{t("app.users.filter.allAgencies")}</option>
 {agencyOptions.map((a) => (
 <option key={a.id} value={a.id}>
 {a.name}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.users.filter.status")}</label>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as any)}
 className="mt-1 w-full border border-border bg-card rounded-xl px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-300 "
 >
 <option value="all">{t("app.users.filter.status.all")}</option>
 <option value="active">{t("app.users.filter.status.active")}</option>
 <option value="inactive">{t("app.users.filter.status.inactive")}</option>
 </select>
 </div>
 </div>
 </div>

 {error && (
 <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
 {error}
 </div>
 )}

 {loading ? (
 <div className="mt-4 text-sm text-muted-foreground dark:text-muted-foreground">{t("app.users.loading")}</div>
 ) : forbidden ? (
 <div className="mt-4 text-sm text-muted-foreground dark:text-muted-foreground">{t("app.users.forbidden")}</div>
 ) : (
 <div className="mt-4 overflow-auto border border-border rounded-xl ">
 <table className="min-w-[900px] w-full text-left text-sm">
 <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:text-muted-foreground">
 <tr>
 <th className="px-3 py-2">{t("app.users.col.user")}</th>
 <th className="px-3 py-2">{t("app.users.col.email")}</th>
 <th className="px-3 py-2">{t("app.users.col.role")}</th>
 <th className="px-3 py-2">{t("app.users.col.agency")}</th>
 <th className="px-3 py-2">{t("app.users.col.status")}</th>
 <th className="px-3 py-2">{t("app.users.col.joined")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-foreground dark:divide-slate-800 ">
 {filtered.map((m) => {
 const fullName = `${m.userFirstName || ""} ${m.userLastName || ""}`.trim();
 const active = m.active !== false;
 return (
 <tr
 key={m.id}
 className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950"
 onClick={() => setSelected(m)}
 >
 <td className="px-3 py-2 font-medium">{fullName || "—"}</td>
 <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">{m.userEmail || "—"}</td>
 <td className="px-3 py-2">{formatRole(m.roleName)}</td>
 <td className="px-3 py-2">{m.agencyName || "—"}</td>
 <td className="px-3 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">
 {active ? t("app.users.status.active") : t("app.users.status.inactive")}
 </span>
 </td>
 <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">{formatJoinedAt(m.joinedAt)}</td>
 </tr>
 );
 })}
 {!filtered.length && (
 <tr>
 <td className="px-3 py-3 text-muted-foreground dark:text-muted-foreground" colSpan={6}>
 {t("app.users.empty")}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <Modal open={!!selected} title={t("app.users.details.title")} onClose={() => setSelected(null)}>
 {selected && (
 <div className="space-y-3 text-sm text-foreground ">
 <div className="border border-border rounded-xl bg-slate-50 p-4 ">
 <div className="ys-section-title">
 {t("app.users.details.section.profile")}
 </div>
 <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.users.col.user")}</span>
 <span className="font-medium">{`${selected.userFirstName || ""} ${selected.userLastName || ""}`.trim() || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.users.col.email")}</span>
 <span className="font-medium">{selected.userEmail || "—"}</span>
 </li>
 </ul>
 </div>

 <div className="border border-border rounded-xl bg-slate-50 p-4 ">
 <div className="ys-section-title">
 {t("app.users.details.section.access")}
 </div>
 <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.users.col.role")}</span>
 <span className="font-medium">{formatRole(selected.roleName)}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.users.col.agency")}</span>
 <span className="font-medium">{selected.agencyName || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.users.col.status")}</span>
 <span className="font-medium">
 {selected.active !== false ? t("app.users.status.active") : t("app.users.status.inactive")}
 </span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.users.col.joined")}</span>
 <span className="font-medium">{formatJoinedAt(selected.joinedAt)}</span>
 </li>
 </ul>
 </div>

 {isAdmin && (
 <div className="flex items-center justify-end">
 <button
 type="button"
 onClick={() => void removeMember(selected)}
 className="border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
 >
 {t("app.users.remove")}
 </button>
 </div>
 )}
 </div>
 )}
 </Modal>
 </main>
 );
}
