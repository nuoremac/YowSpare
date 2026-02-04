import { OpenAPI as CoreOpenAPI } from "@/lib/core/OpenAPI";
import { OpenAPI as StockOpenAPI } from "@/lib1/core/OpenAPI";

const coreBase = process.env.NEXT_PUBLIC_CORE_API_BASE?.trim();
const stockBase = process.env.NEXT_PUBLIC_STOCK_API_BASE?.trim();

if (coreBase) {
  CoreOpenAPI.BASE = coreBase;
}

if (stockBase) {
  StockOpenAPI.BASE = stockBase;
}

export function setAuthToken(token: string | null) {
  CoreOpenAPI.TOKEN = token || undefined;
  StockOpenAPI.TOKEN = token || undefined;
}

export function setTenantId(tenantId: string | null) {
  const header = tenantId ? { "X-Tenant-ID": tenantId } : undefined;
  CoreOpenAPI.HEADERS = header;
  StockOpenAPI.HEADERS = header;
}
