export type Role =
  | "ORG_ADMIN"
  | "TENANT_ADMIN"
  | "INVENTORY_MANAGER"
  | "ANALYST"
  | "PROCUREMENT_MANAGER"
  | "PROCUREMENT"
  | "WAREHOUSE"
  | "TECH"
  | "PLANNER"
  | "SUPPLIER";

export type OrganizationProfile = {
  taxNumber?: string;
  registrationNumber?: string;
  capitalShare?: string;
  ceoName?: string;
  yearFounded?: number;
  logoUrl?: string;
  websiteUrl?: string;
  socials?: string[];
  email?: string;
  description?: string;
  legalForm?: string;
  headquarterAgencyId?: string;
};

export type Agency = {
  id: string;
  organizationId: string;
  name: string;
  location?: string;
  ownerId?: string;
  description?: string;
  openTime?: string;
  closeTime?: string;
  contact?: string;
  averageRevenue?: number;
  registrationNumbers?: string[];
  totalAffiliatedCustomers?: number;
  taxNumber?: string;
};

export type Tenant = {
  id: string;
  slug: string; // e.g. oilco
  name: string;
  profile?: OrganizationProfile;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  password?: string;
  agencyId?: string;
  department?: string;
  phone?: string;
  description?: string;
  gender?: string;
  photoUrl?: string;
  nationality?: string;
  birthDate?: string;
  profession?: string;
  biography?: string;
  addresses?: string[];
  contact?: string;
};

export type UserAgency = {
  id: string;
  tenantId: string;
  userId: string;
  agencyId: string;
  role: Role;
};

export type Invite = {
  id: string;
  tenantId: string;
  email: string;
  role: Role;
  createdAt: number;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  agencyId?: string;
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
