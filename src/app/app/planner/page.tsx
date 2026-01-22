"use client";

import { useEffect, useMemo, useState } from "react";
import { getDB } from "@/lib/db";
import { useSession } from "@/store/session";
import type { Part, StockRow } from "@/lib/type";
import { usePageSearch } from "@/components/PageSearchContext";

export default function PlannerPage() {
  const { tenant } = useSession();
  const [parts, setParts] = useState<Part[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [minQty, setMinQty] = useState(0);
  const { query } = usePageSearch();

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const db = await getDB();
      setParts(await db.getAllFromIndex("parts", "by_tenant", tenant.id));
      const raw = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
      setStock(raw );
    })();
  }, [tenant]);

  const qtyByPart = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stock ) map.set(s.partId, (map.get(s.partId) || 0) + s.qty);
    return map;
  }, [stock]);

  const report = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return parts
      .map((p) => ({
        sku: p.sku,
        description: p.description,
        qty: qtyByPart.get(p.id) || 0,
        rop: p.rop,
        safety: p.safetyStock,
        critical: (qtyByPart.get(p.id) || 0) <= p.safetyStock
      }))
      .filter((r) => r.qty >= minQty)
      .filter((r) =>
        !needle
          ? true
          : r.sku.toLowerCase().includes(needle) ||
            r.description.toLowerCase().includes(needle)
      )
      .sort((a, b) => a.qty - b.qty);
  }, [parts, qtyByPart, minQty, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Planner (Offline Analytics)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Local dataset analysis. Replace this with DuckDB-Wasm if you want full SQL.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="text-sm">Min Qty</div>
          <input
            type="number"
            value={minQty}
            onChange={(e) => setMinQty(Number(e.target.value))}
            className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Qty</th>
              <th className="text-left p-2">ROP</th>
              <th className="text-left p-2">Safety</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.sku} className="border-t">
                <td className="p-2">{r.sku}</td>
                <td className="p-2">{r.description}</td>
                <td className="p-2 font-medium">{r.qty}</td>
                <td className="p-2">{r.rop}</td>
                <td className="p-2">{r.safety}</td>
                <td className="p-2">{r.critical ? "CRITICAL" : "OK"}</td>
              </tr>
            ))}
            {!report.length && (
              <tr><td className="p-3 text-gray-600" colSpan={6}>No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
