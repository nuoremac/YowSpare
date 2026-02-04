"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/store/session";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib1";
import type { Product, StockLevel } from "@/lib1";

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant, activeAgencyId } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [qtyOut, setQtyOut] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      setLoading(true);
      const [p, s] = await Promise.all([
        ProductCatalogService.getProduct(id),
        StockLevelsService.getStockLevels(),
      ]);
      setProduct(p ?? null);
      setLevels(s || []);
      setLoading(false);
    })();
  }, [tenant, id]);

  const stockForPart = useMemo(() => levels.filter((s) => s.productId === id), [levels, id]);

  const totalQty = stockForPart.reduce((a, s) => a + (s.quantity || 0), 0);

  async function removeFromStock() {
    if (!tenant || !product || !activeAgencyId) return;
    const source = [...stockForPart].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0];
    if (!source || (source.quantity || 0) <= 0) return;
    const remove = Math.min(qtyOut, source.quantity || 0);
    setMutating(true);
    try {
      const draft = await StockMovementsService.createDraft({
        type: "OUT",
        sourceAgencyId: activeAgencyId,
        items: [{ productId: product.id, quantity: remove }],
        notes: "Manual stock removal",
      });
      if (draft?.id) {
        await StockMovementsService.validateMovement(draft.id);
      }
      const refreshed = await StockLevelsService.getStockLevels();
      setLevels(refreshed || []);
    } finally {
      setMutating(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600 dark:text-slate-400">Loading…</div>;
  }

  if (!product) {
    return <div className="text-sm text-gray-600 dark:text-slate-400">Loading…</div>;
  }

  const critical = totalQty <= (product.minStockLevel || 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-slate-400">{product.sku}</div>
            <h2 className="text-lg font-semibold">{product.name || product.description}</h2>
            <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Total Qty: <span className="font-medium">{totalQty}</span> · ROP{" "}
              <span className="font-medium">{product.maxStockLevel ?? "—"}</span> · Min{" "}
              <span className="font-medium">{product.minStockLevel ?? "—"}</span>
            </div>
          </div>
          <div className={`text-xs rounded-full px-2 py-1 border ${critical ? "border-red-300 text-red-700" : "border-gray-200 text-gray-700"}`}>
            {critical ? "CRITICAL" : "OK"}
          </div>
        </div>

      </div>

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Stock by Agency</h3>
        <div className="mt-3 space-y-2">
          {stockForPart.map((s) => {
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-slate-800">
                <div className="text-sm">
                  <span className="font-medium">Agency</span> / {s.agencyId || "—"}
                </div>
                <div className="text-sm font-medium">{s.quantity ?? 0}</div>
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
            disabled={mutating}
            className="rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {mutating ? "Updating…" : "Remove (OUT)"}
          </button>
          <div className="text-xs text-gray-600 dark:text-slate-400">
            This posts a stock movement to the API.
          </div>
        </div>
      </div>
    </div>
  );
}
