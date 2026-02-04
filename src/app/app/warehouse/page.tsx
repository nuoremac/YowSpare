"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/store/session";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib1";
import type { Product, StockLevel, StockMovement } from "@/lib1";
import { usePageSearch } from "@/components/PageSearchContext";

export default function WarehousePage() {
  const { tenant, activeAgencyId } = useSession();
  const { query } = usePageSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [productId, setProductId] = useState("");
  const [qtyIn, setQtyIn] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    (async () => {
      const [p, s, m] = await Promise.all([
        ProductCatalogService.getProducts(),
        StockLevelsService.getStockLevels(),
        StockMovementsService.getAllMovements(),
      ]);
      setProducts(p || []);
      setLevels(s || []);
      setMovements(m || []);
      setProductId(p?.[0]?.id || "");
      setLoading(false);
    })();
  }, [tenant]);

  const stockInAgency = useMemo(() => {
    const filtered = levels.filter((l) => !activeAgencyId || l.agencyId === activeAgencyId);
    const needle = query.trim().toLowerCase();
    if (!needle) return filtered;
    return filtered.filter((l) => {
      return (
        (l.productSku || "").toLowerCase().includes(needle) ||
        (l.productName || "").toLowerCase().includes(needle)
      );
    });
  }, [levels, activeAgencyId, query]);

  async function receive() {
    if (!activeAgencyId || !productId || qtyIn <= 0) return;
    setSaving(true);
    try {
      const draft = await StockMovementsService.createDraft({
        type: "IN",
        destinationAgencyId: activeAgencyId,
        items: [{ productId, quantity: qtyIn }],
        notes: "Warehouse receipt",
      });
      if (draft?.id) {
        await StockMovementsService.validateMovement(draft.id);
      }
      const refreshed = await StockLevelsService.getStockLevels();
      setLevels(refreshed || []);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Warehouse</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Receive stock and review live levels for the selected agency.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading warehouse…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Stock levels</h3>
            <div className="mt-3 space-y-2">
              {stockInAgency.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-slate-800">
                  <div className="text-sm">
                    <div className="font-medium">{s.productName || s.productSku || "—"}</div>
                    <div className="text-xs text-gray-600 dark:text-slate-400">{s.productSku}</div>
                  </div>
                  <div className="text-sm font-medium">{s.quantity ?? 0}</div>
                </div>
              ))}
              {!stockInAgency.length && (
                <div className="text-sm text-gray-600 dark:text-slate-400">No stock levels found.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold">Receive stock</h3>
            <label className="mt-4 block text-xs font-medium">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku || "SKU"} — {p.name || p.description || "Unnamed"}
                </option>
              ))}
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
              disabled={saving}
              className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {saving ? "Receiving…" : "Receive (IN)"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Recent movements</h3>
        <div className="mt-3 space-y-2">
          {movements.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-800">
              <div>
                <div className="font-medium">{m.reference || m.id}</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">{m.type} · {m.status}</div>
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-400">{m.date || m.validatedAt || "—"}</div>
            </div>
          ))}
          {!movements.length && <div className="text-sm text-gray-600 dark:text-slate-400">No movements yet.</div>}
        </div>
      </div>
    </div>
  );
}
