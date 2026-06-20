import type { Agency, OrganizationMember, Role } from "@/lib";

export function enrichOrganizationMembers(
  members: OrganizationMember[],
  roles: Role[],
  agencies: Agency[],
): OrganizationMember[] {
  const roleNames = new Map(
    roles
      .filter((role) => role.id)
      .map((role) => [role.id as string, role.name || role.description || ""]),
  );
  const agencyNames = new Map(
    agencies
      .filter((agency) => agency.id)
      .map((agency) => [agency.id as string, agency.name || ""]),
  );

  return members.map((member) => ({
    ...member,
    roleName: member.roleName || (member.roleId ? roleNames.get(member.roleId) : undefined),
    agencyName: member.agencyName || (member.agencyId ? agencyNames.get(member.agencyId) : undefined),
  }));
}
