import type { Tenant, User, Part, Bin, Stock, Supplier, SupplierCatalogItem, Agency, UserAgency } from "./type";

export function makeMockTenant(slug: string): Tenant {
  return {
    id: `t_${slug}`,
    slug,
    name: slug.toUpperCase() + " Industries",
    profile: {
      taxNumber: "TX-984233",
      registrationNumber: "BR-104455",
      capitalShare: "5,000,000",
      ceoName: "Amina Diallo",
      yearFounded: 2006,
      logoUrl: "/icons/yowspareicon.png",
      websiteUrl: "https://yowspare.example.com",
      socials: ["https://linkedin.com/company/yowspare"],
      email: "contact@yowspare.example.com",
      description: "Industrial MRO organization focused on uptime.",
      legalForm: "LLC",
      headquarterAgencyId: "a_hq",
    },
  };
}

export function makeMockUsers(tenantId: string): User[] {
  return [
    { id: "u_org_admin", tenantId, email: "org.admin@company.com", name: "Org Admin", role: "ORG_ADMIN", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_tenant_admin", tenantId, email: "admin@company.com", name: "Tenant Admin", role: "TENANT_ADMIN", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_inv_mgr", tenantId, email: "inventory@company.com", name: "Inventory Manager", role: "INVENTORY_MANAGER", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_proc_mgr", tenantId, email: "procurement@company.com", name: "Procurement Manager", role: "PROCUREMENT_MANAGER", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_analyst", tenantId, email: "analyst@company.com", name: "Analyst", role: "ANALYST", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_tech", tenantId, email: "tech@company.com", name: "Field Technician", role: "TECH", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_wh", tenantId, email: "warehouse@company.com", name: "Warehouse Manager", role: "WAREHOUSE", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_plan", tenantId, email: "planner@company.com", name: "MRO Planner", role: "PLANNER", agencyId: "a_hq", password: "Demo123!" },
    { id: "u_vendor", tenantId, email: "vendor@supplier.com", name: "Vendor User", role: "SUPPLIER", password: "Demo123!" },
  ];
}

export function makeMockAgencies(tenantId: string): Agency[] {
  return [
    {
      id: "a_hq",
      organizationId: tenantId,
      name: "Headquarters",
      location: "Douala, Cameroon",
      ownerId: "u_org_admin",
      description: "Primary operations hub and executive offices.",
      openTime: "07:30",
      closeTime: "18:00",
      contact: "+237 690 000 000",
      averageRevenue: 4500000,
      registrationNumbers: ["REG-CA-104455"],
      totalAffiliatedCustomers: 120,
      taxNumber: "TX-984233",
    },
    {
      id: "a_north",
      organizationId: tenantId,
      name: "Northern Field Agency",
      location: "Garoua, Cameroon",
      ownerId: "u_tenant_admin",
      description: "Field maintenance and rapid response site.",
      openTime: "08:00",
      closeTime: "17:30",
      contact: "+237 699 000 111",
      averageRevenue: 1800000,
      registrationNumbers: ["REG-NO-209988"],
      totalAffiliatedCustomers: 42,
      taxNumber: "TX-203344",
    },
  ];
}

export function makeMockUserAgencies(tenantId: string): UserAgency[] {
  return [
    { id: "ua_org_admin_hq", tenantId, userId: "u_org_admin", agencyId: "a_hq", role: "ORG_ADMIN" },
    { id: "ua_tenant_admin_hq", tenantId, userId: "u_tenant_admin", agencyId: "a_hq", role: "TENANT_ADMIN" },
    { id: "ua_inv_hq", tenantId, userId: "u_inv_mgr", agencyId: "a_hq", role: "INVENTORY_MANAGER" },
    { id: "ua_proc_hq", tenantId, userId: "u_proc_mgr", agencyId: "a_hq", role: "PROCUREMENT_MANAGER" },
    { id: "ua_analyst_hq", tenantId, userId: "u_analyst", agencyId: "a_hq", role: "ANALYST" },
    { id: "ua_tech_hq", tenantId, userId: "u_tech", agencyId: "a_hq", role: "TECH" },
    { id: "ua_wh_hq", tenantId, userId: "u_wh", agencyId: "a_hq", role: "WAREHOUSE" },
    { id: "ua_plan_hq", tenantId, userId: "u_plan", agencyId: "a_hq", role: "PLANNER" },
    { id: "ua_vendor_hq", tenantId, userId: "u_vendor", agencyId: "a_hq", role: "SUPPLIER" },
  ];
}

export function makeMockParts(tenantId: string): Part[] {
  return [
    { id: "p_001", tenantId, sku: "BRG-6205", description: "Bearing 6205 Deep Groove", uom: "EA", rop: 6, safetyStock: 3, photoUrl: "https://picsum.photos/seed/bearing/400/300" },
    { id: "p_002", tenantId, sku: "FLT-10UM", description: "Hydraulic Filter 10µm", uom: "EA", rop: 10, safetyStock: 5, photoUrl: "https://picsum.photos/seed/filter/400/300" },
    { id: "p_003", tenantId, sku: "VLV-SS-2", description: "Stainless Steel Valve 2in", uom: "EA", rop: 2, safetyStock: 1, photoUrl: "https://picsum.photos/seed/valve/400/300" },
    { id: "p_004", tenantId, sku: "MTR-7.5KW", description: "Motor 7.5kW 3-phase", uom: "EA", rop: 1, safetyStock: 1, photoUrl: "https://picsum.photos/seed/motor/400/300" }
  ];
}

export function makeMockBins(tenantId: string): Bin[] {
  return [
    { id: "b_A1", tenantId, warehouse: "Main WH", code: "A-01", x: 15, y: 20 },
    { id: "b_A2", tenantId, warehouse: "Main WH", code: "A-02", x: 30, y: 20 },
    { id: "b_B1", tenantId, warehouse: "Main WH", code: "B-01", x: 15, y: 45 },
    { id: "b_C3", tenantId, warehouse: "Field WH", code: "C-03", x: 70, y: 65 }
  ];
}

export function makeMockStock(tenantId: string): Stock[] {
  return [
    { tenantId, partId: "p_001", binId: "b_A1", qty: 4 },
    { tenantId, partId: "p_002", binId: "b_A2", qty: 9 },
    { tenantId, partId: "p_003", binId: "b_B1", qty: 1 },
    { tenantId, partId: "p_004", binId: "b_C3", qty: 0 }
  ];
}

export function makeMockSuppliers(tenantId: string): Supplier[] {
  return [
    { id: "s_01", tenantId, name: "Atlas Supplies", email: "sales@atlas.com" },
    { id: "s_02", tenantId, name: "Sahel Industrial", email: "quotes@sahel.com" },
    { id: "s_03", tenantId, name: "Coastal MRO", email: "orders@coastal.com" }
  ];
}

export function makeMockCatalog(tenantId: string): SupplierCatalogItem[] {
  return [
    { tenantId, supplierId: "s_01", partId: "p_001", unitPrice: 18.5, avgLeadTimeDays: 14, availability: "IN_STOCK" },
    { tenantId, supplierId: "s_02", partId: "p_001", unitPrice: 17.2, avgLeadTimeDays: 21, availability: "LIMITED" },
    { tenantId, supplierId: "s_03", partId: "p_001", unitPrice: 19.0, avgLeadTimeDays: 10, availability: "IN_STOCK" },

    { tenantId, supplierId: "s_01", partId: "p_002", unitPrice: 9.9, avgLeadTimeDays: 7, availability: "IN_STOCK" },
    { tenantId, supplierId: "s_02", partId: "p_002", unitPrice: 9.4, avgLeadTimeDays: 12, availability: "IN_STOCK" },

    { tenantId, supplierId: "s_01", partId: "p_003", unitPrice: 210, avgLeadTimeDays: 30, availability: "BACKORDER" },
    { tenantId, supplierId: "s_03", partId: "p_003", unitPrice: 245, avgLeadTimeDays: 18, availability: "LIMITED" },

    { tenantId, supplierId: "s_02", partId: "p_004", unitPrice: 890, avgLeadTimeDays: 45, availability: "LIMITED" }
  ];
}
