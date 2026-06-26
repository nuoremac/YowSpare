import { NextResponse } from "next/server";

const DEFAULT_LOCAL_TENANT_ID = "11111111-1111-1111-1111-111111111111";

type JsonObject = Record<string, unknown>;

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parsePayloadObject = (value: unknown): JsonObject => {
  if (isJsonObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return isJsonObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const fileImageUrl = (fileId: string) =>
  `/api/tiers/files/${encodeURIComponent(fileId)}`;

const getKernelConfiguration = () => {
  const baseUrl = (
    process.env.KERNEL_CORE_DEST ||
    process.env.TIERS_API_DEST ||
    "http://localhost:8080"
  ).replace(/\/+$/, "");
  const clientId = process.env.KERNEL_CORE_CLIENT_ID;
  const apiKey = process.env.KERNEL_CORE_API_KEY;
  const tenantId =
    process.env.KERNEL_CORE_DEFAULT_TENANT_ID || DEFAULT_LOCAL_TENANT_ID;

  if (!clientId || !apiKey) {
    throw new Error(
      "KERNEL_CORE_CLIENT_ID and KERNEL_CORE_API_KEY must be configured on the Next.js server.",
    );
  }

  return { apiKey, baseUrl, clientId, tenantId };
};

const parseJsonBody = async (request: Request): Promise<unknown> => {
  if (request.method === "GET" || request.method === "HEAD") return undefined;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return request.arrayBuffer();
  }

  const text = await request.text();
  return text ? JSON.parse(text) : undefined;
};

const mapAuthRequest = (
  path: string,
  body: unknown,
  tenantId: string,
): { body: unknown; path: string } => {
  if (!isJsonObject(body)) return { body, path };

  if (path === "auth/register") {
    const email = typeof body.email === "string" ? body.email : undefined;
    const company = typeof body.company === "string" ? body.company : undefined;

    return {
      path: "auth/sign-up",
      body: {
        tenantId,
        firstName: body.firstName,
        lastName: body.lastName,
        username: email,
        email,
        password: body.password,
        accountType: "BUSINESS",
        businessType: "FREELANCE",
        onboardingData: company ? { businessName: company } : undefined,
      },
    };
  }

  if (path === "auth/login") {
    return {
      path,
      body: {
        principal: body.principal || body.email,
        password: body.password,
      },
    };
  }

  return { body, path };
};

const mapLegacyPath = (
  path: string,
  organizationId: string | null,
  method: string,
) => {
  const legacyCommercialMatch = path.match(
    /^api\/v1\/(customers|suppliers|prospects|sales-agents)(\/.*)?$/,
  );
  if (legacyCommercialMatch) {
    return `${legacyCommercialMatch[1]}${legacyCommercialMatch[2] || ""}`;
  }

  if (path === "agencies" && organizationId) {
    return `organizations/${organizationId}/agencies`;
  }

  if (path === "employees" && method === "POST") {
    return "employees/invite";
  }

  const agencyMatch = path.match(/^agencies\/([^/]+)$/);
  if (agencyMatch && organizationId) {
    return `organizations/${organizationId}/agencies/${agencyMatch[1]}`;
  }

  return path;
};

const mapLegacySettingsFallbackPath = (path: string) => {
  if (path === "settings/global") {
    return "general-options/api/settings/global";
  }

  const agencySettingsMatch = path.match(/^settings\/agency\/([^/]+)$/);
  if (agencySettingsMatch) {
    return `general-options/api/settings/agency/${agencySettingsMatch[1]}`;
  }

  return null;
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 32);

const mapLegacyBody = (path: string, body: unknown) => {
  if (!isJsonObject(body)) return body;

  if (path === "organizations" && typeof body.name === "string") {
    const actorSuffix =
      typeof body.businessActorId === "string"
        ? body.businessActorId.replace(/-/g, "").slice(0, 8)
        : "OWNER";
    return {
      businessActorId: body.businessActorId,
      code: `${slugify(body.name) || "ORGANIZATION"}-${actorSuffix}`,
      organizationType: body.serviceType || "PRIVATE_COMPANY",
      displayName: body.name,
      legalName: body.name,
      email: body.email,
      description: body.description,
      logoUri: body.logoUri,
      logoId: body.logoId,
    };
  }

  if (
    (path === "agencies" || /^agencies\/[^/]+$/.test(path)) &&
    typeof body.name === "string"
  ) {
    const name = body.name.trim();
    const legacyType =
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim().toUpperCase()
        : "OFFICE";
    const isHeadquarter = body.headquarter === true || legacyType === "HQ";

    return {
      code:
        typeof body.code === "string" && body.code.trim()
          ? body.code.trim()
          : slugify(name),
      name,
      shortName: name,
      longName: name,
      location:
        typeof body.address === "string" ? body.address.trim() || undefined : undefined,
      city:
        typeof body.city === "string" ? body.city.trim() || undefined : undefined,
      isHeadquarter,
      agencyType: isHeadquarter ? "BRANCH" : legacyType,
      active: true,
    };
  }

  if (path === "employees" && typeof body.email === "string") {
    return {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      roleId: body.roleId,
      agencyId: body.agencyId,
      permissions: Array.isArray(body.permissionIds)
        ? body.permissionIds
        : undefined,
    };
  }

  return body;
};

const toLegacyUser = (data: JsonObject) => {
  const organizations = Array.isArray(data.organizations)
    ? data.organizations
    : [];
  const primaryOrganization = organizations.find(isJsonObject);
  const authorities = Array.isArray(data.authorities)
    ? data.authorities
    : undefined;
  const onboardingPayload = parsePayloadObject(data.onboardingPayload);
  const profilePhotoFileId =
    typeof onboardingPayload.profilePhotoFileId === "string"
      ? onboardingPayload.profilePhotoFileId
      : undefined;

  return {
    id: data.id,
    tenantId: data.tenantId,
    organizationId: primaryOrganization?.organizationId,
    email: data.email,
    businessActorId: data.actorId,
    ...(authorities ? { roles: authorities } : {}),
    plan: data.plan,
    onboardingStatus: data.onboardingStatus,
    onboardingStep: data.onboardingStep,
    accountType: data.accountType,
    businessType: data.businessType,
    onboardingPayload: data.onboardingPayload,
    ...(profilePhotoFileId
      ? {
          profilePhotoFileId,
          profilePhotoUrl: fileImageUrl(profilePhotoFileId),
        }
      : {}),
    active: data.status === "ACTIVE",
  };
};

const mapAuthResponse = (path: string, data: unknown): unknown => {
  if (
    (path === "auth/register" || path === "auth/login") &&
    isJsonObject(data)
  ) {
    return {
      token: data.accessToken || data.sessionToken,
      user: toLegacyUser(data),
    };
  }

  return data;
};

const mapLegacyAgency = (item: JsonObject): JsonObject => ({
  ...item,
  type: item.isHeadquarter ? "HQ" : item.agencyType,
  address: item.location,
  headquarter: item.isHeadquarter,
  isActive: item.active,
});

const mapLegacyEmployee = (item: JsonObject): JsonObject => ({
  ...item,
  userEmail: item.email,
  userFirstName: item.firstName,
  userLastName: item.lastName,
  active: item.status === "ACTIVE",
});

const mapLegacyRole = (item: JsonObject): JsonObject => ({
  ...item,
  description: item.code,
  permissions: Array.isArray(item.permissions)
    ? item.permissions.map((authority) => ({ authority }))
    : [],
});

const mapLegacyResponse = (path: string, data: unknown): unknown => {
  if (
    (path === "users/me" || path.startsWith("users/me/")) &&
    isJsonObject(data)
  ) {
    return toLegacyUser(data);
  }

  if (path === "organizations" || path.startsWith("organizations/")) {
    if (Array.isArray(data)) {
      return data.map((item) => mapLegacyResponse(path, item));
    }
    if (isJsonObject(data)) {
      return {
        ...data,
        name: data.shortName || data.longName,
        serviceType: data.service,
        active: data.isActive,
        individualBusiness: data.isIndividualBusiness,
      };
    }
  }

  if (path === "agencies" && Array.isArray(data)) {
    return data.map((item) =>
      isJsonObject(item) ? mapLegacyAgency(item) : item,
    );
  }

  if (/^agencies\/[^/]+$/.test(path) && isJsonObject(data)) {
    return mapLegacyAgency(data);
  }

  if (path === "employees") {
    if (Array.isArray(data)) {
      return data.map((item) =>
        isJsonObject(item) ? mapLegacyEmployee(item) : item,
      );
    }
    if (isJsonObject(data)) {
      return mapLegacyEmployee(data);
    }
  }

  if (path === "employees/roles" && Array.isArray(data)) {
    return data.map((item) =>
      isJsonObject(item) ? mapLegacyRole(item) : item,
    );
  }

  return data;
};

const buildUpstreamHeaders = (
  request: Request,
  clientId: string,
  apiKey: string,
  defaultTenantId: string,
) => {
  const headers = new Headers();
  const forwardedHeaders = [
    "accept",
    "authorization",
    "content-type",
    "x-agency-id",
    "x-organization-id",
    "x-request-id",
    "x-tenant-id",
  ];

  forwardedHeaders.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });

  headers.set("X-Client-Id", clientId);
  headers.set("X-Api-Key", apiKey);
  if (!headers.has("X-Tenant-Id")) {
    headers.set("X-Tenant-Id", defaultTenantId);
  }

  return headers;
};

const createProxyResponse = async (
  response: Response,
  frontendPath: string,
) => {
  const contentType = response.headers.get("content-type") || "";
  const responseHeaders = new Headers();
  responseHeaders.set(
    "content-type",
    contentType || "application/octet-stream",
  );

  if (!contentType.toLowerCase().includes("application/json")) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  const payload: unknown = await response.json();
  if (!response.ok || !isJsonObject(payload) || !("data" in payload)) {
    return NextResponse.json(payload, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  const authMapped = mapAuthResponse(frontendPath, payload.data);
  return NextResponse.json(mapLegacyResponse(frontendPath, authMapped), {
    status: response.status,
    headers: responseHeaders,
  });
};

export const proxyTiersRequest = async (
  request: Request,
  pathSegments: string[],
) => {
  try {
    const configuration = getKernelConfiguration();
    const frontendPath = pathSegments.join("/");
    const requestBody = await parseJsonBody(request);
    const organizationId = request.headers.get("x-organization-id");
    const legacyPath = mapLegacyPath(
      frontendPath,
      organizationId,
      request.method,
    );
    const mappedRequest = mapAuthRequest(
      legacyPath,
      mapLegacyBody(frontendPath, requestBody),
      configuration.tenantId,
    );
    const requestUrl = new URL(request.url);
    const upstreamSearch = new URLSearchParams(requestUrl.searchParams);
    if (
      organizationId &&
      (mappedRequest.path === "employees" ||
        mappedRequest.path === "employees/invite") &&
      !upstreamSearch.has("organizationId")
    ) {
      upstreamSearch.set("organizationId", organizationId);
    }
    const search = upstreamSearch.size ? `?${upstreamSearch.toString()}` : "";
    const upstreamUrl = new URL(
      `/api/${mappedRequest.path}${search}`,
      configuration.baseUrl,
    );
    const headers = buildUpstreamHeaders(
      request,
      configuration.clientId,
      configuration.apiKey,
      configuration.tenantId,
    );

    const requestBodyValue =
      mappedRequest.body === undefined
        ? undefined
        : mappedRequest.body instanceof ArrayBuffer
          ? mappedRequest.body
          : JSON.stringify(mappedRequest.body);
    const requestInit: RequestInit = {
      method: request.method,
      headers,
      body: requestBodyValue,
      cache: "no-store",
      redirect: "manual",
    };

    let response = await fetch(upstreamUrl, requestInit);
    const fallbackPath = mapLegacySettingsFallbackPath(mappedRequest.path);
    if (response.status === 404 && fallbackPath) {
      const fallbackUrl = new URL(
        `/api/${fallbackPath}${search}`,
        configuration.baseUrl,
      );
      response = await fetch(fallbackUrl, requestInit);
    }

    return createProxyResponse(response, frontendPath);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "KernelCore proxy failed.";
    return NextResponse.json(
      {
        success: false,
        data: null,
        message,
        errorCode: "KERNEL_PROXY_ERROR",
      },
      { status: 502 },
    );
  }
};
