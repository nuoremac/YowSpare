"use client";

import { useEffect, useMemo, useState } from "react";
import { getDB } from "@/lib/db";
import { useSession } from "@/store/session";
import type { Part, Bin, StockRow } from "@/lib/type";
import PartCard from "@/components/PartCard";
import { usePageSearch } from "@/components/PageSearchContext";

export default function InventoryPage() {
  const { tenant } = useSession();
  const { query, setQuery } = usePageSearch();
  const [parts, setParts] = useState<Part[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const db = await getDB();
      setParts(await db.getAllFromIndex("parts", "by_tenant", tenant.id));
      setBins(await db.getAllFromIndex("bins", "by_tenant", tenant.id));
      const raw = await db.getAllFromIndex("stock", "by_tenant", tenant.id);
      setStock(raw);
    })();
  }, [tenant]);

  const binById = useMemo(() => new Map(bins.map((b) => [b.id, b])), [bins]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = parts.filter((p) =>
      !needle ? true : (p.sku.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle))
    );

    // Aggregate stock across bins (and show the “best” bin label as the max qty bin)
    return filtered.map((p) => {
      const st = stock.filter((s) => (s).partId === p.id);
      const total = st.reduce((a, s) => a + (s).qty, 0);
      const max = st.sort((a, b) => (b).qty - (a).qty)[0];
      const binLabel = max ? `${binById.get((max).binId)?.warehouse} / ${binById.get((max).binId)?.code}` : "—";
      return { part: p, totalQty: total, binLabel };
    });
  }, [parts, stock, query, binById]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Inventory (Offline)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Search by SKU or description. Data comes from local IndexedDB.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search… e.g. BRG-6205"
          className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rows.map((r) => (
          <PartCard key={r.part.id} part={r.part} qty={r.totalQty} binLabel={r.binLabel} />
        ))}
      </div>
    </div>
  );
}
