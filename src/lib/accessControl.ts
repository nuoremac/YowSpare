import type { Organization, User } from "@/lib-tiers";

export type OrganizationAccessContext = {
  authorities?: string[] | null;
  memberRole?: string | null;
  organization?: Organization | null;
  user?: User | null;
};

export const authorityBase = (authority?: string | null) =>
  (authority || "").split("#", 1)[0].trim().toUpperCase();

const impliedAuthorities = (expected: string) => {
  const normalized = authorityBase(expected);
  if (normalized.endsWith(":READ")) {
    return [normalized, `${normalized.slice(0, -5)}:WRITE`];
  }
  return [normalized];
};

export const hasAuthority = (
  authorities: string[] | null | undefined,
  expected: string,
) => {
  const accepted = new Set(impliedAuthorities(expected));
  return (authorities || []).some(
    (authority) => accepted.has(authorityBase(authority)),
  );
};

export const hasAnyAuthority = (
  authorities: string[] | null | undefined,
  expected: string[],
) => expected.some((authority) => hasAuthority(authorities, authority));

export const isAdministrativeAuthority = (
  authorities: string[] | null | undefined,
) =>
  hasAnyAuthority(authorities, [
    "ROLE_ORGANIZATION_ADMIN",
    "ORGANIZATION_ADMIN",
    "ROLE_ORGANIZATION_OWNER",
    "ORGANIZATION_OWNER",
    "ROLE_ADMIN",
    "ROLE_GENERAL_ADMIN",
    "ROLE_TENANT_ADMIN",
    "ORGANIZATION ADMIN",
    "GENERAL ADMIN",
    "ROLE_ORGANIZATION ADMIN",
    "ROLE_GENERAL ADMIN",
    "tenant:admin",
    "iam:admin",
    "system:admin",
  ]);

export const isOrganizationOwner = (
  user?: User | null,
  organization?: Organization | null,
) =>
  !!user?.businessActorId &&
  !!organization?.businessActorId &&
  user.businessActorId.toLowerCase() === organization.businessActorId.toLowerCase();

export const hasFullOrganizationAccess = ({
  authorities,
  memberRole,
  organization,
  user,
}: OrganizationAccessContext) => {
  if (isOrganizationOwner(user, organization)) return true;
  if (isAdministrativeAuthority(authorities)) return true;

  const normalizedMemberRole = authorityBase(memberRole);
  return /ADMIN|OWNER/.test(normalizedMemberRole);
};

export const hasOrganizationAccess = (
  context: OrganizationAccessContext,
  acceptedAuthorities: string[],
) => {
  if (hasFullOrganizationAccess(context)) return true;

  if (
    acceptedAuthorities.some((authority) =>
      hasAuthority(context.authorities, authority),
    )
  ) {
    return true;
  }

  const normalizedMemberRole = authorityBase(context.memberRole);
  return acceptedAuthorities.some(
    (authority) => authorityBase(authority) === normalizedMemberRole,
  );
};
