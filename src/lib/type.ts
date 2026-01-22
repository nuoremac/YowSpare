export type Role = "PROCUREMENT" | "WAREHOUSE" | "TECH" | "PLANNER" | "SUPPLIER";

export type Tenant = {
  id: string;
  slug: string; // e.g. oilco
  name: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
};

export type Part = {
  id: string;
  tenantId: string;
  sku: string;
  description: string;
  photoUrl?: string;
  uom: string;
  rop: number;
  safetyStock: number;
};

export type Bin = {
  id: string;
  tenantId: string;
  warehouse: string;
  code: string;
  x: number; // mocked map coords (0..100)
  y: number; // mocked map coords (0..100)
};

export type Stock = {
  partId: string;
  binId: string;
  tenantId: string;
  qty: number;
};

export type Supplier = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
};

export type SupplierCatalogItem = {
  supplierId: string;
  tenantId: string;
  partId: string;
  unitPrice: number;
  avgLeadTimeDays: number;
  availability: "IN_STOCK" | "LIMITED" | "BACKORDER";
};

export type PurchaseOrder = {
  id: string;
  tenantId: string;
  createdAt: number;
  partId: string;
  qty: number;
  supplierId: string;
  status: "DRAFT" | "SENT" | "RESPONDED" | "CLOSED";
  vendorResponse?: {
    unitPrice: number;
    leadTimeDays: number;
    message?: string;
    respondedAt: number;
  };
};

export type StockMovement = {
  id: string;
  tenantId: string;
  createdAt: number;
  type: "IN" | "OUT" | "TRANSFER";
  partId: string;
  fromBinId?: string;
  toBinId?: string;
  qty: number;
  createdBy: string; // userId
  synced: boolean;   // mock sync flag
  syncedKey: 0 | 1;
};

// IndexedDB record shapes (include composite key for stores using keyPath: "key")
export type StockRow = Stock & { key: string };
export type CatalogRow = SupplierCatalogItem & { key: string };

