"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getDB } from "@/lib/db";
import { useSession } from "@/store/session";
import type { Part, Bin, StockRow, StockMovement } from "@/lib/type";
import { uid } from "@/lib/utils";
import { queueMovement } from "@/lib/sync";

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant, user } = useSession();
  const [part, setPart] = useState<Part | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [qtyOut, setQtyOut] = useState(1);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const db = await getDB();
      const p: Part | undefined = await db.get("parts", id);
      setPart(p ?? null);

      setBins(await db.getAllFromIndex("bins", "by_tenant", tenant.id));
      const raw = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
      setStock(raw);
    })();
  }, [tenant, id]);

  const stockForPart = useMemo(() => stock.filter((s) => (s).partId === id), [stock, id]);
  const binById = useMemo(() => new Map(bins.map((b) => [b.id, b])), [bins]);

  const totalQty = stockForPart.reduce((a, s) => a + s.qty, 0);

  async function removeFromStock() {
    if (!tenant || !user || !part) return;

    // pick a bin with highest qty for OUT
    const source = [...stockForPart].sort((a, b) => b.qty - a.qty)[0];
    if (!source || source.qty <= 0) return;

    const remove = Math.min(qtyOut, source.qty);

    const db = await getDB();
    // update stock
    await db.put("stock", { ...source, qty: source.qty - remove });

    const movement: StockMovement = {
      id: uid("mv"),
      tenantId: tenant.id,
      createdAt: Date.now(),
      type: "OUT",
      partId: part.id,
      fromBinId: source.binId,
      qty: remove,
      createdBy: user.id,
      synced: false,
      syncedKey: 0
    };

    await queueMovement(movement);

    // refresh
    const raw = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
    setStock(raw);
  }

  if (!part) {
    return <div className="text-sm text-gray-600 dark:text-slate-400">Loading…</div>;
  }

  const critical = totalQty <= part.safetyStock;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-slate-400">{part.sku}</div>
            <h2 className="text-lg font-semibold">{part.description}</h2>
            <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Total Qty: <span className="font-medium">{totalQty}</span> · ROP{" "}
              <span className="font-medium">{part.rop}</span> · Safety{" "}
              <span className="font-medium">{part.safetyStock}</span>
            </div>
          </div>
          <div className={`text-xs rounded-full px-2 py-1 border ${critical ? "border-red-300 text-red-700" : "border-gray-200 text-gray-700"}`}>
            {critical ? "CRITICAL" : "OK"}
          </div>
        </div>

        {part.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={part.photoUrl} alt={part.description} className="mt-4 w-full max-h-64 object-cover rounded-2xl border border-gray-200 dark:border-slate-800" />
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Bin Locations</h3>
        <div className="mt-3 space-y-2">
          {stockForPart.map((s) => {
            const bin = binById.get(s.binId);
            return (
              <div key={s.binId} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-slate-800">
                <div className="text-sm">
                  <span className="font-medium">{bin?.warehouse}</span> / {bin?.code}
                </div>
                <div className="text-sm font-medium">{s.qty}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={qtyOut}
            onChange={(e) => setQtyOut(Number(e.target.value))}
            className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
          />
          <button
            onClick={removeFromStock}
            className="rounded-xl bg-gray-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Remove (Offline OUT)
          </button>
          <div className="text-xs text-gray-600 dark:text-slate-400">
            This creates a queued stock movement (sync later).
          </div>
        </div>
      </div>
    </div>
  );
}
