import Link from "next/link";
import type { Part } from "@/lib/type";

export default function PartCard({ part, qty, binLabel }: { part: Part; qty: number; binLabel: string }) {
  return (
    <Link
      href={`/app/inventory/${part.id}`}
      className="block rounded-2xl border border-gray-200 p-4 hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">{part.sku}</div>
          <div className="font-medium">{part.description}</div>
          <div className="mt-2 text-xs text-gray-600">
            Bin: <span className="font-medium">{binLabel}</span> · Qty:{" "}
            <span className="font-medium">{qty}</span>
          </div>
        </div>
        <div className="text-xs rounded-full px-2 py-1 border border-gray-200">
          ROP {part.rop}
        </div>
      </div>
    </Link>
  );
}
