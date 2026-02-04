"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCatalogService, StockLevelsService } from "@/lib1";
import type { Product, StockLevel } from "@/lib1";
import { usePageSearch } from "@/components/PageSearchContext";

export default function ProcurementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { query } = usePageSearch();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [p, s] = await Promise.all([
        ProductCatalogService.getProducts(),
        StockLevelsService.getStockLevels(),
      ]);
      setProducts(p || []);
      setLevels(s || []);
      setLoading(false);
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

  const alerts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .map((p) => ({
        id: p.id,
        sku: p.sku || "—",
        name: p.name || p.description || "—",
        qty: qtyByProduct.get(p.id || "") || 0,
        min: p.minStockLevel ?? 0,
      }))
      .filter((row) => (typeof row.min === "number" ? row.qty <= row.min : false))
      .filter((row) =>
        !needle
          ? true
          : row.sku.toLowerCase().includes(needle) ||
            row.name.toLowerCase().includes(needle)
      );
  }, [products, qtyByProduct, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Procurement</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Supplier and PO flows are not available in the API yet. This view shows low-stock alerts.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600 dark:text-slate-400">Loading alerts…</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold">Reorder alerts</h3>
          <div className="mt-3 space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
                <div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">{a.sku}</div>
                  <div className="font-medium">{a.name}</div>
                </div>
                <div className="text-sm font-semibold">Qty {a.qty}</div>
              </div>
            ))}
            {!alerts.length && <div className="text-sm text-gray-600 dark:text-slate-400">No alerts.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
