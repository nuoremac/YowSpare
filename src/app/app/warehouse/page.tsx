"use client";

import { useEffect, useMemo, useState } from "react";
import { getDB } from "@/lib/db";
import { useSession } from "@/store/session";
import type { Bin, Part, StockRow, StockMovement } from "@/lib/type";
import WarehouseMap from "@/components/WarehouseMap";
import { uid } from "@/lib/utils";
import { queueMovement } from "@/lib/sync";
import { usePageSearch } from "@/components/PageSearchContext";

export default function WarehousePage() {
  const { tenant, user } = useSession();
  const [bins, setBins] = useState<Bin[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [selectedBinId, setSelectedBinId] = useState<string>("");
  const [sku, setSku] = useState("FLT-10UM");
  const [qtyIn, setQtyIn] = useState(1);
  const { query } = usePageSearch();

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const db = await getDB();
      setBins(await db.getAllFromIndex("bins", "by_tenant", tenant.id));
      setParts(await db.getAllFromIndex("parts", "by_tenant", tenant.id));
      const raw = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
      setStock(raw);
      setSelectedBinId("b_A2");
    })();
  }, [tenant]);

  const stockInBin = useMemo(() => {
    if (!selectedBinId) return [];
    return stock.filter((s) => s.binId === selectedBinId);
  }, [stock, selectedBinId]);

  const filteredStockInBin = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return stockInBin;
    return stockInBin.filter((s) => {
      const part = parts.find((p) => p.id === s.partId);
      return (
        (part?.sku || "").toLowerCase().includes(needle) ||
        (part?.description || "").toLowerCase().includes(needle)
      );
    });
  }, [stockInBin, parts, query]);

  const selectedBin = bins.find((b) => b.id === selectedBinId);
  const partBySku = parts.find((p) => p.sku === sku);

  async function receive() {
    if (!tenant || !user || !selectedBinId || !partBySku) return;

    const db = await getDB();
    const raw = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
    const current = (raw ).find((s) => s.partId === partBySku.id && s.binId === selectedBinId);

    if (current) await db.put("stock", { ...current, qty: current.qty + qtyIn });
    else {
      const newRow: StockRow = {
      key: `${tenant.id}::${partBySku.id}::${selectedBinId}`,
      tenantId: tenant.id,
      partId: partBySku.id,
      binId: selectedBinId,
      qty: qtyIn,
   };
  await db.add("stock", newRow);
}


    const movement: StockMovement = {
      id: uid("mv"),
      tenantId: tenant.id,
      createdAt: Date.now(),
      type: "IN",
      partId: partBySku.id,
      toBinId: selectedBinId,
      qty: qtyIn,
      createdBy: user.id,
      synced: false,
      syncedKey: 0
    };
    await queueMovement(movement);

    const updated = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
    setStock(updated);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Warehouse</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Bin map + stock movements (IN). Works offline; queues movements for sync.
        </p>
      </div>

      <WarehouseMap bins={bins} onSelect={setSelectedBinId} />

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Selected bin</h3>
        <div className="mt-1 text-sm text-gray-700 dark:text-slate-300">
          {selectedBin ? `${selectedBin.warehouse} / ${selectedBin.code}` : "—"}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 rounded-xl border border-gray-200 p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-sm font-medium">Stock in bin</div>
            <div className="mt-2 space-y-2">
              {filteredStockInBin.map((s) => {
                const part = parts.find((p) => p.id === s.partId);
                return (
                  <div key={`${s.partId}-${s.binId}`} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-slate-800">
                    <div className="text-sm">{part?.sku} — {part?.description}</div>
                    <div className="text-sm font-medium">{s.qty}</div>
                  </div>
                );
              })}
              {!filteredStockInBin.length && <div className="text-sm text-gray-600 dark:text-slate-400">Empty.</div>}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-sm font-medium">Receive (mock scan)</div>
            <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
              In a real app, QR scan fills SKU + bin automatically.
            </p>

            <label className="mt-3 block text-xs font-medium">SKU</label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {parts.map((p) => <option key={p.id} value={p.sku}>{p.sku}</option>)}
            </select>

            <label className="mt-3 block text-xs font-medium">Qty</label>
            <input
              type="number"
              min={1}
              value={qtyIn}
              onChange={(e) => setQtyIn(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            />

            <button
              onClick={receive}
              className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Receive (IN)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
