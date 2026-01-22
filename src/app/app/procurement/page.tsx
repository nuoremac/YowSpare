"use client";

import { useEffect, useMemo, useState } from "react";
import { getDB } from "@/lib/db";
import { useSession } from "@/store/session";
import type { Part, StockRow,CatalogRow, Supplier, PurchaseOrder } from "@/lib/type";
import { uid } from "@/lib/utils";
import { nowMs } from "@/lib/time";
import { usePageSearch } from "@/components/PageSearchContext";


export default function ProcurementPage() {
  const { tenant, role } = useSession();
  const [parts, setParts] = useState<Part[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const { query } = usePageSearch();

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const db = await getDB();
      setParts(await db.getAllFromIndex("parts", "by_tenant", tenant.id));
      const rawStock = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
      setStock(rawStock);
      setSuppliers(await db.getAllFromIndex("suppliers", "by_tenant", tenant.id));
      const rawCatalog = await db.getAllFromIndex("catalog", "by_tenant", tenant.id);
      setCatalog(rawCatalog);
      setPos(await db.getAllFromIndex("pos", "by_tenant", tenant.id));
    })();
  }, [tenant]);

  const qtyByPart = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stock ) map.set(s.partId, (map.get(s.partId) || 0) + s.qty);
    return map;
  }, [stock]);

  const alerts = useMemo(() => {
    return parts
      .map((p) => ({ part: p, qty: qtyByPart.get(p.id) || 0 }))
      .filter((x) => x.qty <= x.part.safetyStock || x.qty <= x.part.rop)
      .sort((a, b) => (a.qty - b.qty));
  }, [parts, qtyByPart]);

  const comparisons = useMemo(() => {
    if (!selectedPartId) return [];
    const rows = (catalog )
      .filter((c) => c.partId === selectedPartId)
      .map((c) => ({
        ...c,
        supplier: suppliers.find((s) => s.id === c.supplierId),
      }))
      .sort((a, b) => a.avgLeadTimeDays - b.avgLeadTimeDays);
    return rows;
  }, [selectedPartId, catalog, suppliers]);

  const needle = query.trim().toLowerCase();

  const filteredAlerts = useMemo(() => {
    if (!needle) return alerts;
    return alerts.filter(({ part }) =>
      part.sku.toLowerCase().includes(needle) ||
      part.description.toLowerCase().includes(needle)
    );
  }, [alerts, needle]);

  const filteredComparisons = useMemo(() => {
    if (!needle) return comparisons;
    return comparisons.filter((c) =>
      (c.supplier?.name || "").toLowerCase().includes(needle) ||
      c.availability.toLowerCase().includes(needle)
    );
  }, [comparisons, needle]);

  const filteredPos = useMemo(() => {
    if (!needle) return pos;
    return pos.filter((po) => {
      const part = parts.find((p) => p.id === po.partId);
      const sup = suppliers.find((s) => s.id === po.supplierId);
      return (
        po.id.toLowerCase().includes(needle) ||
        (part?.sku || "").toLowerCase().includes(needle) ||
        (part?.description || "").toLowerCase().includes(needle) ||
        (sup?.name || "").toLowerCase().includes(needle) ||
        po.status.toLowerCase().includes(needle)
      );
    });
  }, [pos, parts, suppliers, needle]);

  async function createPO(supplierId: string) {
    if (!tenant || !selectedPartId) return;
    const part = parts.find((p) => p.id === selectedPartId)!;
    const currentQty = qtyByPart.get(part.id) || 0;
    const suggested = Math.max(part.rop + part.safetyStock - currentQty, 1);

    const po: PurchaseOrder = {
      id: uid("po"),
      tenantId: tenant.id,
      createdAt: nowMs(),
      partId: part.id,
      qty: suggested,
      supplierId,
      status: "SENT"
    };

    const db = await getDB();
    await db.put("pos", po);
    setPos(await db.getAllFromIndex("pos", "by_tenant", tenant.id));
  }

  async function vendorRespond(poId: string) {
    if (!tenant) return;
    const db = await getDB();
    const po = await db.get("pos", poId);
    if (!po) return;

    // respond with catalog values (mock)
    const cat = (catalog ).find((c) => c.partId === po.partId && c.supplierId === po.supplierId);
    const updated: PurchaseOrder = {
      ...po,
      status: "RESPONDED",
      vendorResponse: {
        unitPrice: cat?.unitPrice ?? 0,
        leadTimeDays: cat?.avgLeadTimeDays ?? 0,
        message: "Confirmed (mock).",
        respondedAt: nowMs()
      }
    };
    await db.put("pos", updated);
    setPos(await db.getAllFromIndex("pos", "by_tenant", tenant.id));
  }

  const selectedPart = parts.find((p) => p.id === selectedPartId);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Procurement</h2>
        <p className="mt-1 text-sm text-gray-600">
          Alerts + supplier comparison + one-click PO (all mocked, offline).
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">Reorder Alerts</h3>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {filteredAlerts.map(({ part, qty }) => (
            <button
              key={part.id}
              onClick={() => setSelectedPartId(part.id)}
              className={`text-left rounded-xl border px-3 py-2 ${
                selectedPartId === part.id ? "border-gray-900" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">{part.sku}</div>
                  <div className="font-medium">{part.description}</div>
                </div>
                <div className="text-sm font-semibold">Qty {qty}</div>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                ROP {part.rop} · Safety {part.safetyStock}
              </div>
            </button>
          ))}
          {!filteredAlerts.length && (
            <div className="text-sm text-gray-600">No alerts.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">Supplier Comparison</h3>
        <p className="mt-1 text-sm text-gray-600">
          {selectedPart ? (
            <>For <span className="font-medium">{selectedPart.sku}</span></>
          ) : (
            <>Select a part from alerts.</>
          )}
        </p>

        {selectedPart && (
          <div className="mt-4 overflow-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Supplier</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Lead time</th>
                  <th className="text-left p-2">Availability</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredComparisons.map((c) => (
                  <tr key={`${c.supplierId}-${c.partId}`} className="border-t">
                    <td className="p-2">{c.supplier?.name}</td>
                    <td className="p-2">{c.unitPrice}</td>
                    <td className="p-2">{c.avgLeadTimeDays} days</td>
                    <td className="p-2">{c.availability}</td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => createPO(c.supplierId)}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-white"
                      >
                        Create PO
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredComparisons.length && (
                  <tr><td className="p-2 text-gray-600" colSpan={5}>No suppliers for this part.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">Purchase Orders</h3>
        <p className="mt-1 text-sm text-gray-600">
          {role === "SUPPLIER" ? "Vendor view: respond to orders." : "Procurement view: sent orders."}
        </p>

        <div className="mt-3 space-y-2">
          {filteredPos.map((po) => {
            const part = parts.find((p) => p.id === po.partId);
            const sup = suppliers.find((s) => s.id === po.supplierId);
            return (
              <div key={po.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">{po.id}</div>
                    <div className="font-medium">
                      {part?.sku} · Qty {po.qty} · {sup?.name}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">Status: {po.status}</div>
                    {po.vendorResponse && (
                      <div className="mt-2 text-xs text-gray-700">
                        Response: {po.vendorResponse.unitPrice} · {po.vendorResponse.leadTimeDays} days · {po.vendorResponse.message}
                      </div>
                    )}
                  </div>

                  {role === "SUPPLIER" && po.status === "SENT" && (
                    <button
                      onClick={() => vendorRespond(po.id)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5"
                    >
                      Respond
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!filteredPos.length && <div className="text-sm text-gray-600">No POs yet.</div>}
        </div>
      </div>
    </div>
  );
}
