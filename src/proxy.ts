import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_LOCAL_TENANT_ID = "11111111-1111-1111-1111-111111111111";

export function proxy(request: NextRequest) {
  const clientId = process.env.KERNEL_CORE_CLIENT_ID;
  const apiKey = process.env.KERNEL_CORE_API_KEY;

  if (!clientId || !apiKey) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          "KERNEL_CORE_CLIENT_ID and KERNEL_CORE_API_KEY must be configured on the Next.js server.",
        errorCode: "KERNEL_PROXY_CONFIG_ERROR",
      },
      { status: 502 },
    );
  }

  const headers = new Headers(request.headers);
  headers.set("X-Client-Id", clientId);
  headers.set("X-Api-Key", apiKey);
  if (!headers.has("X-Tenant-Id")) {
    headers.set(
      "X-Tenant-Id",
      process.env.KERNEL_CORE_DEFAULT_TENANT_ID || DEFAULT_LOCAL_TENANT_ID,
    );
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/api/core/:path*",
    "/api/stock/:path*",
    "/api/spare/:path*",
    "/api/billing/:path*",
    "/api/accounting/:path*",
  ],
};
