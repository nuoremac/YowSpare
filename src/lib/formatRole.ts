const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: "Administrator",
  ROLE_USER: "Member",
  ROLE_MANAGER: "Manager",
  ROLE_AGENCY_ADMIN: "Agency Admin",
  ROLE_STAFF: "Staff",
  ROLE_STOCK_MANAGER: "Stock Manager",
  ROLE_WAREHOUSE_CLERK: "Warehouse Clerk",
  ROLE_AUDITOR: "Auditor",
  ROLE_PROCUREMENT_MANAGER: "Procurement Manager",
  ROLE_MAINTENANCE_TECHNICIAN: "Maintenance Technician",
  ROLE_REQUESTER: "Requester",
  ROLE_VIEWER: "Viewer",
  ROLE_ORGANIZATION_ADMIN: "Organization Admin",
  "ORGANIZATION ADMIN": "Organization Admin",
  AGENCY_MANAGER: "Agency Manager",
  DEPARTMENT_CHIEF: "Department Chief",
  STAFF: "Staff Member",
};

function authorityName(raw: string): string {
  return raw.split("#", 1)[0].trim();
}

export function getRoleAuthorities(raws: string[] | null | undefined): string[] {
  if (!raws?.length) return [];

  return Array.from(
    new Set(
      raws
        .map(authorityName)
        .filter(Boolean)
        .filter((authority) => !authority.includes(":")),
    ),
  );
}

export function formatRole(raw: string | null | undefined): string {
  if (!raw) return "—";
  const role = authorityName(raw);
  return ROLE_LABELS[role] ?? role.replace(/^ROLE_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRoles(raws: string[] | null | undefined): string {
  const roles = getRoleAuthorities(raws);
  return roles.length ? roles.map(formatRole).join(", ") : "—";
}
