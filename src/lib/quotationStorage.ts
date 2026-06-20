const QUOTATIONS_STORAGE_PREFIX = "yowspare-procurement-quotations-v1";

export const getQuotationStorageKey = (organizationId?: string | null) =>
  organizationId
    ? `${QUOTATIONS_STORAGE_PREFIX}:${organizationId}`
    : `${QUOTATIONS_STORAGE_PREFIX}:unscoped`;

export const getOrganizationStorageId = (
  tenant?: { id?: string | null } | null,
  user?: { organizationId?: string | null } | null,
) => tenant?.id || user?.organizationId || "";
