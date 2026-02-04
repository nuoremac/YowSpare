"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCatalogService, StockLevelsService } from "@/lib1";
import type { Product, StockLevel } from "@/lib1";
import { usePageSearch } from "@/components/PageSearchContext";

export default function PlannerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [minQty, setMinQty] = useState(0);
  const { query } = usePageSearch();

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([
        ProductCatalogService.getProducts(),
        StockLevelsService.getStockLevels(),
      ]);
      setProducts(p || []);
      setLevels(s || []);
    })();
  }, []);

  const qtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of levels) {
      const key = s.productId || "";
      map.set(key, (map.get(key) || 0) + (s.quantity || 0));
    }
    return map;
  }, [levels]);

  const report = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .map((p) => {
        const qty = qtyByProduct.get(p.id || "") || 0;
        const min = p.minStockLevel ?? 0;
        return {
          id: p.id,
          sku: p.sku || "—",
          description: p.description || p.name || "—",
          qty,
          min,
          critical: typeof p.minStockLevel === "number" ? qty <= p.minStockLevel : false,
        };
      })
      .filter((r) => r.qty >= minQty)
      .filter((r) =>
        !needle
          ? true
          : r.sku.toLowerCase().includes(needle) ||
            r.description.toLowerCase().includes(needle)
      )
      .sort((a, b) => a.qty - b.qty);
  }, [products, qtyByProduct, minQty, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Planner</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Live reorder analysis using product catalog and stock levels.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="text-sm">Min Qty</div>
          <input
            type="number"
            value={minQty}
            onChange={(e) => setMinQty(Number(e.target.value))}
            className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Qty</th>
              <th className="text-left p-2">Min</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.sku}</td>
                <td className="p-2">{r.description}</td>
                <td className="p-2 font-medium">{r.qty}</td>
                <td className="p-2">{r.min}</td>
                <td className="p-2">{r.critical ? "CRITICAL" : "OK"}</td>
              </tr>
            ))}
            {!report.length && (
              <tr><td className="p-3 text-gray-600 dark:text-slate-400" colSpan={5}>No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
