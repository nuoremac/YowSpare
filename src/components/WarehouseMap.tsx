"use client";

import type { Bin } from "@/lib/type";

export default function WarehouseMap({ bins, onSelect }: { bins: Bin[]; onSelect: (binId: string) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-medium">Warehouse map (mock)</div>
      <p className="mt-1 text-xs text-gray-600">Click a bin. Coordinates are mocked (0..100).</p>

      <div className="mt-4 relative h-72 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        {bins.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className="absolute rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-100"
            style={{ left: `${b.x}%`, top: `${b.y}%`, transform: "translate(-50%, -50%)" }}
            title={`${b.warehouse} / ${b.code}`}
          >
            {b.code}
          </button>
        ))}
      </div>
    </div>
  );
}
