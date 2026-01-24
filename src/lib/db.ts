import { openDB, type DBSchema } from "idb";
import type {
  Tenant,
  User,
  Part,
  Bin,
  Stock,
  Supplier,
  SupplierCatalogItem,
  PurchaseOrder,
  StockMovement,
  StockRow,
  CatalogRow,
  Agency,
  UserAgency,
} from "./type";

interface YowSpareDB extends DBSchema {
  tenant: { key: string; value: Tenant };
  users: { key: string; value: User; indexes: { by_tenant: string } };
  agencies: { key: string; value: Agency; indexes: { by_org: string } };
  user_agencies: { key: string; value: UserAgency; indexes: { by_tenant: string; by_user: string } };
  parts: { key: string; value: Part; indexes: { by_tenant: string; by_sku: string } };
  bins: { key: string; value: Bin; indexes: { by_tenant: string } };
  stock: { key: string; value: StockRow; indexes: { by_tenant: string; by_part: string } };
  suppliers: { key: string; value: Supplier; indexes: { by_tenant: string } };
  catalog: { key: string; value: CatalogRow; indexes: { by_tenant: string; by_part: string } };
  pos: { key: string; value: PurchaseOrder; indexes: { by_tenant: string; by_status: string } };
  movements: { key: string; value: StockMovement; indexes: { by_tenant: string; by_synced: number } };
}

export async function getDB() {
  return openDB<YowSpareDB>("yowspare_db", 3, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tenant")) {
        db.createObjectStore("tenant");
      }

      if (!db.objectStoreNames.contains("users")) {
        const users = db.createObjectStore("users", { keyPath: "id" });
        users.createIndex("by_tenant", "tenantId");
      }

      if (!db.objectStoreNames.contains("agencies")) {
        const agencies = db.createObjectStore("agencies", { keyPath: "id" });
        agencies.createIndex("by_org", "organizationId");
      }

      if (!db.objectStoreNames.contains("user_agencies")) {
        const userAgencies = db.createObjectStore("user_agencies", { keyPath: "id" });
        userAgencies.createIndex("by_tenant", "tenantId");
        userAgencies.createIndex("by_user", "userId");
      }

      if (!db.objectStoreNames.contains("parts")) {
        const parts = db.createObjectStore("parts", { keyPath: "id" });
        parts.createIndex("by_tenant", "tenantId");
        parts.createIndex("by_sku", "sku");
      }

      if (!db.objectStoreNames.contains("bins")) {
        const bins = db.createObjectStore("bins", { keyPath: "id" });
        bins.createIndex("by_tenant", "tenantId");
      }

      if (!db.objectStoreNames.contains("stock")) {
        const stock = db.createObjectStore("stock", { keyPath: "key" });
        stock.createIndex("by_tenant", "tenantId");
        stock.createIndex("by_part", "partId");
      }

      if (!db.objectStoreNames.contains("suppliers")) {
        const suppliers = db.createObjectStore("suppliers", { keyPath: "id" });
        suppliers.createIndex("by_tenant", "tenantId");
      }

      if (!db.objectStoreNames.contains("catalog")) {
        const catalog = db.createObjectStore("catalog", { keyPath: "key" });
        catalog.createIndex("by_tenant", "tenantId");
        catalog.createIndex("by_part", "partId");
      }

      if (!db.objectStoreNames.contains("pos")) {
        const pos = db.createObjectStore("pos", { keyPath: "id" });
        pos.createIndex("by_tenant", "tenantId");
        pos.createIndex("by_status", "status");
      }

      if (!db.objectStoreNames.contains("movements")) {
        const movements = db.createObjectStore("movements", { keyPath: "id" });
        movements.createIndex("by_tenant", "tenantId");
        movements.createIndex("by_synced", "syncedKey");
      }
    },
  });
}

// Helpers to create composite keys (IDB keyPath needs a single field)
export const keys = {
  stock: (tenantId: string, partId: string, binId: string) => `${tenantId}::${partId}::${binId}`,
  catalog: (tenantId: string, supplierId: string, partId: string) => `${tenantId}::${supplierId}::${partId}`,
};
