"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { ProductCatalogService } from "@/lib-stock";
import type { Product, ProductCategory } from "@/lib-stock";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CatalogListPage() {
  const router = useRouter();
  const { t } = useT();
  const { query } = usePageSearch();
  const { tenant, logout } = useSession();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadSeq, setReloadSeq] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!tenant) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const [productsData, categoriesData] = await Promise.all([
          ProductCatalogService.getProducts(),
          ProductCatalogService.getCategories(),
        ]);

        if (!mounted) return;
        setProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (err: any) {
        if (!mounted) return;
        if (err?.status === 401) {
          logout();
          router.replace("/");
          return;
        }
        setLoadError(t("app.catalogList.error.load"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [logout, reloadSeq, router, t, tenant]);

  const categoriesSorted = useMemo(
    () => [...categories].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [categories]
  );

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      if (category.id) map.set(category.id, category.name || "-");
    });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...products]
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .filter((product) => {
        if (selectedCategoryId && product.categoryId !== selectedCategoryId) return false;
        if (!normalizedQuery) return true;
        const categoryName = product.categoryId ? categoryNameById.get(product.categoryId) || "" : "";
        return [product.sku, product.name, product.description, product.categoryName, categoryName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [categoryNameById, products, query, selectedCategoryId]);

  const stockableCount = useMemo(
    () => products.filter((product) => product.stockable !== false).length,
    [products]
  );

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="ys-toolbar">
          <div>
            <h1 className="ys-page-title">{t("app.catalogList.title")}</h1>
            <p className="ys-page-subtitle">{t("app.catalogList.subtitle")}</p>
          </div>
          <div className="ys-toolbar-actions">
            <Link href="/app/catalog" className="ys-btn-primary">
              {t("app.catalogList.openMyCatalog")}
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="ys-card px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("app.catalogList.kpi.products")}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{products.length}</div>
          </div>
          <div className="ys-card px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("app.catalogList.kpi.categories")}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-blue-700 dark:text-blue-300">
              {categories.length}
            </div>
          </div>
          <div className="ys-card px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("app.catalogList.kpi.stockable")}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
              {stockableCount}
            </div>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="ys-alert-error flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button type="button" className="ys-btn-secondary" onClick={() => setReloadSeq((value) => value + 1)}>
            {t("app.catalogList.error.retry")}
          </button>
        </section>
      ) : null}

      {loading ? (
        <section className="ys-card p-5 text-sm text-muted-foreground">{t("app.catalogList.loading")}</section>
      ) : (
        <>
          <section className="ys-card p-5">
            <div className="ys-toolbar">
              <div>
                <div className="ys-section-title">{t("app.catalog.list.title")}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("app.catalog.list.count", { count: filteredProducts.length })}
                </p>
              </div>
              <div className="w-full max-w-xs">
                <label className="ys-filter-label">
                  {t("app.catalogList.filters.category")}
                  <select
                    className="ys-filter-control"
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                  >
                    <option value="">{t("app.catalogList.filters.allCategories")}</option>
                    {categoriesSorted.map((category) => (
                      <option key={category.id} value={category.id || ""}>
                        {category.name || category.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="ys-table-wrap">
            <table className="ys-table">
              <thead className="ys-table-head">
                <tr>
                  <th className="ys-table-cell">{t("app.catalog.table.image")}</th>
                  <th className="ys-table-cell">{t("app.catalog.table.sku")}</th>
                  <th className="ys-table-cell">{t("app.catalog.table.name")}</th>
                  <th className="ys-table-cell">{t("app.catalog.table.category")}</th>
                  <th className="ys-table-cell">{t("app.catalog.table.unit")}</th>
                  <th className="ys-table-cell">{t("app.catalog.table.minmax")}</th>
                  <th className="ys-table-cell">{t("app.catalog.table.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id || product.sku} className="ys-table-row">
                      <td className="ys-table-cell">
                        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
                          <ProductImage
                            product={product}
                            alt={product.name || product.sku || t("app.catalog.image.alt")}
                            className="h-full w-full object-cover"
                            fallback={<ProductImageFallback />}
                          />
                        </div>
                      </td>
                      <td className="ys-table-cell font-medium text-foreground">{product.sku || "-"}</td>
                      <td className="ys-table-cell">
                        <div className="font-medium text-foreground">{product.name || "-"}</div>
                        {product.description ? (
                          <div className="mt-1 text-xs text-muted-foreground">{product.description}</div>
                        ) : null}
                      </td>
                      <td className="ys-table-cell">
                        {product.categoryName ||
                          (product.categoryId ? categoryNameById.get(product.categoryId) || product.categoryId : "-")}
                      </td>
                      <td className="ys-table-cell">{product.unit || "-"}</td>
                      <td className="ys-table-cell">
                        {product.minStockLevel ?? "-"} / {product.maxStockLevel ?? "-"}
                      </td>
                      <td className="ys-table-cell">{formatDate(product.updatedAt || product.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="ys-table-cell text-center text-muted-foreground" colSpan={7}>
                      <div className="flex flex-col items-center gap-3 py-8">
                        <span>{t("app.catalogList.empty")}</span>
                        <Link href="/app/catalog" className="ys-btn-primary">
                          {t("app.catalogList.openMyCatalog")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
