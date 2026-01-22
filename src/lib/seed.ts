import { getDB, keys } from "./db";
import { makeMockTenant, makeMockUsers, makeMockParts, makeMockBins, makeMockStock, makeMockSuppliers, makeMockCatalog } from "./mock";
import type { Tenant, StockRow , CatalogRow } from "./type";

export async function seedIfEmpty(tenantSlug: string) {
  const db = await getDB();

  const existing = await db.get("tenant", "current");
  if (existing?.slug === tenantSlug) return;

  const tenant: Tenant = makeMockTenant(tenantSlug);
  const users = makeMockUsers(tenant.id);
  const parts = makeMockParts(tenant.id);
  const bins = makeMockBins(tenant.id);
  const stock = makeMockStock(tenant.id);
  const suppliers = makeMockSuppliers(tenant.id);
  const catalog = makeMockCatalog(tenant.id);

  await db.clear("tenant");
  await db.clear("users");
  await db.clear("parts");
  await db.clear("bins");
  await db.clear("stock");
  await db.clear("suppliers");
  await db.clear("catalog");
  await db.clear("pos");
  await db.clear("movements");

  await db.put("tenant", tenant, "current");

  for (const u of users) await db.put("users", u);
  for (const p of parts) await db.put("parts", p);
  for (const b of bins) await db.put("bins", b);

  for (const s of stock) {
  const row: StockRow = {
    ...s,
    key: keys.stock(s.tenantId, s.partId, s.binId),
  };
  await db.put("stock", row);
  }

  for (const c of catalog) {
    const row: CatalogRow = {
      ...c,
      key: keys.catalog(c.tenantId, c.supplierId, c.partId),
    };
    await db.put("catalog", row);
  }

}
