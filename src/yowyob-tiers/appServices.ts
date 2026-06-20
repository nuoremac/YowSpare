import { getOrganizationId } from "@/lib/api";
import { OpenAPI } from "@/lib-tiers/core/OpenAPI";
import { request } from "@/lib-tiers/core/request";

export type Supplier = {
  id: string;
  name?: string;
  status?: "ACTIVE" | "INACTIVE";
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  updatedAt?: string;
};

export type SupplierProduct = {
  id: string;
  supplierId: string;
  productId: string;
  leadTimeDays?: number;
  moq?: number;
  preferred?: boolean;
  unitPrice?: number;
  updatedAt?: string;
};

type UpsertSupplierPayload = {
  name: string;
  status?: "ACTIVE" | "INACTIVE";
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

type KernelSupplier = {
  id?: string;
  code?: string;
  referenceCode?: string;
  displayName?: string;
  name?: string;
  longName?: string;
  enabled?: boolean;
  active?: boolean;
  status?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  segment?: string;
  notes?: string;
  updatedAt?: string;
  modifiedAt?: string;
  createdAt?: string;
  deletedAt?: string | null;
};

type SupplierOverlay = Pick<Supplier, "email" | "phone" | "address" | "notes" | "status" | "updatedAt">;

const SUPPLIER_OVERLAY_KEY = "yowspare:supplier-overlays:v1";
const SUPPLIER_PRODUCTS_KEY = "yowspare:supplier-products:v1";

const isBrowser = () => typeof window !== "undefined";

const readJson = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage is only used for frontend-only supplier metadata.
  }
};

const sessionOrganizationId = () => {
  const fromApi = getOrganizationId();
  if (fromApi) return fromApi;
  const session = readJson<{
    state?: {
      tenant?: { id?: string | null } | null;
      user?: { organizationId?: string | null } | null;
    };
  } | null>("yowspare-session", null);
  return session?.state?.tenant?.id || session?.state?.user?.organizationId || "";
};

const requireOrganizationId = () => {
  const organizationId = sessionOrganizationId();
  if (!organizationId) {
    throw new Error("No active organization is selected.");
  }
  return organizationId;
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 24) || "SUPPLIER";

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const supplierCode = (name: string, id?: string) =>
  `${slugify(name)}-${(id || randomId()).replace(/-/g, "").slice(0, 8)}`;

const readSupplierOverlays = () =>
  readJson<Record<string, SupplierOverlay>>(SUPPLIER_OVERLAY_KEY, {});

const writeSupplierOverlay = (id: string, payload: UpsertSupplierPayload) => {
  const overlays = readSupplierOverlays();
  overlays[id] = {
    email: payload.email?.trim() || "",
    phone: payload.phone?.trim() || "",
    address: payload.address?.trim() || "",
    notes: payload.notes?.trim() || "",
    status: payload.status || "ACTIVE",
    updatedAt: new Date().toISOString(),
  };
  writeJson(SUPPLIER_OVERLAY_KEY, overlays);
};

const removeSupplierOverlay = (id: string) => {
  const overlays = readSupplierOverlays();
  delete overlays[id];
  writeJson(SUPPLIER_OVERLAY_KEY, overlays);
};

const fromKernel = (row: KernelSupplier): Supplier => {
  const id = row.id || "";
  const overlay = readSupplierOverlays()[id] || {};
  const backendStatus = String(row.status || "").toUpperCase();
  return {
    id,
    name: row.displayName || row.name || row.longName || row.referenceCode || row.code || "",
    status:
      overlay.status ||
      (backendStatus === "INACTIVE" || row.active === false || row.enabled === false ? "INACTIVE" : "ACTIVE"),
    email: overlay.email || row.email || "",
    phone: overlay.phone || row.phone || "",
    address: overlay.address || row.address || row.location || "",
    notes: overlay.notes || row.notes || row.segment || "",
    updatedAt: overlay.updatedAt || row.updatedAt || row.modifiedAt || row.createdAt,
  };
};

const toRequest = (payload: UpsertSupplierPayload) => ({
  organizationId: requireOrganizationId(),
  partyType: "ORGANIZATION",
  partyId: randomId(),
  code: supplierCode(payload.name),
  name: payload.name.trim(),
  enabled: payload.status !== "INACTIVE",
  prospect: false,
  type: "COMPANY",
  longName: payload.name.trim(),
  segment: payload.notes?.trim() || undefined,
});

const toUpdateRequest = (id: string, payload: UpsertSupplierPayload) => ({
  code: supplierCode(payload.name, id),
  name: payload.name.trim(),
  roles: ["SUPPLIER"],
  enabled: payload.status !== "INACTIVE",
  prospect: false,
  type: "COMPANY",
  longName: payload.name.trim(),
  segment: payload.notes?.trim() || undefined,
});

const readSupplierProductIndex = () =>
  readJson<Record<string, SupplierProduct[]>>(SUPPLIER_PRODUCTS_KEY, {});

const writeSupplierProductIndex = (index: Record<string, SupplierProduct[]>) => {
  writeJson(SUPPLIER_PRODUCTS_KEY, index);
};

export class SuppliersService {
  static async list() {
    const rows = await request<KernelSupplier[]>(OpenAPI, {
      method: "GET",
      url: "/suppliers",
      query: { organizationId: requireOrganizationId() },
    });
    return (rows || []).map(fromKernel);
  }

  static async create(payload: UpsertSupplierPayload) {
    const created = await request<KernelSupplier>(OpenAPI, {
      method: "POST",
      url: "/suppliers",
      body: toRequest(payload),
      mediaType: "application/json",
    });
    const mapped = fromKernel(created);
    if (!mapped.id) return mapped;
    writeSupplierOverlay(mapped.id, payload);
    return fromKernel(created);
  }

  static async upsert(id: string, payload: UpsertSupplierPayload) {
    const saved = await request<KernelSupplier>(OpenAPI, {
      method: "PATCH",
      url: "/suppliers/{id}",
      path: { id },
      body: toUpdateRequest(id, payload),
      mediaType: "application/json",
    });
    const mapped = fromKernel(saved);
    if (!mapped.id) return mapped;
    writeSupplierOverlay(mapped.id, payload);
    return fromKernel(saved);
  }

  static async delete(id: string) {
    await request<void>(OpenAPI, {
      method: "DELETE",
      url: "/suppliers/{id}",
      path: { id },
    });
    removeSupplierOverlay(id);
    const index = readSupplierProductIndex();
    delete index[id];
    writeSupplierProductIndex(index);
  }

  static listSupplierProducts(supplierId: string) {
    return Promise.resolve(readSupplierProductIndex()[supplierId] || []);
  }

  static upsertSupplierProduct(
    supplierId: string,
    productId: string,
    payload: { leadTimeDays?: number; moq?: number; preferred?: boolean; unitPrice?: number }
  ) {
    const index = readSupplierProductIndex();
    const rows = index[supplierId] || [];
    const saved: SupplierProduct = {
      id: `${supplierId}:${productId}`,
      supplierId,
      productId,
      leadTimeDays: payload.leadTimeDays,
      moq: payload.moq,
      preferred: payload.preferred,
      unitPrice: payload.unitPrice,
      updatedAt: new Date().toISOString(),
    };
    index[supplierId] = [saved, ...rows.filter((row) => row.productId !== productId)];
    writeSupplierProductIndex(index);
    return Promise.resolve(saved);
  }

  static deleteSupplierProduct(supplierId: string, productId: string) {
    const index = readSupplierProductIndex();
    index[supplierId] = (index[supplierId] || []).filter((row) => row.productId !== productId);
    writeSupplierProductIndex(index);
    return Promise.resolve();
  }
}
