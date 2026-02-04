import Link from "next/link";
import type { Product } from "@/lib1";

export default function PartCard({ product, qty, binLabel }: { product: Product; qty: number; binLabel: string }) {
  return (
    <Link
      href={`/app/inventory/${product.id}`}
      className="block rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-slate-400">{product.sku || "—"}</div>
          <div className="font-medium">{product.name || product.description || "Unnamed product"}</div>
          <div className="mt-2 text-xs text-gray-600 dark:text-slate-400">
            Bin: <span className="font-medium">{binLabel}</span> · Qty:{" "}
            <span className="font-medium">{qty}</span>
          </div>
        </div>
        <div className="text-xs rounded-full px-2 py-1 border border-gray-200 dark:border-slate-700 dark:text-slate-200">
          Min {product.minStockLevel ?? "—"}
        </div>
      </div>
    </Link>
  );
}
