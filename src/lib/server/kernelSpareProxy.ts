import { NextResponse } from "next/server";

const DEFAULT_LOCAL_TENANT_ID = "11111111-1111-1111-1111-111111111111";

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const configuration = () => {
  const baseUrl = (
    process.env.KERNEL_CORE_DEST ||
    process.env.SPARE_API_DEST ||
    "http://localhost:8080"
  ).replace(/\/+$/, "");
  const clientId = process.env.KERNEL_CORE_CLIENT_ID;
  const apiKey = process.env.KERNEL_CORE_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("KernelCore client credentials are not configured.");
  }

  return {
    apiKey,
    baseUrl,
    clientId,
    tenantId:
      process.env.KERNEL_CORE_DEFAULT_TENANT_ID || DEFAULT_LOCAL_TENANT_ID,
  };
};

const requestHeaders = (
  request: Request,
  clientId: string,
  apiKey: string,
  defaultTenantId: string,
) => {
  const headers = new Headers();
  [
    "accept",
    "authorization",
    "content-type",
    "x-agency-id",
    "x-organization-id",
    "x-request-id",
    "x-tenant-id",
  ].forEach((name) => {
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

const parseBody = async (request: Request) => {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const text = await request.text();
  return text ? (JSON.parse(text) as unknown) : undefined;
};

const unwrap = (payload: unknown) =>
  isObject(payload) && "data" in payload ? payload.data : payload;

export const proxySpareRequest = async (
  request: Request,
  pathSegments: string[],
) => {
  try {
    const config = configuration();
    const headers = requestHeaders(
      request,
      config.clientId,
      config.apiKey,
      config.tenantId,
    );
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(
      `/api/spare/${pathSegments.map(encodeURIComponent).join("/")}${requestUrl.search}`,
      config.baseUrl,
    );
    const body = await parseBody(request);
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json(unwrap(payload), { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "KernelCore spare proxy failed.",
        errorCode: "KERNEL_SPARE_PROXY_ERROR",
      },
      { status: 502 },
    );
  }
};
