import { getDB } from "./db";
import type { StockMovement } from "./type";

export async function queueMovement(movement: StockMovement) {
  const db = await getDB();
  await db.put("movements", {
    ...movement,
    syncedKey: movement.synced ? 1 : 0,
  });
}

export async function getPendingCount(tenantId: string) {
  const db = await getDB();
  const all = await db.getAllFromIndex("movements", "by_tenant", tenantId);
  return all.filter((m) => !m.synced).length;
}

export async function mockSyncNow(tenantId: string) {
  const db = await getDB();
  const all = await db.getAllFromIndex("movements", "by_tenant", tenantId);
  const pending = all.filter((m) => !m.synced);

  for (const m of pending) {
    await db.put("movements", { ...m, synced: true, syncedKey: 1 });
  }
  return pending.length;
}
