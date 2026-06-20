"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
 AgenciesService,
 EmployeesRolesService,
 EnterpriseRolesService,
 OrganizationsService,
 SettingsService,
 UsersService,
} from "@/lib";
import { formatRole, formatRoles } from "@/lib/formatRole";
import type {
 Agency,
 AgencyRequest,
 AppBusinessSettings,
 AppBusinessSettingsRequest,
 CreateEmployeeRequest,
 Organization,
 OrganizationMember,
 Role,
 User,
} from "@/lib";
import type { EnterprisePermission } from "@/lib";
import { useSession } from "@/store/session";
import { useT } from "@/components/i18n/useT";
import MovableModal from "@/components/MovableModal";
import { DepartmentsService } from "@/lib-spare/appServices";
import type { Department, DepartmentMember } from "@/lib-spare/appServices";
import {
 hasAuthority,
 hasFullOrganizationAccess,
 isAdministrativeAuthority,
} from "@/lib/accessControl";
import { enrichOrganizationMembers } from "@/lib/enrichOrganizationMembers";

type Toast = { tone: "success" | "error"; message: string };

function getApiErrorMessage(error: unknown) {
 if (typeof error === "object" && error && "body" in error) {
 const body = (error as { body?: { message?: string } }).body;
 if (body?.message) return body.message;
 }
 if (typeof error === "object" && error && "message" in error) {
 return String((error as { message?: string }).message || "");
 }
 return "";
}

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

function clampPage(page: number, totalPages: number) {
 if (totalPages <= 1) return 1;
 return Math.min(Math.max(1, page), totalPages);
}

function paginate<T>(items: T[], page: number, pageSize: number) {
 const start = (page - 1) * pageSize;
 return items.slice(start, start + pageSize);
}

function toRoleCode(value: string) {
 return value
 .normalize("NFKD")
 .replace(/[\u0300-\u036f]/g, "")
 .replace(/[^a-zA-Z0-9]+/g, "_")
 .replace(/^_+|_+$/g, "")
 .toUpperCase()
 .slice(0, 64);
}

const PROTECTED_ROLE_CODES = new Set([
 "GENERAL_ADMIN",
 "SYSTEM_ADMIN",
 "IAM_ADMIN",
 "TENANT_ADMIN",
 "ORGANIZATION_ADMIN",
 "AGENCY_ADMIN",
 "SALES_MANAGER",
 "INVENTORY_MANAGER",
 "ACCOUNTANT",
 "TREASURY_OFFICER",
 "RESOURCE_MANAGER",
 "HR_MANAGER",
 "PAYROLL_MANAGER",
 "BLOCKCHAIN_OPERATOR",
]);

function roleCode(role: Role) {
 return (role.description || "").trim().toUpperCase();
}

function isProtectedRole(role: Role) {
 return PROTECTED_ROLE_CODES.has(roleCode(role));
}

function toCsvCell(value: unknown) {
 const s = value == null ? "" : String(value);
 const escaped = s.replaceAll('"', '""');
 return `"${escaped}"`;
}

export default function AdminPage() {
 const {
 setTenant,
 tenant,
 user: sessionUser,
 roles: sessionRoles,
 } = useSession();
 const { t } = useT();

 const ROLE_DESC_KEYS = useMemo(
 () =>
 ({
 ROLE_ADMIN: "app.roles.ROLE_ADMIN.desc",
 ROLE_STAFF: "app.roles.ROLE_STAFF.desc",
 ROLE_STOCK_MANAGER: "app.roles.ROLE_STOCK_MANAGER.desc",
 ROLE_USER: "app.roles.ROLE_USER.desc",
 ROLE_WAREHOUSE_CLERK: "app.roles.ROLE_WAREHOUSE_CLERK.desc",
 ROLE_MANAGER: "app.roles.ROLE_MANAGER.desc",
 ROLE_AUDITOR: "app.roles.ROLE_AUDITOR.desc",
 ROLE_PROCUREMENT_MANAGER: "app.roles.ROLE_PROCUREMENT_MANAGER.desc",
 ROLE_MAINTENANCE_TECHNICIAN: "app.roles.ROLE_MAINTENANCE_TECHNICIAN.desc",
 ROLE_REQUESTER: "app.roles.ROLE_REQUESTER.desc",
 ROLE_VIEWER: "app.roles.ROLE_VIEWER.desc",
 ROLE_AGENCY_ADMIN: "app.roles.ROLE_AGENCY_ADMIN.desc",
 }) as const,
 []
 );

 const roleDescription = (role: Role) => {
 const name = (role.name || "").trim();
 const key = (ROLE_DESC_KEYS as any)[name] as (typeof ROLE_DESC_KEYS)[keyof typeof ROLE_DESC_KEYS] | undefined;
 if (key) return t(key);
 return role.description || "—";
 };

 const [orgs, setOrgs] = useState<Organization[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);
 const [departments, setDepartments] = useState<Department[]>([]);
 const [employees, setEmployees] = useState<OrganizationMember[]>([]);
 const [roles, setRoles] = useState<Role[]>([]);
 const [settings, setSettings] = useState<AppBusinessSettings | null>(null);
 const [settingsForbidden, setSettingsForbidden] = useState(false);
 const [me, setMe] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [toast, setToast] = useState<Toast | null>(null);

 const isAdmin = useMemo(() => {
 const list = sessionRoles || [];
 if (
 hasFullOrganizationAccess({
 authorities: list,
 user: sessionUser,
 organization: tenant,
 })
 ) {
 return true;
 }

 const isOwnerByOrg =
 !!me?.businessActorId &&
 (orgs || []).some(
 (o) =>
 !!o.businessActorId &&
 o.businessActorId.toLowerCase() === me.businessActorId?.toLowerCase(),
 );
 if (isOwnerByOrg) return true;

 const selfMember = (employees || []).find(
 (m) =>
 (!!me?.id && m.userId === me.id) ||
 (!!me?.email && !!m.userEmail && m.userEmail.toLowerCase() === me.email.toLowerCase())
 );
 if (
 selfMember?.roleName &&
 (isAdministrativeAuthority([selfMember.roleName]) || /OWNER/i.test(selfMember.roleName))
 ) return true;

 return false;
 }, [
 employees,
 me?.businessActorId,
 me?.email,
 me?.id,
 orgs,
 sessionRoles,
 sessionUser,
 tenant,
 ]);
 const canManageRoles =
 isAdmin || hasAuthority(sessionRoles, "administration:roles:write");

 const [search, setSearch] = useState("");
 const hiddenRoleNames = useMemo(
 () => new Set(["ROLE_VIEWER", "ROLE_AGENCY_MANAGER", "ROLE_AGENCY_ADMIN", "ROLE_AUDITOR"]),
 []
 );
 const isHiddenRoleName = (name?: string) => hiddenRoleNames.has((name || "").trim().toUpperCase());

 const [agenciesPage, setAgenciesPage] = useState(1);
 const [departmentsPage, setDepartmentsPage] = useState(1);
 const [employeesPage, setEmployeesPage] = useState(1);
 const [rolesPage, setRolesPage] = useState(1);
 const pageSize = 8;

 const [agencyModalOpen, setAgencyModalOpen] = useState(false);
 const [agencySaving, setAgencySaving] = useState(false);
 const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
 const [agencyForm, setAgencyForm] = useState<AgencyRequest>({
 name: "",
 type: "HQ",
 address: "",
 city: "",
 timezone: "",
 headquarter: false,
 });

 const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
 const [departmentSaving, setDepartmentSaving] = useState(false);
 const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
 const [departmentForm, setDepartmentForm] = useState({
 agencyId: "",
 code: "",
 name: "",
 active: true,
 });
 const [departmentMembersModalOpen, setDepartmentMembersModalOpen] = useState(false);
 const [membersLoading, setMembersLoading] = useState(false);
 const [memberSaving, setMemberSaving] = useState(false);
 const [selectedDepartmentForMembers, setSelectedDepartmentForMembers] = useState<Department | null>(null);
 const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
 const [assignMemberUserId, setAssignMemberUserId] = useState("");
 const [memberSearch, setMemberSearch] = useState("");
 const [memberSearchOpen, setMemberSearchOpen] = useState(false);

 const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
 const [employeeSaving, setEmployeeSaving] = useState(false);
 const [showEmployeePassword, setShowEmployeePassword] = useState(false);
 const [employeeForm, setEmployeeForm] = useState<CreateEmployeeRequest>({
 firstName: "",
 lastName: "",
 email: "",
 password: "",
 roleId: "",
 agencyId: "",
 });

 const [roleModalOpen, setRoleModalOpen] = useState(false);
 const [roleSaving, setRoleSaving] = useState(false);
 const [roleDeletingId, setRoleDeletingId] = useState<string | null>(null);
 const [editingRole, setEditingRole] = useState<Role | null>(null);
 const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false);
 const [availablePermissions, setAvailablePermissions] = useState<EnterprisePermission[]>([]);
 const [roleCodeEdited, setRoleCodeEdited] = useState(false);
 const [roleForm, setRoleForm] = useState({
 name: "",
 code: "",
 permissions: [] as string[],
 });

 const [settingsEditing, setSettingsEditing] = useState(false);
 const [settingsSaving, setSettingsSaving] = useState(false);
 const [settingsForm, setSettingsForm] = useState<AppBusinessSettingsRequest>({
 organizationPrefix: "",
 negotiateSellingPrice: false,
 sellingPriceIncludeVat: false,
 authorizeExceptionalDiscount: false,
 grantableDiscountRate: undefined,
 lengthOfVatInvoiceNumber: undefined,
 prefixOfVatInvoiceNumber: "",
 lowStockAlert: false,
 preventiveMaintenanceAlert: false,
 });

 const [ownershipModalOpen, setOwnershipModalOpen] = useState(false);
 const [ownershipSaving, setOwnershipSaving] = useState(false);
 const [ownershipOrgId, setOwnershipOrgId] = useState("");
 const [ownershipNewOwnerId, setOwnershipNewOwnerId] = useState("");

 const resolveOwner = (org: Organization) => {
 const members = (employees || []).filter((m) => !org.id || !m.organizationId || m.organizationId === org.id);
 const byManager = org.managerId ? members.find((m) => m.userId === org.managerId) : undefined;
 const byRole =
 members.find((m) => /OWNER/i.test(m.roleName || "")) ||
 members.find((m) => /ADMIN/i.test(m.roleName || ""));
 const member = byManager || byRole;

 const fromMember = member
 ? {
 name: `${member.userFirstName || ""} ${member.userLastName || ""}`.trim() || "—",
 email: member.userEmail || "",
 }
 : null;

 const fromMe =
 !fromMember &&
 me?.businessActorId &&
 org.businessActorId &&
 me.businessActorId === org.businessActorId
 ? {
 name: `${me.firstName || ""} ${me.lastName || ""}`.trim() || "—",
 email: me.email || "",
 }
 : null;

 return fromMember || fromMe || { name: "—", email: "" };
 };

 const hasHeadquarter = useMemo(() => {
 return (agencies || []).some((a) => !!a.isHeadquarter && a.isActive !== false);
 }, [agencies]);

 const loadAll = async () => {
 setLoading(true);
 setError("");
 try {
 const results = await Promise.allSettled([
 OrganizationsService.getMyOrganizations(),
 AgenciesService.getAgencies(),
 DepartmentsService.list(),
 EmployeesRolesService.getEmployees(),
 EmployeesRolesService.getRoles(),
 SettingsService.getGlobalOptions(),
 UsersService.getMe(),
 ]);

 const orgRes = results[0];
 const agenciesRes = results[1];
 const departmentsRes = results[2];
 const employeesRes = results[3];
 const rolesRes = results[4];
 const settingsRes = results[5];
 const meRes = results[6];

 const o = orgRes.status === "fulfilled" ? orgRes.value : [];
 const a = agenciesRes.status === "fulfilled" ? agenciesRes.value : [];
 const d = departmentsRes.status === "fulfilled" ? departmentsRes.value : [];
 const e = employeesRes.status === "fulfilled" ? employeesRes.value : [];
 const r = rolesRes.status === "fulfilled" ? rolesRes.value : [];

 let s: AppBusinessSettings | null = null;
 if (settingsRes.status === "fulfilled") {
 s = settingsRes.value || null;
 setSettingsForbidden(false);
 } else {
 const status = (settingsRes.reason as any)?.status;
 setSettingsForbidden(status === 403);
 }

 const u = meRes.status === "fulfilled" ? meRes.value : null;

 setOrgs(o || []);
 setAgencies(a || []);
 setDepartments(d || []);
 const visibleRoles = (r || []).filter((role) => !isHiddenRoleName(role.name));
 setEmployees(enrichOrganizationMembers(e || [], visibleRoles, a || []));
 setRoles(visibleRoles);
 setSettings(s || null);
 setMe(u || null);
 if (!tenant && o?.[0]) setTenant(o[0]);

 setSettingsForm({
 organizationPrefix: s?.organizationPrefix || "",
 negotiateSellingPrice: !!s?.negotiateSellingPrice,
 sellingPriceIncludeVat: !!s?.sellingPriceIncludeVat,
 authorizeExceptionalDiscount: !!s?.authorizeExceptionalDiscount,
 grantableDiscountRate: s?.grantableDiscountRate ?? undefined,
 lengthOfVatInvoiceNumber: s?.lengthOfVatInvoiceNumber ?? undefined,
 prefixOfVatInvoiceNumber: s?.prefixOfVatInvoiceNumber || "",
 lowStockAlert: !!s?.lowStockAlert,
 preventiveMaintenanceAlert: !!s?.preventiveMaintenanceAlert,
 });
 } catch (err) {
 setError(t("app.admin.error.load"));
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 void loadAll();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [setTenant, tenant]);

 useEffect(() => {
 if (!toast) return;
 const id = setTimeout(() => setToast(null), 3500);
 return () => clearTimeout(id);
 }, [toast]);

 const q = search.trim().toLowerCase();

 const filteredAgencies = useMemo(() => {
 if (!q) return agencies;
 return agencies.filter((a) => {
 const hay = `${a.name || ""} ${a.type || ""} ${a.city || ""} ${a.address || ""} ${a.timezone || ""}`.toLowerCase();
 return hay.includes(q);
 });
 }, [agencies, q]);

 const agencyNameById = useMemo(() => {
 const map = new Map<string, string>();
 (agencies || []).forEach((agency) => {
 if (!agency.id) return;
 map.set(agency.id, agency.name || agency.id);
 });
 return map;
 }, [agencies]);

 const filteredDepartments = useMemo(() => {
 if (!q) return departments;
 return departments.filter((d) => {
 const agencyName = agencyNameById.get(d.agencyId) || "";
 const hay = `${d.code || ""} ${d.name || ""} ${agencyName} ${d.active ? "active" : "inactive"}`.toLowerCase();
 return hay.includes(q);
 });
 }, [departments, q, agencyNameById]);

 const employeeByUserId = useMemo(() => {
 const map = new Map<string, OrganizationMember>();
 (employees || []).forEach((employee) => {
 if (!employee.userId) return;
 map.set(employee.userId, employee);
 });
 return map;
 }, [employees]);

 const assignableEmployees = useMemo(() => {
 const memberIds = new Set(departmentMembers.map((member) => member.userId));
 const query = memberSearch.trim().toLowerCase();
 return employees
 .filter((employee) => !!employee.userId && !memberIds.has(employee.userId))
 .filter((employee) => {
 if (!query) return true;
 const fullName = `${employee.userFirstName || ""} ${employee.userLastName || ""}`.trim();
 return `${fullName} ${employee.userEmail || ""}`.toLowerCase().includes(query);
 })
 .slice(0, 8);
 }, [departmentMembers, employees, memberSearch]);

 const filteredEmployees = useMemo(() => {
 if (!q) return employees;
 return employees.filter((e) => {
 const hay =
 `${e.userEmail || ""} ${e.userFirstName || ""} ${e.userLastName || ""} ${e.roleName || ""} ${e.agencyName || ""}`.toLowerCase();
 return hay.includes(q);
 });
 }, [employees, q]);

 const filteredRoles = useMemo(() => {
 const base = (roles || []).filter((r) => !isHiddenRoleName(r.name));
 if (!q) return base;
 return base.filter((r) => `${r.name || ""} ${r.description || ""}`.toLowerCase().includes(q));
 }, [roles, q]);

 const rolePermissionGroups = useMemo(() => {
 const groups = new Map<string, EnterprisePermission[]>();
 availablePermissions.forEach((permission) => {
 const module = permission.module || "OTHER";
 groups.set(module, [...(groups.get(module) || []), permission]);
 });
 return Array.from(groups.entries())
 .map(([module, permissions]) => ({
 module,
 permissions: permissions.sort((a, b) => a.name.localeCompare(b.name)),
 }))
 .sort((a, b) => a.module.localeCompare(b.module));
 }, [availablePermissions]);

 const agenciesTotalPages = Math.max(1, Math.ceil(filteredAgencies.length / pageSize));
 const departmentsTotalPages = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
 const employeesTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
 const rolesTotalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));

 useEffect(() => setAgenciesPage((p) => clampPage(p, agenciesTotalPages)), [agenciesTotalPages]);
 useEffect(() => setDepartmentsPage((p) => clampPage(p, departmentsTotalPages)), [departmentsTotalPages]);
 useEffect(() => setEmployeesPage((p) => clampPage(p, employeesTotalPages)), [employeesTotalPages]);
 useEffect(() => setRolesPage((p) => clampPage(p, rolesTotalPages)), [rolesTotalPages]);

 const openCreateAgency = () => {
 setEditingAgency(null);
 setAgencyForm({
 name: "",
 type: hasHeadquarter ? "OFFICE" : "HQ",
 address: "",
 city: "",
 timezone: "",
 headquarter: false,
 });
 setAgencyModalOpen(true);
 };

 const openEditAgency = (agency: Agency) => {
 setEditingAgency(agency);
 setAgencyForm({
 name: agency.name || "",
 type: agency.type || "HQ",
 address: agency.address || "",
 city: agency.city || "",
 timezone: agency.timezone || "",
 headquarter: !!agency.isHeadquarter,
 });
 setAgencyModalOpen(true);
 };

 const saveAgency = async () => {
 if (!isAdmin) return;
 if (!editingAgency?.id && hasHeadquarter && agencyForm.headquarter) {
 setToast({ tone: "error", message: t("app.admin.agency.hqAlreadyExists") });
 return;
 }
 const agencyName = agencyForm.name?.trim() || "";
 if (!agencyName) {
 setToast({ tone: "error", message: t("app.admin.agency.toast.error") });
 return;
 }
 setAgencySaving(true);
 setToast(null);
 try {
 const generatedCode = agencyName
 .normalize("NFKD")
 .replace(/[\u0300-\u036f]/g, "")
 .replace(/[^a-zA-Z0-9]+/g, "-")
 .replace(/^-+|-+$/g, "")
 .toUpperCase()
 .slice(0, 24);
 const payload: AgencyRequest = {
 code:
 editingAgency?.code ||
 `${generatedCode || "AGENCY"}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
 name: agencyName || undefined,
 type: agencyForm.type?.trim() || undefined,
 address: agencyForm.address?.trim() || undefined,
 city: agencyForm.city?.trim() || undefined,
 timezone: agencyForm.timezone?.trim() || undefined,
 headquarter: !!agencyForm.headquarter,
 };
 if (editingAgency?.id) {
 await AgenciesService.updateAgency(editingAgency.id, payload);
 setToast({ tone: "success", message: t("app.admin.agency.toast.updated") });
 } else {
 await AgenciesService.createAgency(payload);
 setToast({ tone: "success", message: t("app.admin.agency.toast.created") });
 }
 setAgencyModalOpen(false);
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.agency.toast.error") });
 } finally {
 setAgencySaving(false);
 }
 };

 const deleteAgency = async (agency: Agency) => {
 if (!isAdmin || !agency.id) return;
 const ok = window.confirm(t("app.admin.agency.confirmDelete"));
 if (!ok) return;
 setToast(null);
 try {
 await AgenciesService.deleteAgency(agency.id);
 setToast({ tone: "success", message: t("app.admin.agency.toast.deleted") });
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.agency.toast.error") });
 }
 };

 const openCreateDepartment = () => {
 setEditingDepartment(null);
 setDepartmentForm({
 agencyId: agencies?.[0]?.id || "",
 code: "",
 name: "",
 active: true,
 });
 setDepartmentModalOpen(true);
 };

 const openEditDepartment = (department: Department) => {
 setEditingDepartment(department);
 setDepartmentForm({
 agencyId: department.agencyId || "",
 code: department.code || "",
 name: department.name || "",
 active: department.active !== false,
 });
 setDepartmentModalOpen(true);
 };

 const saveDepartment = async () => {
 if (!isAdmin) return;
 const agencyId = (departmentForm.agencyId || "").trim();
 const code = (departmentForm.code || "").trim();
 const name = (departmentForm.name || "").trim();
 if (!agencyId || !name || (!editingDepartment && !code)) {
 setToast({ tone: "error", message: t("app.admin.department.validation.required") });
 return;
 }

 setDepartmentSaving(true);
 setToast(null);
 try {
 if (editingDepartment?.id) {
 await DepartmentsService.update(editingDepartment.id, {
 name,
 active: !!departmentForm.active,
 });
 setToast({ tone: "success", message: t("app.admin.department.toast.updated") });
 } else {
 await DepartmentsService.create({
 agencyId,
 code: code.toUpperCase(),
 name,
 active: !!departmentForm.active,
 });
 setToast({ tone: "success", message: t("app.admin.department.toast.created") });
 }
 setDepartmentModalOpen(false);
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.department.toast.error") });
 } finally {
 setDepartmentSaving(false);
 }
 };

 const deleteDepartment = async (department: Department) => {
 if (!isAdmin || !department.id) return;
 const ok = window.confirm(t("app.admin.department.confirmDelete"));
 if (!ok) return;
 setToast(null);
 try {
 await DepartmentsService.delete(department.id);
 setToast({ tone: "success", message: t("app.admin.department.toast.deleted") });
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.department.toast.error") });
 }
 };

 const memberLabel = (userId: string) => {
 const employee = employeeByUserId.get(userId);
 if (!employee) return t("app.admin.department.members.unknown");
 const fullName = `${employee.userFirstName || ""} ${employee.userLastName || ""}`.trim();
 if (fullName && employee.userEmail) return `${fullName} (${employee.userEmail})`;
 return fullName || employee.userEmail || t("app.admin.department.members.unknown");
 };

 const openDepartmentMembers = async (department: Department) => {
 setSelectedDepartmentForMembers(department);
 setAssignMemberUserId("");
 setMemberSearch("");
 setMemberSearchOpen(false);
 setDepartmentMembersModalOpen(true);
 setMembersLoading(true);
 try {
 const rows = await DepartmentsService.listMembers(department.id);
 setDepartmentMembers(rows || []);
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.department.members.toast.loadError") });
 } finally {
 setMembersLoading(false);
 }
 };

 const assignMemberToDepartment = async () => {
 if (!isAdmin || !selectedDepartmentForMembers?.id || !assignMemberUserId) return;
 setMemberSaving(true);
 try {
 await DepartmentsService.assignMember(selectedDepartmentForMembers.id, assignMemberUserId);
 const rows = await DepartmentsService.listMembers(selectedDepartmentForMembers.id);
 setDepartmentMembers(rows || []);
 setAssignMemberUserId("");
 setMemberSearch("");
 setMemberSearchOpen(false);
 setToast({ tone: "success", message: t("app.admin.department.members.toast.assigned") });
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.department.members.toast.error") });
 } finally {
 setMemberSaving(false);
 }
 };

 const removeMemberFromDepartment = async (userId: string) => {
 if (!isAdmin || !selectedDepartmentForMembers?.id || !userId) return;
 setMemberSaving(true);
 try {
 await DepartmentsService.removeMember(selectedDepartmentForMembers.id, userId);
 const rows = await DepartmentsService.listMembers(selectedDepartmentForMembers.id);
 setDepartmentMembers(rows || []);
 setToast({ tone: "success", message: t("app.admin.department.members.toast.removed") });
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.department.members.toast.error") });
 } finally {
 setMemberSaving(false);
 }
 };

 const openInviteEmployee = () => {
 setShowEmployeePassword(false);
 setEmployeeForm({
 firstName: "",
 lastName: "",
 email: "",
 password: "",
 roleId: roles?.[0]?.id || "",
 agencyId: agencies?.[0]?.id || "",
 });
 setEmployeeModalOpen(true);
 };

 const saveEmployee = async () => {
 if (!isAdmin) return;
 const firstName = employeeForm.firstName?.trim() || "";
 const lastName = employeeForm.lastName?.trim() || "";
 const email = employeeForm.email?.trim().toLowerCase() || "";
 const password = employeeForm.password || "";
 if (!firstName || !lastName || !email || !password || !employeeForm.roleId || !employeeForm.agencyId) {
 setToast({ tone: "error", message: t("app.admin.employee.validation.required") });
 return;
 }
 if (
 password.length < 10 ||
 !/[A-Z]/.test(password) ||
 !/[a-z]/.test(password) ||
 !/\d/.test(password) ||
 !/[^A-Za-z0-9]/.test(password)
 ) {
 setToast({ tone: "error", message: t("app.admin.employee.validation.password") });
 return;
 }
 setEmployeeSaving(true);
 setToast(null);
 try {
 const payload: CreateEmployeeRequest = {
 firstName,
 lastName,
 email,
 password,
 roleId: employeeForm.roleId || undefined,
 agencyId: employeeForm.agencyId || undefined,
 };
 await EmployeesRolesService.createEmployee(payload);
 setEmployeeModalOpen(false);
 setToast({ tone: "success", message: t("app.admin.employee.toast.created") });
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: getApiErrorMessage(err) || t("app.admin.employee.toast.error") });
 } finally {
 setEmployeeSaving(false);
 }
 };

 const removeEmployee = async (member: OrganizationMember) => {
 if (!isAdmin || !member.id) return;
 const ok = window.confirm(t("app.admin.employee.confirmDelete"));
 if (!ok) return;
 setToast(null);
 try {
 await EmployeesRolesService.removeEmployee(member.id);
 setToast({ tone: "success", message: t("app.admin.employee.toast.deleted") });
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.employee.toast.error") });
 }
 };

 const loadRolePermissions = async () => {
 if (availablePermissions.length) return;
 setRolePermissionsLoading(true);
 try {
 const permissions = await EnterpriseRolesService.listPermissions();
 setAvailablePermissions(permissions);
 } catch {
 setToast({ tone: "error", message: t("app.admin.role.permissionsError") });
 } finally {
 setRolePermissionsLoading(false);
 }
 };

 const openCreateRole = async () => {
 if (!canManageRoles) return;
 setEditingRole(null);
 setRoleForm({ name: "", code: "", permissions: [] });
 setRoleCodeEdited(false);
 setRoleModalOpen(true);
 await loadRolePermissions();
 };

 const openEditRole = async (role: Role) => {
 if (!canManageRoles || !role.id || isProtectedRole(role)) return;
 setEditingRole(role);
 setRoleCodeEdited(true);
 setRoleForm({
 name: role.name || "",
 code: roleCode(role),
 permissions: (role.permissions || [])
 .map((permission) => permission.authority || "")
 .filter(Boolean),
 });
 setRoleModalOpen(true);
 await loadRolePermissions();
 };

 const toggleRolePermission = (code: string) => {
 setRoleForm((current) => ({
 ...current,
 permissions: current.permissions.includes(code)
 ? current.permissions.filter((permission) => permission !== code)
 : [...current.permissions, code],
 }));
 };

 const saveRole = async () => {
 if (!canManageRoles) return;
 const name = roleForm.name.trim();
 const code = roleForm.code.trim().toUpperCase();
 if (!name || !code || !roleForm.permissions.length) {
 setToast({ tone: "error", message: t("app.admin.role.validation.required") });
 return;
 }

 setRoleSaving(true);
 setToast(null);
 try {
 if (editingRole?.id) {
 await EnterpriseRolesService.update(editingRole.id, {
 name,
 permissions: roleForm.permissions,
 });
 } else {
 await EnterpriseRolesService.create({
 name,
 code,
 permissions: roleForm.permissions,
 });
 }
 setRoleModalOpen(false);
 setEditingRole(null);
 setToast({
 tone: "success",
 message: t(editingRole ? "app.admin.role.toast.updated" : "app.admin.role.toast.created"),
 });
 await loadAll();
 } catch {
 setToast({
 tone: "error",
 message: t(editingRole ? "app.admin.role.toast.updateError" : "app.admin.role.toast.error"),
 });
 } finally {
 setRoleSaving(false);
 }
 };

 const deleteRole = async (role: Role) => {
 if (!canManageRoles || !role.id || isProtectedRole(role)) return;
 if (!window.confirm(t("app.admin.role.confirmDelete", { name: role.name || roleCode(role) }))) return;

 setRoleDeletingId(role.id);
 setToast(null);
 try {
 await EnterpriseRolesService.delete(role.id);
 setToast({ tone: "success", message: t("app.admin.role.toast.deleted") });
 await loadAll();
 } catch {
 setToast({ tone: "error", message: t("app.admin.role.toast.deleteError") });
 } finally {
 setRoleDeletingId(null);
 }
 };

 const saveSettings = async () => {
 if (!isAdmin) return;
 setSettingsSaving(true);
 setToast(null);
 try {
 const payload: AppBusinessSettingsRequest = {
 organizationPrefix: settingsForm.organizationPrefix?.trim() || undefined,
 negotiateSellingPrice: !!settingsForm.negotiateSellingPrice,
 sellingPriceIncludeVat: !!settingsForm.sellingPriceIncludeVat,
 authorizeExceptionalDiscount: !!settingsForm.authorizeExceptionalDiscount,
 grantableDiscountRate:
 settingsForm.grantableDiscountRate == null || settingsForm.grantableDiscountRate === ("" as any)
 ? undefined
 : Number(settingsForm.grantableDiscountRate),
 lengthOfVatInvoiceNumber:
 settingsForm.lengthOfVatInvoiceNumber == null || settingsForm.lengthOfVatInvoiceNumber === ("" as any)
 ? undefined
 : Number(settingsForm.lengthOfVatInvoiceNumber),
 prefixOfVatInvoiceNumber: settingsForm.prefixOfVatInvoiceNumber?.trim() || undefined,
 lowStockAlert: !!settingsForm.lowStockAlert,
 preventiveMaintenanceAlert: !!settingsForm.preventiveMaintenanceAlert,
 };
 const saved = await SettingsService.updateGlobalOptions(payload);
 setSettings(saved || null);
 setToast({ tone: "success", message: t("app.admin.settings.toast.updated") });
 setSettingsEditing(false);
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.settings.toast.error") });
 } finally {
 setSettingsSaving(false);
 }
 };

 const openTransferOwnership = () => {
 setOwnershipOrgId(orgs?.[0]?.id || tenant?.id || "");
 setOwnershipNewOwnerId("");
 setOwnershipModalOpen(true);
 };

 const saveOwnershipTransfer = async () => {
 if (!isAdmin) return;
 if (!ownershipOrgId || !ownershipNewOwnerId) return;
 setOwnershipSaving(true);
 setToast(null);
 try {
 await OrganizationsService.transferOwnership(ownershipOrgId, ownershipNewOwnerId);
 setOwnershipModalOpen(false);
 setToast({ tone: "success", message: t("app.admin.org.toast.transferred") });
 await loadAll();
 } catch (err) {
 setToast({ tone: "error", message: t("app.admin.org.toast.error") });
 } finally {
 setOwnershipSaving(false);
 }
 };

 return (
 <main className="ys-page">
 <div className="ys-page-header">
 <div className="flex items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground ">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 3l7 3v5c0 5-3.2 8.3-7 10-3.8-1.7-7-5-7-10V6l7-3z" strokeLinecap="round" />
 <path d="M9.5 12.5 11 14l3.5-3.5" strokeLinecap="round" />
 </svg>
 </span>
 <h2 className="ys-page-title">{t("app.admin.title")}</h2>
 </div>
 <p className="ys-page-subtitle">
 {t("app.admin.subtitle")}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <div className="relative w-[280px] max-w-[60vw]">
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
 placeholder={t("app.admin.search")}
 className="ys-input w-full py-2 pl-10 pr-3"
 />
 </div>
 <button
 type="button"
 onClick={() => void loadAll()}
 className="ys-btn-secondary px-3 py-2 text-sm"
 >
 {t("app.admin.refresh")}
 </button>
 </div>
 </div>

 {!isAdmin && (
 <div className="mt-4 ys-alert-warning">
 <div className="font-semibold">{t("app.admin.readOnly.title")}</div>
 <div className="mt-0.5 text-amber-800 dark:text-amber-200">{t("app.admin.readOnly.body")}</div>
 </div>
 )}

 {toast && (
 <div
 className={[
 "mt-4 border px-4 py-3 text-sm",
 toast.tone === "success"
 ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
 : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100",
 ].join(" ")}
 >
 {toast.message}
 </div>
 )}

 {error && (
 <div className="mt-4 ys-alert-error">
 {error}
 </div>
 )}
 </div>

 {loading ? (
 <div className="text-sm text-muted-foreground">{t("app.admin.loading")}</div>
 ) : (
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.admin.organizations")}
 </div>
 <button
 type="button"
 onClick={openTransferOwnership}
 disabled={!isAdmin || !orgs.length}
 className="ys-btn-primary gap-2 px-3 py-1.5 text-xs"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M16 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
 <path d="M21 3l-7 7" strokeLinecap="round" strokeLinejoin="round" />
 <path d="M8 21H3v-5" strokeLinecap="round" strokeLinejoin="round" />
 <path d="M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 {t("app.admin.org.transfer")}
 </button>
 </div>

 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 {orgs.map((o) => (
 <li key={o.id} className="py-2">
 {(() => {
 const owner = resolveOwner(o);
 return (
 <div>
 <div className="font-medium">{o.name || "—"}</div>
 <ul className="mt-2 divide-y divide-border text-xs text-foreground">
 <li className="flex items-center justify-between gap-4 py-2">
 <span className="text-muted-foreground">{t("app.admin.org.email")}</span>
 <span className="font-medium">{o.email || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-4 py-2">
 <span className="text-muted-foreground">{t("app.admin.org.owner")}</span>
 <span className="font-medium">{owner.name || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-4 py-2">
 <span className="text-muted-foreground">{t("app.admin.org.ownerEmail")}</span>
 <span className="font-medium">{owner.email || "—"}</span>
 </li>
 </ul>
 </div>
 );
 })()}
 </li>
 ))}
 {!orgs.length && (
 <li className="py-2 text-sm text-muted-foreground">{t("app.admin.empty.organizations")}</li>
 )}
 </ul>
 </section>

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.admin.agencies")}
 </div>
 <button
 type="button"
 onClick={openCreateAgency}
 disabled={!isAdmin}
 className="ys-btn-primary gap-2 px-3 py-1.5 text-xs"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M12 5v14" strokeLinecap="round" />
 <path d="M5 12h14" strokeLinecap="round" />
 </svg>
 {t("app.admin.agency.create")}
 </button>
 </div>

 <div className="mt-3 divide-y divide-border text-sm text-foreground">
 {paginate(filteredAgencies, agenciesPage, pageSize).map((a) => (
 <div key={a.id} className="flex items-center justify-between gap-4 py-2">
 <div className="min-w-0">
 <div className="truncate font-medium">{a.name || "—"}</div>
 <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
 <span>{a.type || "—"}</span>
 <span className="opacity-60">•</span>
 <span>{a.city || "—"}</span>
 <span className="opacity-60">•</span>
 <span className="truncate">{a.timezone || "—"}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => openEditAgency(a)}
 disabled={!isAdmin}
 className="ys-icon-btn-edit"
 aria-label={t("app.admin.edit")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 <button
 type="button"
 onClick={() => void deleteAgency(a)}
 disabled={!isAdmin}
 className="ys-icon-btn-delete"
 aria-label={t("app.admin.delete")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 7V4h6v3" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>
 ))}
 {!filteredAgencies.length && (
 <div className="py-2 text-sm text-muted-foreground">{t("app.admin.empty.agencies")}</div>
 )}
 </div>

 <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
 <div>
 {t("app.admin.pagination", { page: agenciesPage, total: agenciesTotalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setAgenciesPage((p) => Math.max(1, p - 1))}
 disabled={agenciesPage <= 1}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.prev")}
 </button>
 <button
 type="button"
 onClick={() => setAgenciesPage((p) => Math.min(agenciesTotalPages, p + 1))}
 disabled={agenciesPage >= agenciesTotalPages}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.next")}
 </button>
 </div>
 </div>
 </section>

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.admin.departments")}
 </div>
 <button
 type="button"
 onClick={openCreateDepartment}
 disabled={!isAdmin || !agencies.length}
 className="ys-btn-primary gap-2 px-3 py-1.5 text-xs"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M12 5v14" strokeLinecap="round" />
 <path d="M5 12h14" strokeLinecap="round" />
 </svg>
 {t("app.admin.department.create")}
 </button>
 </div>

 <div className="mt-3 divide-y divide-border text-sm text-foreground">
 {paginate(filteredDepartments, departmentsPage, pageSize).map((d) => (
 <div key={d.id} className="flex items-center justify-between gap-4 py-2">
 <div className="min-w-0">
 <div className="truncate font-medium">{d.name || "—"}</div>
 <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
 <span>{d.code || "—"}</span>
 <span className="opacity-60">•</span>
 <span className="truncate">{agencyNameById.get(d.agencyId) || d.agencyId || "—"}</span>
 <span className="opacity-60">•</span>
 <span>{d.active ? t("app.admin.department.status.active") : t("app.admin.department.status.inactive")}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => void openDepartmentMembers(d)}
 disabled={!isAdmin}
 className="ys-btn-secondary px-2 py-1 text-xs"
 >
 {t("app.admin.department.assign")}
 </button>
 <button
 type="button"
 onClick={() => openEditDepartment(d)}
 disabled={!isAdmin}
 className="ys-icon-btn-edit"
 aria-label={t("app.admin.edit")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 <button
 type="button"
 onClick={() => void deleteDepartment(d)}
 disabled={!isAdmin}
 className="ys-icon-btn-delete"
 aria-label={t("app.admin.delete")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 7V4h6v3" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>
 ))}
 {!filteredDepartments.length && (
 <div className="py-2 text-sm text-muted-foreground">{t("app.admin.empty.departments")}</div>
 )}
 </div>

 <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
 <div>
 {t("app.admin.pagination", { page: departmentsPage, total: departmentsTotalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setDepartmentsPage((p) => Math.max(1, p - 1))}
 disabled={departmentsPage <= 1}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.prev")}
 </button>
 <button
 type="button"
 onClick={() => setDepartmentsPage((p) => Math.min(departmentsTotalPages, p + 1))}
 disabled={departmentsPage >= departmentsTotalPages}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.next")}
 </button>
 </div>
 </div>
 </section>

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.admin.employees")}
 </div>
 <button
 type="button"
 onClick={openInviteEmployee}
 disabled={!isAdmin}
 className="ys-btn-primary gap-2 px-3 py-1.5 text-xs"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" strokeLinecap="round" strokeLinejoin="round" />
 <path d="M4 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
 <path d="M19 8v6" strokeLinecap="round" />
 <path d="M16 11h6" strokeLinecap="round" />
 </svg>
 {t("app.admin.employee.invite")}
 </button>
 </div>

 <div className="mt-3 divide-y divide-border text-sm text-foreground">
 {paginate(filteredEmployees, employeesPage, pageSize).map((e) => (
 <div key={e.id} className="flex items-center justify-between gap-4 py-2">
 <div className="min-w-0">
 <div className="truncate font-medium">
 {`${e.userFirstName || ""} ${e.userLastName || ""}`.trim() || e.userEmail || e.userId || "—"}
 </div>
 <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
 <span>{e.userEmail || "—"}</span>
 <span className="opacity-60">•</span>
 <span>{formatRole(e.roleName)}</span>
 <span className="opacity-60">•</span>
 <span className="truncate">{e.agencyName || "—"}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => void removeEmployee(e)}
 disabled={!isAdmin}
 className="ys-icon-btn-delete"
 aria-label={t("app.admin.delete")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 7V4h6v3" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>
 ))}
 {!filteredEmployees.length && (
 <div className="py-2 text-sm text-muted-foreground">{t("app.admin.empty.employees")}</div>
 )}
 </div>

 <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
 <div>
 {t("app.admin.pagination", { page: employeesPage, total: employeesTotalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setEmployeesPage((p) => Math.max(1, p - 1))}
 disabled={employeesPage <= 1}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.prev")}
 </button>
 <button
 type="button"
 onClick={() => setEmployeesPage((p) => Math.min(employeesTotalPages, p + 1))}
 disabled={employeesPage >= employeesTotalPages}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.next")}
 </button>
 </div>
 </div>

 <div className="mt-4 text-xs text-muted-foreground">
 {t("app.admin.employee.roleNote")}
 </div>
 </section>

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.admin.roles")}
 </div>
 {canManageRoles && (
 <button
 type="button"
 onClick={() => void openCreateRole()}
 className="ys-btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M12 5v14M5 12h14" strokeLinecap="round" />
 </svg>
 {t("app.admin.role.create")}
 </button>
 )}
 </div>

 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 {paginate(filteredRoles, rolesPage, pageSize).map((r) => {
 const protectedRole = isProtectedRole(r);
 return (
 <li key={r.id} className="flex items-center justify-between gap-4 py-3">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <span className="font-medium">{r.name || "—"}</span>
 {protectedRole && (
 <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
 {t("app.admin.role.protected")}
 </span>
 )}
 </div>
 <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
 <span className="font-mono">{roleDescription(r)}</span>
 <span>{t("app.admin.role.permissionCount", { count: r.permissions?.length || 0 })}</span>
 </div>
 </div>
 {canManageRoles && !protectedRole && r.id && (
 <div className="flex shrink-0 items-center gap-2">
 <button
 type="button"
 onClick={() => void openEditRole(r)}
 className="ys-icon-btn-edit"
 aria-label={t("app.admin.role.edit")}
 title={t("app.admin.role.edit")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 <button
 type="button"
 onClick={() => void deleteRole(r)}
 disabled={roleDeletingId === r.id}
 className="ys-icon-btn-delete disabled:cursor-wait disabled:opacity-50"
 aria-label={t("app.admin.role.delete")}
 title={t("app.admin.role.delete")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 7V4h6v3" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 )}
 </li>
 );
 })}
 {!filteredRoles.length && (
 <li className="py-2 text-sm text-muted-foreground">{t("app.admin.empty.roles")}</li>
 )}
 </ul>

 <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
 <div>
 {t("app.admin.pagination", { page: rolesPage, total: rolesTotalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setRolesPage((p) => Math.max(1, p - 1))}
 disabled={rolesPage <= 1}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.prev")}
 </button>
 <button
 type="button"
 onClick={() => setRolesPage((p) => Math.min(rolesTotalPages, p + 1))}
 disabled={rolesPage >= rolesTotalPages}
 className="ys-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
 >
 {t("app.admin.next")}
 </button>
 </div>
 </div>
 </section>

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.admin.settings")}
 </div>
 <div className="flex items-center gap-2">
 {settingsEditing && (
 <button
 type="button"
 onClick={() => {
 setSettingsEditing(false);
 setSettingsForm({
 organizationPrefix: settings?.organizationPrefix || "",
 negotiateSellingPrice: !!settings?.negotiateSellingPrice,
 sellingPriceIncludeVat: !!settings?.sellingPriceIncludeVat,
 authorizeExceptionalDiscount: !!settings?.authorizeExceptionalDiscount,
 grantableDiscountRate: settings?.grantableDiscountRate ?? undefined,
 lengthOfVatInvoiceNumber: settings?.lengthOfVatInvoiceNumber ?? undefined,
 prefixOfVatInvoiceNumber: settings?.prefixOfVatInvoiceNumber || "",
 lowStockAlert: !!settings?.lowStockAlert,
 preventiveMaintenanceAlert: !!settings?.preventiveMaintenanceAlert,
 });
 }}
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 >
 {t("app.admin.cancel")}
 </button>
 )}
 <button
 type="button"
 onClick={() => setSettingsEditing((v) => !v)}
 disabled={!isAdmin}
 className="ys-icon-btn-edit"
 aria-label={t("app.admin.edit")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>

 {!settings ? (
 <div className="mt-3 text-sm text-muted-foreground">
 {settingsForbidden ? t("app.admin.settings.forbidden") : t("app.admin.empty.settings")}
 </div>
 ) : settingsEditing ? (
 <div className="mt-4 space-y-3 text-sm">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.admin.settings.orgPrefix")}
 </label>
 <input
 value={settingsForm.organizationPrefix || ""}
 onChange={(e) => setSettingsForm((p) => ({ ...p, organizationPrefix: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.admin.settings.vatLength")}
 </label>
 <input
 type="number"
 value={settingsForm.lengthOfVatInvoiceNumber ?? ""}
 onChange={(e) =>
 setSettingsForm((p) => ({
 ...p,
 lengthOfVatInvoiceNumber: e.target.value === "" ? undefined : Number(e.target.value),
 }))
 }
 className="ys-input mt-1"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.admin.settings.vatPrefix")}
 </label>
 <input
 value={settingsForm.prefixOfVatInvoiceNumber || ""}
 onChange={(e) => setSettingsForm((p) => ({ ...p, prefixOfVatInvoiceNumber: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 </div>
 <div className="flex flex-wrap gap-3">
 <label className="flex items-center gap-2 text-sm text-foreground ">
 <input
 type="checkbox"
 checked={!!settingsForm.lowStockAlert}
 onChange={(e) => setSettingsForm((p) => ({ ...p, lowStockAlert: e.target.checked }))}
 />
 {t("app.admin.settings.lowStock")}
 </label>
 <label className="flex items-center gap-2 text-sm text-foreground ">
 <input
 type="checkbox"
 checked={!!settingsForm.preventiveMaintenanceAlert}
 onChange={(e) => setSettingsForm((p) => ({ ...p, preventiveMaintenanceAlert: e.target.checked }))}
 />
 {t("app.admin.settings.maintenance")}
 </label>
 </div>
 <div className="flex items-center justify-end gap-2 pt-1">
 <button
 type="button"
 disabled={settingsSaving}
 onClick={() => void saveSettings()}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {settingsSaving ? t("app.admin.saving") : t("app.admin.save")}
 </button>
 </div>
 </div>
 ) : (
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.admin.settings.orgPrefix")}</span>
 <span className="font-medium">{settings.organizationPrefix || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.admin.settings.vatLength")}</span>
 <span className="font-medium">{settings.lengthOfVatInvoiceNumber ?? "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.admin.settings.lowStock")}</span>
 <span className="font-medium">
 {settings.lowStockAlert ? t("app.admin.settings.on") : t("app.admin.settings.off")}
 </span>
 </li>
 </ul>
 )}
 </section>

 <section className="ys-card p-5 lg:col-span-2">
 <div className="ys-section-title">
 {t("app.admin.profile")}
 </div>
 {me ? (
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.email")}</span>
 <span className="font-medium">{me.email || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.profile.roles")}</span>
 <span className="font-medium">{formatRoles(sessionRoles)}</span>
 </li>
 </ul>
 ) : (
 <div className="mt-3 text-sm text-muted-foreground">{t("app.admin.empty.profile")}</div>
 )}
 </section>
 </div>
 )}

 <Modal
 open={agencyModalOpen}
 title={editingAgency ? t("app.admin.agency.editTitle") : t("app.admin.agency.createTitle")}
 onClose={() => setAgencyModalOpen(false)}
 >
 <div className="space-y-3 text-sm">
 {hasHeadquarter && !editingAgency?.id && (
 <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
 {t("app.admin.agency.hqHint")}
 </div>
 )}
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.agency.fields.name")}</label>
 <input
 value={agencyForm.name || ""}
 onChange={(e) => setAgencyForm((p) => ({ ...p, name: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.agency.fields.type")}</label>
 <select
 value={agencyForm.type || ""}
 onChange={(e) => {
 const next = e.target.value;
 if (!editingAgency?.id && hasHeadquarter && next === "HQ") {
 setToast({ tone: "error", message: t("app.admin.agency.hqAlreadyExists") });
 setAgencyForm((p) => ({ ...p, type: "OFFICE" }));
 return;
 }
 setAgencyForm((p) => ({ ...p, type: next }));
 }}
 className="ys-input mt-1"
 >
 <option value="HQ" disabled={!editingAgency?.id && hasHeadquarter}>
 HQ
 </option>
 <option value="WAREHOUSE">WAREHOUSE</option>
 <option value="POS">POS</option>
 <option value="OFFICE">OFFICE</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.agency.fields.city")}</label>
 <input
 value={agencyForm.city || ""}
 onChange={(e) => setAgencyForm((p) => ({ ...p, city: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.agency.fields.address")}</label>
 <input
 value={agencyForm.address || ""}
 onChange={(e) => setAgencyForm((p) => ({ ...p, address: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.agency.fields.timezone")}</label>
 <input
 value={agencyForm.timezone || ""}
 onChange={(e) => setAgencyForm((p) => ({ ...p, timezone: e.target.value }))}
 placeholder="Africa/Douala"
 className="ys-input mt-1"
 />
 </div>
 <label className="flex items-center gap-2 text-sm text-foreground ">
 <input
 type="checkbox"
 checked={!!agencyForm.headquarter}
 disabled={!editingAgency?.id && hasHeadquarter}
 onChange={(e) => {
 if (!editingAgency?.id && hasHeadquarter && e.target.checked) {
 setToast({ tone: "error", message: t("app.admin.agency.hqAlreadyExists") });
 setAgencyForm((p) => ({ ...p, headquarter: false }));
 return;
 }
 setAgencyForm((p) => ({ ...p, headquarter: e.target.checked }));
 }}
 />
 {t("app.admin.agency.fields.hq")}
 </label>
 {!editingAgency?.id && hasHeadquarter && (
 <div className="text-xs text-muted-foreground">{t("app.admin.agency.hqDisabled")}</div>
 )}

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setAgencyModalOpen(false)}
 className="ys-btn-secondary px-4 py-2 text-sm"
 >
 {t("app.admin.cancel")}
 </button>
 <button
 type="button"
 disabled={!isAdmin || agencySaving}
 onClick={() => void saveAgency()}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {agencySaving ? t("app.admin.saving") : t("app.admin.save")}
 </button>
 </div>
 </div>
 </Modal>

 <Modal
 open={departmentModalOpen}
 title={editingDepartment ? t("app.admin.department.editTitle") : t("app.admin.department.createTitle")}
 onClose={() => setDepartmentModalOpen(false)}
 >
 <div className="space-y-3 text-sm">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.department.fields.agency")}</label>
 <select
 value={departmentForm.agencyId}
 onChange={(e) => setDepartmentForm((p) => ({ ...p, agencyId: e.target.value }))}
 className="ys-input mt-1"
 disabled={!!editingDepartment}
 >
 <option value="">{t("app.admin.department.fields.agencyPlaceholder")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id}>
 {a.name}
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.department.fields.code")}</label>
 <input
 value={departmentForm.code}
 onChange={(e) => setDepartmentForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
 className="ys-input mt-1"
 disabled={!!editingDepartment}
 placeholder="MNT"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.department.fields.name")}</label>
 <input
 value={departmentForm.name}
 onChange={(e) => setDepartmentForm((p) => ({ ...p, name: e.target.value }))}
 className="ys-input mt-1"
 placeholder="Maintenance"
 />
 </div>
 </div>

 <label className="flex items-center gap-2 text-sm text-foreground ">
 <input
 type="checkbox"
 checked={!!departmentForm.active}
 onChange={(e) => setDepartmentForm((p) => ({ ...p, active: e.target.checked }))}
 />
 {t("app.admin.department.fields.active")}
 </label>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setDepartmentModalOpen(false)}
 className="ys-btn-secondary px-4 py-2 text-sm"
 >
 {t("app.admin.cancel")}
 </button>
 <button
 type="button"
 disabled={!isAdmin || departmentSaving}
 onClick={() => void saveDepartment()}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {departmentSaving ? t("app.admin.saving") : t("app.admin.save")}
 </button>
 </div>
 </div>
 </Modal>

 <Modal
 open={departmentMembersModalOpen}
 title={t("app.admin.department.members.title", { name: selectedDepartmentForMembers?.name || "—" })}
 onClose={() => setDepartmentMembersModalOpen(false)}
 >
 <div className="space-y-3 text-sm">
 <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_auto]">
 <div className="relative">
 <input
 type="search"
 role="combobox"
 aria-expanded={memberSearchOpen}
 aria-controls="department-member-suggestions"
 autoComplete="off"
 value={memberSearch}
 onFocus={() => setMemberSearchOpen(true)}
 onChange={(event) => {
 setMemberSearch(event.target.value);
 setAssignMemberUserId("");
 setMemberSearchOpen(true);
 }}
 placeholder={t("app.admin.department.members.fields.userSearchPlaceholder")}
 className="ys-input w-full"
 />
 {memberSearchOpen && (
 <div
 id="department-member-suggestions"
 className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-border bg-card py-1 shadow-lg"
 >
 {assignableEmployees.map((employee) => {
 const fullName = `${employee.userFirstName || ""} ${employee.userLastName || ""}`.trim();
 return (
 <button
 key={employee.userId}
 type="button"
 className="block w-full px-3 py-2 text-left hover:bg-muted"
 onClick={() => {
 setAssignMemberUserId(employee.userId || "");
 setMemberSearch(fullName || employee.userEmail || "");
 setMemberSearchOpen(false);
 }}
 >
 <span className="block truncate font-medium">
 {fullName || employee.userEmail || t("app.admin.department.members.unknown")}
 </span>
 {fullName && employee.userEmail && (
 <span className="block truncate text-xs text-muted-foreground">{employee.userEmail}</span>
 )}
 </button>
 );
 })}
 {!assignableEmployees.length && (
 <div className="px-3 py-2 text-xs text-muted-foreground">
 {t("app.admin.department.members.noMatches")}
 </div>
 )}
 </div>
 )}
 </div>
 <button
 type="button"
 className="ys-btn-primary px-3 py-2 text-xs disabled:opacity-60"
 disabled={!isAdmin || memberSaving || !assignMemberUserId}
 onClick={() => void assignMemberToDepartment()}
 >
 {memberSaving ? t("app.admin.saving") : t("app.admin.department.members.assign")}
 </button>
 </div>

 {membersLoading ? (
 <div className="text-sm text-muted-foreground">{t("app.admin.loading")}</div>
 ) : !departmentMembers.length ? (
 <div className="text-sm text-muted-foreground">{t("app.admin.department.members.empty")}</div>
 ) : (
 <div className="divide-y divide-border">
 {departmentMembers.map((member) => (
 <div key={member.id} className="flex items-center justify-between gap-4 py-2">
 <div className="min-w-0">
 <div className="truncate font-medium">{memberLabel(member.userId)}</div>
 </div>
 <button
 type="button"
 className="ys-icon-btn-delete"
 disabled={!isAdmin || memberSaving}
 onClick={() => void removeMemberFromDepartment(member.userId)}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 7V4h6v3" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </Modal>

 <Modal open={employeeModalOpen} title={t("app.admin.employee.inviteTitle")} onClose={() => setEmployeeModalOpen(false)}>
 <div className="space-y-3 text-sm">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("auth.register.firstName")}</label>
 <input
 required
 autoComplete="given-name"
 value={employeeForm.firstName || ""}
 onChange={(e) => setEmployeeForm((p) => ({ ...p, firstName: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("auth.register.lastName")}</label>
 <input
 required
 autoComplete="family-name"
 value={employeeForm.lastName || ""}
 onChange={(e) => setEmployeeForm((p) => ({ ...p, lastName: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("auth.register.email")}</label>
 <input
 type="email"
 required
 autoComplete="email"
 value={employeeForm.email || ""}
 onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))}
 className="ys-input mt-1"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("auth.register.password")}</label>
 <div className="relative mt-1">
 <input
 type={showEmployeePassword ? "text" : "password"}
 required
 minLength={10}
 autoComplete="new-password"
 value={employeeForm.password || ""}
 onChange={(e) => setEmployeeForm((p) => ({ ...p, password: e.target.value }))}
 className="ys-input w-full pr-10"
 />
 <button
 type="button"
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
 onClick={() => setShowEmployeePassword((prev) => !prev)}
 aria-label={showEmployeePassword ? t("auth.register.hide") : t("auth.register.show")}
 >
 {showEmployeePassword ? (
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M3 3l18 18" strokeLinecap="round" />
 <path d="M10.6 10.6a2.5 2.5 0 0 0 3.3 3.3" strokeLinecap="round" />
 <path
 d="M9.3 5.7A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a18.4 18.4 0 0 1-4 4.9"
 strokeLinecap="round"
 />
 <path
 d="M6.2 6.2A18.6 18.6 0 0 0 2.5 12s3.5 7 9.5 7a10.6 10.6 0 0 0 4.2-.9"
 strokeLinecap="round"
 />
 </svg>
 ) : (
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path
 d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
 strokeLinecap="round"
 />
 <circle cx="12" cy="12" r="3.5" strokeLinecap="round" />
 </svg>
 )}
 </button>
 </div>
 </div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.employee.fields.role")}</label>
 <select
 value={employeeForm.roleId || ""}
 onChange={(e) => setEmployeeForm((p) => ({ ...p, roleId: e.target.value }))}
 className="ys-input mt-1"
 >
 <option value="">{t("app.admin.employee.fields.rolePlaceholder")}</option>
 {roles
 .filter((r) => !isHiddenRoleName(r.name))
 .map((r) => (
 <option key={r.id} value={r.id}>
 {r.name}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.employee.fields.agency")}</label>
 <select
 value={employeeForm.agencyId || ""}
 onChange={(e) => setEmployeeForm((p) => ({ ...p, agencyId: e.target.value }))}
 className="ys-input mt-1"
 >
 <option value="">{t("app.admin.employee.fields.agencyPlaceholder")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id}>
 {a.name}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setEmployeeModalOpen(false)}
 className="ys-btn-secondary px-4 py-2 text-sm"
 >
 {t("app.admin.cancel")}
 </button>
 <button
 type="button"
 disabled={!isAdmin || employeeSaving}
 onClick={() => void saveEmployee()}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {employeeSaving ? t("app.admin.saving") : t("app.admin.save")}
 </button>
 </div>
 </div>
 </Modal>

 <Modal
 open={roleModalOpen}
 title={t(editingRole ? "app.admin.role.editTitle" : "app.admin.role.createTitle")}
 onClose={() => {
 setRoleModalOpen(false);
 setEditingRole(null);
 }}
 >
 <div className="space-y-4 text-sm">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <div>
 <label className="text-xs font-semibold text-muted-foreground">{t("app.admin.role.fields.name")}</label>
 <input
 value={roleForm.name}
 onChange={(event) => {
 const name = event.target.value;
 setRoleForm((current) => ({
 ...current,
 name,
 code: roleCodeEdited ? current.code : toRoleCode(name),
 }));
 }}
 className="ys-input mt-1"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground">{t("app.admin.role.fields.code")}</label>
 <input
 value={roleForm.code}
 onChange={(event) => {
 setRoleCodeEdited(true);
 setRoleForm((current) => ({ ...current, code: toRoleCode(event.target.value) }));
 }}
 disabled={!!editingRole}
 className="ys-input mt-1 font-mono disabled:cursor-not-allowed disabled:opacity-60"
 />
 {editingRole && (
 <div className="mt-1 text-xs text-muted-foreground">{t("app.admin.role.codeImmutable")}</div>
 )}
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between gap-3">
 <label className="text-xs font-semibold text-muted-foreground">{t("app.admin.role.fields.permissions")}</label>
 <span className="text-xs text-muted-foreground">
 {t("app.admin.role.permissionsSelected", { count: roleForm.permissions.length })}
 </span>
 </div>
 {rolePermissionsLoading ? (
 <div className="mt-2 text-sm text-muted-foreground">{t("app.admin.role.permissionsLoading")}</div>
 ) : (
 <div className="mt-2 max-h-80 space-y-4 overflow-y-auto border border-border p-3">
 {rolePermissionGroups.map((group) => (
 <div key={group.module}>
 <div className="mb-2 text-xs font-semibold text-foreground">{group.module}</div>
 <div className="grid gap-2 sm:grid-cols-2">
 {group.permissions.map((permission) => (
 <label key={permission.code} className="flex cursor-pointer items-start gap-2 border border-border p-2">
 <input
 type="checkbox"
 checked={roleForm.permissions.includes(permission.code)}
 onChange={() => toggleRolePermission(permission.code)}
 className="mt-0.5"
 />
 <span className="min-w-0">
 <span className="block font-medium">{permission.name}</span>
 <span className="block text-xs text-muted-foreground">{permission.description || permission.code}</span>
 </span>
 </label>
 ))}
 </div>
 </div>
 ))}
 {!rolePermissionGroups.length && (
 <div className="text-sm text-muted-foreground">{t("app.admin.role.permissionsEmpty")}</div>
 )}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => {
 setRoleModalOpen(false);
 setEditingRole(null);
 }}
 className="ys-btn-secondary px-4 py-2 text-sm"
 >
 {t("app.admin.cancel")}
 </button>
 <button
 type="button"
 disabled={!canManageRoles || roleSaving || rolePermissionsLoading}
 onClick={() => void saveRole()}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {roleSaving ? t("app.admin.saving") : t("app.admin.save")}
 </button>
 </div>
 </div>
 </Modal>

 <Modal open={ownershipModalOpen} title={t("app.admin.org.transferTitle")} onClose={() => setOwnershipModalOpen(false)}>
 <div className="space-y-3 text-sm">
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.org.fields.org")}</label>
 <select
 value={ownershipOrgId}
 onChange={(e) => setOwnershipOrgId(e.target.value)}
 className="ys-input mt-1"
 >
 {orgs.map((o) => (
 <option key={o.id} value={o.id}>
 {o.name} ({o.id})
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground ">{t("app.admin.org.fields.newOwner")}</label>
 <input
 value={ownershipNewOwnerId}
 onChange={(e) => setOwnershipNewOwnerId(e.target.value)}
 placeholder="BusinessActor UUID"
 className="ys-input mt-1"
 />
 <div className="mt-1 text-xs text-muted-foreground">{t("app.admin.org.transferHint")}</div>
 </div>
 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setOwnershipModalOpen(false)}
 className="ys-btn-secondary px-4 py-2 text-sm"
 >
 {t("app.admin.cancel")}
 </button>
 <button
 type="button"
 disabled={!isAdmin || ownershipSaving || !ownershipOrgId || !ownershipNewOwnerId}
 onClick={() => void saveOwnershipTransfer()}
 className="ys-btn-primary px-4 py-2 text-sm disabled:opacity-60"
 >
 {ownershipSaving ? t("app.admin.saving") : t("app.admin.save")}
 </button>
 </div>
 </div>
 </Modal>
 </main>
 );
}
