"use client";

import Link from "next/link";
import type { Product } from "@/lib-stock";
import { useT } from "@/components/i18n/useT";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";

export default function PartCard({ product, qty, binLabel }: { product: Product; qty: number; binLabel: string }) {
  const { t } = useT();

  return (
    <Link
      href={`/app/inventory/${product.id}`}
      className="block rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
            <ProductImage
              product={product}
              alt={product.name || product.sku || t("app.catalog.image.alt")}
              className="h-full w-full object-cover"
              fallback={<ProductImageFallback />}
            />
          </div>
          <div className="min-w-0">
          <div className="text-sm text-gray-500 dark:text-slate-400">{product.sku || "—"}</div>
          <div className="font-medium">
            {product.name || product.description || t("app.inventory.unnamed")}
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-slate-400">
            {t("app.inventory.bin")}: <span className="font-medium">{binLabel}</span> ·{" "}
            {t("app.inventory.qty")}:{" "}
            <span className="font-medium">{qty}</span>
          </div>
        </div>
        </div>
        <div className="text-xs rounded-full px-2 py-1 border border-gray-200 dark:border-slate-700 dark:text-slate-200">
          {t("app.inventory.min")} {product.minStockLevel ?? "—"}
        </div>
      </div>
    </Link>
  );
}
