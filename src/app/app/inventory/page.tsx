"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/store/session";
import PartCard from "@/components/PartCard";
import { usePageSearch } from "@/components/PageSearchContext";
import { ProductCatalogService, StockLevelsService } from "@/lib1";
import type { Product, StockLevel } from "@/lib1";

export default function InventoryPage() {
  const { tenant } = useSession();
  const { query, setQuery } = usePageSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const [p, s] = await Promise.all([
        ProductCatalogService.getProducts(),
        StockLevelsService.getStockLevels(),
      ]);
      setProducts(p || []);
      setLevels(s || []);
      setLoading(false);
    })();
  }, [tenant]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = products.filter((p) =>
      !needle
        ? true
        : (p.sku || "").toLowerCase().includes(needle) ||
          (p.name || "").toLowerCase().includes(needle) ||
          (p.description || "").toLowerCase().includes(needle)
    );

    return filtered.map((p) => {
      const st = levels.filter((s) => s.productId === p.id);
      const total = st.reduce((a, s) => a + (s.quantity || 0), 0);
      const max = [...st].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0];
      const binLabel = max?.agencyId ? `Agency ${max.agencyId}` : "—";
      return { product: p, totalQty: total, binLabel };
    });
  }, [products, levels, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Search by SKU or description. Data comes from the live catalog and stock levels.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search… e.g. BRG-6205"
          className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-slate-700"
        />
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading inventory…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rows.map((r) => (
            <PartCard key={r.product.id} product={r.product} qty={r.totalQty} binLabel={r.binLabel} />
          ))}
        </div>
      )}
    </div>
  );
}
