"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import FileImage from "@/components/FileImage";
import { ProductCatalogService } from "@/lib-stock";
import type { Product } from "@/lib-stock";

type ProductImageProps = {
  product?: Product | null;
  productId?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

const mediaFileCache = new Map<string, string>();
const mediaPromiseCache = new Map<string, Promise<string>>();

export function ProductImageFallback({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m6 17 4-4 3 3 2-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const firstImageFileId = (product?: Product | null) => {
  if (product?.imageFileId) return product.imageFileId;
  const asset = (product?.mediaAssets || [])
    .slice()
    .reverse()
    .find(
      (item) =>
        !!item.fileId &&
        (!item.mimeType || item.mimeType.toLowerCase().startsWith("image/")),
    );
  return asset?.fileId || "";
};

const loadProductImageFileId = (productId: string) => {
  const cached = mediaFileCache.get(productId);
  if (cached !== undefined) return Promise.resolve(cached);

  const existingPromise = mediaPromiseCache.get(productId);
  if (existingPromise) return existingPromise;

  const promise = ProductCatalogService.getMediaAssets("PRODUCT", productId)
    .then((assets) => {
      const asset = (assets || [])
        .slice()
        .reverse()
        .find(
          (item) =>
            !!item.fileId &&
            (!item.mimeType || item.mimeType.toLowerCase().startsWith("image/")),
        );
      const fileId = asset?.fileId || "";
      mediaFileCache.set(productId, fileId);
      return fileId;
    })
    .catch(() => {
      mediaFileCache.set(productId, "");
      return "";
    })
    .finally(() => {
      mediaPromiseCache.delete(productId);
    });

  mediaPromiseCache.set(productId, promise);
  return promise;
};

export const rememberProductImageFileId = (productId: string, fileId: string) => {
  if (!productId) return;
  mediaFileCache.set(productId, fileId);
};

export default function ProductImage({
  alt,
  className,
  fallback,
  product,
  productId,
}: ProductImageProps) {
  const resolvedProductId = product?.id || productId || "";
  const initialFileId = useMemo(() => firstImageFileId(product), [product]);
  const [fileId, setFileId] = useState(initialFileId);

  useEffect(() => {
    let mounted = true;
    setFileId(initialFileId);
    if (initialFileId || !resolvedProductId) {
      return () => {
        mounted = false;
      };
    }

    void loadProductImageFileId(resolvedProductId).then((nextFileId) => {
      if (mounted) setFileId(nextFileId);
    });

    return () => {
      mounted = false;
    };
  }, [initialFileId, resolvedProductId]);

  return (
    <FileImage
      fileId={fileId}
      src={product?.imageUrl}
      alt={alt || product?.name || product?.sku || "Product image"}
      className={className}
      fallback={fallback ?? <ProductImageFallback />}
    />
  );
}
