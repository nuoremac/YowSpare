import { OpenAPI as CoreOpenAPI } from "@/lib-core/core/OpenAPI";
import { OpenAPI as SpareOpenAPI } from "@/lib-spare/core/OpenAPI";
import { OpenAPI as StockOpenAPI } from "@/lib-stock/core/OpenAPI";
import { OpenAPI as TiersOpenAPI } from "@/lib-tiers/core/OpenAPI";
import { OpenAPI as BillingOpenAPI } from "@/yowyob-billing/core/OpenAPI";

type OpenApiLike = {
  TOKEN?: unknown;
  HEADERS?: unknown;
};

const clients: OpenApiLike[] = [
  CoreOpenAPI,
  StockOpenAPI,
  SpareOpenAPI,
  TiersOpenAPI,
  BillingOpenAPI,
];

let authToken: string | null = null;
let tenantId: string | null = null;
let organizationId: string | null = null;
let agencyId: string | null = null;

const applyAuth = () => {
  const token = authToken || undefined;
  const headers: Record<string, string> = {};
  if (tenantId) headers["X-Tenant-Id"] = tenantId;
  if (organizationId) headers["X-Organization-Id"] = organizationId;
  if (agencyId) headers["X-Agency-Id"] = agencyId;
  clients.forEach((client) => {
    client.TOKEN = token;
    client.HEADERS = Object.keys(headers).length ? headers : undefined;
  });
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
  applyAuth();
};

export const getAuthToken = () => authToken;

export const setTenantId = (id: string | null) => {
  tenantId = id;
  applyAuth();
};

export const getTenantId = () => tenantId;

export const setOrganizationId = (id: string | null) => {
  organizationId = id;
  applyAuth();
};

export const getOrganizationId = () => organizationId;

export const setAgencyId = (id: string | null) => {
  agencyId = id;
  applyAuth();
};

export const getAgencyId = () => agencyId;

export const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (tenantId) headers["X-Tenant-Id"] = tenantId;
  if (organizationId) headers["X-Organization-Id"] = organizationId;
  if (agencyId) headers["X-Agency-Id"] = agencyId;
  return headers;
};
