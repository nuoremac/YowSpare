import { withAppBasePath } from "@/lib/basePath";
import { getAuthToken, getDefaultHeaders, getTenantId } from "@/lib/api";

type LogoBlobOptions = {
  fileId: string;
  agencyId?: string | null;
  organizationId?: string | null;
  token?: string | null;
  tenantId?: string | null;
};

export const ORGANIZATION_LOGO_UPDATED_EVENT = "yowspare:organization-logo-updated";

export type OrganizationLogoUpdatedDetail = {
  organizationId: string;
  src: string;
};

export type OrganizationLogoCache = {
  uri: string;
  fileId: string;
};

const logoUriKey = (organizationId: string) => `yowspare:org-logo:${organizationId}`;
const logoFileIdKey = (organizationId: string) => `yowspare:org-logo-id:${organizationId}`;

export const readOrganizationLogoCache = (organizationId: string): OrganizationLogoCache => {
  if (!organizationId || typeof window === "undefined") return { uri: "", fileId: "" };
  try {
    return {
      uri: window.localStorage.getItem(logoUriKey(organizationId)) || "",
      fileId: window.localStorage.getItem(logoFileIdKey(organizationId)) || "",
    };
  } catch {
    return { uri: "", fileId: "" };
  }
};

export const writeOrganizationLogoCache = (
  organizationId: string,
  logo: OrganizationLogoCache,
) => {
  if (!organizationId || typeof window === "undefined") return;
  try {
    if (logo.uri) window.localStorage.setItem(logoUriKey(organizationId), logo.uri);
    else window.localStorage.removeItem(logoUriKey(organizationId));

    if (logo.fileId) window.localStorage.setItem(logoFileIdKey(organizationId), logo.fileId);
    else window.localStorage.removeItem(logoFileIdKey(organizationId));
  } catch {
    // Local storage is only a display cache.
  }
};

export const notifyOrganizationLogoUpdated = (detail: OrganizationLogoUpdatedDetail) => {
  window.dispatchEvent(
    new CustomEvent<OrganizationLogoUpdatedDetail>(ORGANIZATION_LOGO_UPDATED_EVENT, { detail }),
  );
};

const blobUrlCache = new Map<string, string>();

const isAbsoluteUrl = (value: string) => /^([a-z][a-z\d+\-.]*:)?\/\//i.test(value);

export const normalizeOrganizationLogoUri = (value?: string | null): string => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;
  if (isAbsoluteUrl(raw)) return raw;
  if (raw.startsWith("/")) return withAppBasePath(raw);
  return withAppBasePath(`/${raw}`);
};

export const extractOrganizationLogoFileId = (value?: string | null): string | null => {
  const uri = (value || "").trim();
  if (!uri) return null;
  const match = uri.match(/\/files\/([^/?#]+)/i);
  return match?.[1] || null;
};

export const getOrganizationLogoBlobUrl = async ({
  agencyId,
  fileId,
  organizationId,
  token,
  tenantId,
}: LogoBlobOptions): Promise<string> => {
  const cleanId = (fileId || "").trim();
  if (!cleanId) throw new Error("Missing fileId");

  const resolvedToken = token ?? getAuthToken();
  const resolvedTenantId = tenantId ?? getTenantId();
  const cacheKey = `${cleanId}::${resolvedTenantId || ""}::${organizationId || ""}`;
  const cached = blobUrlCache.get(cacheKey);
  if (cached) return cached;

  const headers: Record<string, string> = { ...getDefaultHeaders() };
  if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`;
  if (resolvedTenantId) headers["X-Tenant-Id"] = resolvedTenantId;
  if (organizationId) headers["X-Organization-Id"] = organizationId;
  if (agencyId) headers["X-Agency-Id"] = agencyId;

  const endpoints = ["/api/tiers/files"];
  let blob: Blob | null = null;
  let lastStatus = 0;

  for (const endpoint of endpoints) {
    const response = await fetch(withAppBasePath(`${endpoint}/${encodeURIComponent(cleanId)}`), {
      method: "GET",
      headers,
      credentials: "omit",
    });
    if (response.ok) {
      blob = await response.blob();
      break;
    }
    lastStatus = response.status;
  }

  if (!blob) {
    throw new Error(`Failed to fetch organization logo (${lastStatus || "unknown"})`);
  }

  const objectUrl = URL.createObjectURL(blob);
  blobUrlCache.set(cacheKey, objectUrl);
  return objectUrl;
};
