"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage, { ProductImageFallback, rememberProductImageFileId } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { FilesService } from "@/lib";
import { ProductCatalogService } from "@/lib-stock";
import type { Product, ProductCategory, ProductRequest } from "@/lib-stock";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { MAX_IMAGE_UPLOAD_BYTES, imageFileUrl, isImageFile } from "@/lib/imageFiles";

type ProductForm = {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  unit: string;
  costPrice: string;
  minStock: string;
  maxStock: string;
  stockable: boolean;
  perishable: boolean;
};

type CategoryForm = {
  name: string;
  description: string;
  parentId: string;
};

type Toast = { id: number; message: string; type: "success" | "error" };

const INITIAL_PRODUCT_FORM: ProductForm = {
  sku: "",
  name: "",
  description: "",
  categoryId: "",
  unit: "",
  costPrice: "",
  minStock: "",
  maxStock: "",
  stockable: true,
  perishable: false,
};

const INITIAL_CATEGORY_FORM: CategoryForm = {
  name: "",
  description: "",
  parentId: "",
};

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CatalogPage() {
  const router = useRouter();
  const { t } = useT();
  const { query } = usePageSearch();
  const { tenant, user, logout, currency, roles } = useSession();
  const canManageCatalog =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "products:write");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadSeq, setReloadSeq] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [productForm, setProductForm] = useState<ProductForm>(INITIAL_PRODUCT_FORM);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(INITIAL_CATEGORY_FORM);
  const [productSaving, setProductSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [uploadingProductImageId, setUploadingProductImageId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [stockLevelError, setStockLevelError] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const updateProduct = async (id: string, payload: ProductRequest) => {
    await ProductCatalogService.updateProduct(id, payload);
  };

  const deleteProduct = async (id: string) => {
    await ProductCatalogService.deleteProduct(id);
  };

  const resetProductForm = () => {
    setProductForm(INITIAL_PRODUCT_FORM);
    setEditingProductId(null);
    setStockLevelError("");
  };

  const editProduct = (product: Product) => {
    if (!canManageCatalog) return;
    setEditingProductId(product.id || null);
    setProductForm({
      sku: product.sku || "",
      name: product.name || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      unit: product.unit || "",
      costPrice: product.defaultCostPrice != null ? String(product.defaultCostPrice) : "",
      minStock: product.minStockLevel != null ? String(product.minStockLevel) : "",
      maxStock: product.maxStockLevel != null ? String(product.maxStockLevel) : "",
      stockable: product.stockable !== false,
      perishable: product.perishable === true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetCategoryForm = () => {
    setCategoryForm(INITIAL_CATEGORY_FORM);
    setEditingCategoryId(null);
  };

  const editCategory = (category: ProductCategory) => {
    if (!canManageCatalog || !category.id) return;
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      parentId: category.parentId || "",
    });
  };

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
        setLoadError(t("app.catalog.error.load"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [logout, reloadSeq, router, t, tenant]);

  const categoriesSorted = useMemo(() => {
    return [...categories].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [categories]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      if (category.id) map.set(category.id, category.name || "—");
    }
    return map;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoriesSorted;
    return categoriesSorted.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [categoriesSorted, categorySearch]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
    if (!normalizedQuery) return sorted;
    return sorted.filter((product) => {
      const categoryName = product.categoryId ? categoryNameById.get(product.categoryId) || "" : "";
      return [product.sku, product.name, product.description, product.categoryName, categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [categoryNameById, products, query]);

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageCatalog) return;

    const sku = productForm.sku.trim();
    const name = productForm.name.trim();
    if (!sku || !name) {
      showToast(t("app.catalog.form.required"), "error");
      return;
    }

    const isIntegerOrEmpty = (val: string) => val.trim() === "" || /^\d+$/.test(val.trim());
    if (!isIntegerOrEmpty(productForm.minStock) || !isIntegerOrEmpty(productForm.maxStock)) {
      setStockLevelError("Min stock and Max stock must be whole numbers.");
      return;
    }
    setStockLevelError("");

    const payload: ProductRequest = {
      sku,
      name,
      description: productForm.description.trim() || undefined,
      categoryId: productForm.categoryId || undefined,
      unit: productForm.unit.trim() || undefined,
      defaultCostPrice: toOptionalNumber(productForm.costPrice),
      minStockLevel: toOptionalNumber(productForm.minStock),
      maxStockLevel: toOptionalNumber(productForm.maxStock),
      stockable: productForm.stockable,
      perishable: productForm.perishable,
    };

    setProductSaving(true);
    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        showToast(t("app.catalog.form.updated"));
      } else {
        await ProductCatalogService.createProduct(payload);
        showToast(t("app.catalog.form.created"));
      }
      resetProductForm();
      setReloadSeq((prev) => prev + 1);
    } catch (error: any) {
      if (error?.message === "UNSUPPORTED_MUTATION") {
        showToast(t("app.catalog.actions.unsupported"), "error");
      } else {
        const apiMsg =
          typeof error?.body === "string"
            ? error.body
            : error?.body?.message || error?.body?.error || "";
        const base = editingProductId ? t("app.catalog.form.updateFailed") : t("app.catalog.form.failed");
        showToast(apiMsg ? `${base}: ${apiMsg}` : base, "error");
      }
    } finally {
      setProductSaving(false);
    }
  };

  const handleCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageCatalog) return;

    const name = categoryForm.name.trim();
    if (!name) {
      showToast(t("app.catalog.category.required"), "error");
      return;
    }

    setCategorySaving(true);
    try {
      const payload = {
        name,
        description: categoryForm.description.trim() || undefined,
        parentId: categoryForm.parentId || undefined,
      };
      if (editingCategoryId) {
        await ProductCatalogService.updateCategory(editingCategoryId, payload);
        showToast(t("app.catalog.category.updated"));
      } else {
        await ProductCatalogService.createCategory(payload);
        showToast(t("app.catalog.category.created"));
      }
      resetCategoryForm();
      setReloadSeq((prev) => prev + 1);
    } catch (error: any) {
      const apiMessage = error?.body?.message || error?.message;
      const fallback = editingCategoryId
        ? t("app.catalog.category.updateFailed")
        : t("app.catalog.category.failed");
      showToast(apiMessage && apiMessage !== "Failed" ? apiMessage : fallback, "error");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!canManageCatalog) return;
    if (!product.id) return;
    const label = product.name || product.sku || "item";
    const confirmed = window.confirm(t("app.catalog.actions.deleteConfirm", { name: label }));
    if (!confirmed) return;

    setDeletingProductId(product.id);
    try {
      await deleteProduct(product.id);
      showToast(t("app.catalog.actions.deleted"));
      if (editingProductId === product.id) {
        resetProductForm();
      }
      setReloadSeq((prev) => prev + 1);
    } catch (error: any) {
      if (error?.message === "UNSUPPORTED_MUTATION") {
        showToast(t("app.catalog.actions.unsupported"), "error");
      } else {
        showToast(t("app.catalog.actions.deleteFailed"), "error");
      }
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleDeleteCategory = async (category: ProductCategory) => {
    if (!canManageCatalog) return;
    if (!category.id) return;
    const confirmed = window.confirm(
      t("app.catalog.category.deleteConfirm", { name: category.name || "" }),
    );
    if (!confirmed) return;
    setDeletingCategoryId(category.id);
    try {
      await ProductCatalogService.deleteCategory(category.id);
      showToast(t("app.catalog.category.deleted"));
      if (editingCategoryId === category.id) resetCategoryForm();
      setReloadSeq((prev) => prev + 1);
    } catch (error: any) {
      const apiMessage = error?.body?.message || error?.message;
      showToast(
        apiMessage && apiMessage !== "Failed"
          ? apiMessage
          : t("app.catalog.category.deleteFailed"),
        "error",
      );
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleProductImageUpload = async (product: Product, file: File | null | undefined) => {
    if (!canManageCatalog || !product.id || !file) return;
    if (!isImageFile(file)) {
      showToast(t("app.catalog.image.invalid"), "error");
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      showToast(t("app.catalog.image.tooLarge"), "error");
      return;
    }

    setUploadingProductImageId(product.id);
    try {
      const storedFile = await FilesService.uploadFile({ file });
      if (!storedFile.id) throw new Error("Missing uploaded file id.");
      rememberProductImageFileId(product.id, storedFile.id);
      const position = (product.mediaAssets?.length || 0) + 1;
      const mediaAsset = await ProductCatalogService.createMediaAsset({
        targetType: "PRODUCT",
        targetId: product.id,
        fileId: storedFile.id,
        mimeType: file.type || storedFile.contentType || "image/*",
        position,
        altText: product.name || product.sku || "Product image",
      });
      const nextImageUrl = imageFileUrl(storedFile.id);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                imageFileId: storedFile.id,
                imageUrl: nextImageUrl,
                mediaAssets: [
                  ...(item.mediaAssets || []),
                  { ...mediaAsset, fileId: storedFile.id, imageUrl: nextImageUrl },
                ],
              }
            : item,
        ),
      );
      showToast(t("app.catalog.image.updated"));
    } catch (error: any) {
      const apiMsg = error?.body?.message || error?.message;
      showToast(apiMsg && apiMsg !== "Failed" ? apiMsg : t("app.catalog.image.failed"), "error");
    } finally {
      setUploadingProductImageId(null);
    }
  };

  return (
    <div className="ys-page">
      {/* Toast overlay */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-fade-in items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>

      <section className="ys-page-header">
        <h1 className="ys-page-title">{t("app.catalog.title")}</h1>
        <p className="ys-page-subtitle">{t("app.catalog.subtitle")}</p>
      </section>

      {loadError ? (
        <div className="ys-alert-error flex flex-wrap items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => setReloadSeq((prev) => prev + 1)}
            className="ys-btn-secondary h-9 px-3"
          >
            {t("app.catalog.error.retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="ys-card p-5 text-sm text-muted-foreground">{t("app.catalog.loading")}</div>
      ) : (
        <>
          {canManageCatalog ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            {/* Product form */}
            <section className="ys-card p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">{t("app.catalog.form.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("app.catalog.form.subtitle")}</p>
              </div>
              <form className="space-y-4" onSubmit={handleCreateProduct}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.sku")}</span>
                    <input
                      value={productForm.sku}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
                      className="ys-input"
                      placeholder="BRG-6205"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.name")}</span>
                    <input
                      value={productForm.name}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="ys-input"
                    />
                  </label>
                </div>

                <label className="space-y-1.5">
                  <span className="ys-filter-label">{t("app.catalog.form.description")}</span>
                  <textarea
                    value={productForm.description}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="ys-input min-h-24"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.category")}</span>
                    <select
                      value={productForm.categoryId}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                      className="ys-input"
                    >
                      <option value="">{t("app.catalog.form.category.placeholder")}</option>
                      {categoriesSorted.map((category) => (
                        <option key={category.id || category.name} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.unit")}</span>
                    <input
                      value={productForm.unit}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, unit: event.target.value }))}
                      className="ys-input"
                      placeholder="pcs"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.min")}</span>
                    <input
                      value={productForm.minStock}
                      onChange={(event) => {
                        setProductForm((prev) => ({ ...prev, minStock: event.target.value }));
                        setStockLevelError("");
                      }}
                      className={`ys-input${stockLevelError && productForm.minStock && !/^\d+$/.test(productForm.minStock.trim()) ? " border-rose-400 focus:ring-rose-300" : ""}`}
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </label>
                </div>

                {stockLevelError && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {stockLevelError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.max")}</span>
                    <input
                      value={productForm.maxStock}
                      onChange={(event) => {
                        setProductForm((prev) => ({ ...prev, maxStock: event.target.value }));
                        setStockLevelError("");
                      }}
                      className={`ys-input${stockLevelError && productForm.maxStock && !/^\d+$/.test(productForm.maxStock.trim()) ? " border-rose-400 focus:ring-rose-300" : ""}`}
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="ys-filter-label">{t("app.catalog.form.costPrice")}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={productForm.costPrice}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, costPrice: event.target.value }))}
                        className="ys-input"
                        inputMode="decimal"
                      />
                      <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {currency}
                      </span>
                    </div>
                  </label>
                  <div className="flex flex-col justify-end gap-2 pb-1 text-sm text-foreground">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.stockable}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, stockable: event.target.checked }))}
                      />
                      <span>{t("app.catalog.form.stockable")}</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.perishable}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, perishable: event.target.checked }))}
                      />
                      <span>{t("app.catalog.form.perishable")}</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-wrap justify-end gap-2">
                    {editingProductId ? (
                      <button
                        type="button"
                        className="ys-btn-secondary"
                        onClick={resetProductForm}
                        disabled={productSaving}
                      >
                        {t("app.catalog.form.cancelEdit")}
                      </button>
                    ) : null}
                    <button type="submit" className="ys-btn-primary" disabled={productSaving}>
                      {productSaving
                        ? editingProductId
                          ? t("app.catalog.form.updating")
                          : t("app.catalog.form.submitting")
                        : editingProductId
                        ? t("app.catalog.form.update")
                        : t("app.catalog.form.submit")}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Category panel */}
            <section className="ys-card p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">{t("app.catalog.category.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("app.catalog.category.subtitle")}</p>
              </div>

              <form className="space-y-4" onSubmit={handleCreateCategory}>
                <label className="space-y-1.5">
                  <span className="ys-filter-label">{t("app.catalog.category.name")}</span>
                  <input
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="ys-input"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="ys-filter-label">{t("app.catalog.category.description")}</span>
                  <textarea
                    value={categoryForm.description}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="ys-input min-h-20"
                  />
                </label>
                <div className="flex gap-2">
                  {editingCategoryId ? (
                    <button
                      type="button"
                      className="ys-btn-secondary flex-1"
                      onClick={resetCategoryForm}
                      disabled={categorySaving}
                    >
                      {t("app.catalog.form.cancelEdit")}
                    </button>
                  ) : null}
                  <button type="submit" className="ys-btn-primary flex-1" disabled={categorySaving}>
                    {categorySaving
                      ? editingCategoryId
                        ? t("app.catalog.category.updating")
                        : t("app.catalog.category.submitting")
                      : editingCategoryId
                        ? t("app.catalog.category.update")
                        : t("app.catalog.category.submit")}
                  </button>
                </div>
              </form>

              {/* Category list — compact tags with search */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {categoriesSorted.length === 0
                      ? t("app.catalog.category.empty")
                      : `${categoriesSorted.length} ${categoriesSorted.length === 1 ? "category" : "categories"}`}
                  </span>
                </div>

                {categoriesSorted.length > 0 && (
                  <>
                    {categoriesSorted.length > 6 && (
                      <div className="relative mb-2">
                        <svg
                          viewBox="0 0 24 24"
                          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="M16.5 16.5l3 3" strokeLinecap="round" />
                        </svg>
                        <input
                          type="search"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search categories…"
                          className="ys-input pl-8 text-xs"
                        />
                      </div>
                    )}

                    <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-0.5">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <span
                            key={category.id || category.name}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted py-1 pl-2.5 pr-1 text-xs font-medium text-foreground"
                          >
                            <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 7h.01M3 3h8l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11V3z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {category.name}
                            <button
                              type="button"
                              onClick={() => editCategory(category)}
                              className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                              aria-label={t("app.catalog.category.edit")}
                              title={t("app.catalog.category.edit")}
                            >
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={deletingCategoryId === category.id}
                              onClick={() => void handleDeleteCategory(category)}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                              aria-label={t("app.catalog.category.delete")}
                              title={t("app.catalog.category.delete")}
                            >
                              {deletingCategoryId === category.id ? (
                                <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" strokeLinecap="round" />
                                </svg>
                              )}
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No match for &ldquo;{categorySearch}&rdquo;</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
          ) : null}

          {/* Products table */}
          <section className="ys-card p-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("app.catalog.list.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("app.catalog.list.count", { count: filteredProducts.length })}
                </p>
              </div>
            </div>
            <div className="ys-table-wrap">
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
                    {canManageCatalog ? (
                      <th className="ys-table-cell">{t("app.catalog.table.actions")}</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id || `${product.sku}-${product.name}`} className="ys-table-row">
                        <td className="ys-table-cell">
                          <div className="flex items-center gap-2">
                            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
                              <ProductImage
                                product={product}
                                alt={product.name || product.sku || t("app.catalog.image.alt")}
                                className="h-full w-full object-cover"
                                fallback={<ProductImageFallback />}
                              />
                            </div>
                            {canManageCatalog ? (
                              <label
                                className={`ys-icon-btn-edit ${
                                  uploadingProductImageId === product.id || !product.id
                                    ? "cursor-not-allowed opacity-60"
                                    : "cursor-pointer"
                                }`}
                                aria-label={t("app.catalog.image.upload")}
                                title={t("app.catalog.image.upload")}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  disabled={uploadingProductImageId === product.id || !product.id}
                                  onChange={(event) => {
                                    const input = event.currentTarget;
                                    const file = input.files?.[0];
                                    void handleProductImageUpload(product, file);
                                    input.value = "";
                                  }}
                                />
                                <svg
                                  viewBox="0 0 24 24"
                                  className="ys-btn-icon"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" strokeLinecap="round" strokeLinejoin="round" />
                                  <circle cx="12" cy="13.5" r="3" />
                                </svg>
                              </label>
                            ) : null}
                          </div>
                        </td>
                        <td className="ys-table-cell font-medium text-foreground">{product.sku || "—"}</td>
                        <td className="ys-table-cell">{product.name || "—"}</td>
                        <td className="ys-table-cell">
                          {product.categoryName ||
                            (product.categoryId ? categoryNameById.get(product.categoryId) : "") ||
                            "—"}
                        </td>
                        <td className="ys-table-cell">{product.unit || "—"}</td>
                        <td className="ys-table-cell">
                          {product.minStockLevel ?? "—"} / {product.maxStockLevel ?? "—"}
                        </td>
                        <td className="ys-table-cell">{formatDate(product.updatedAt || product.createdAt)}</td>
                        {canManageCatalog ? (
                        <td className="ys-table-cell">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="ys-icon-btn-edit"
                              onClick={() => editProduct(product)}
                              aria-label={t("app.catalog.actions.edit")}
                              title={t("app.catalog.actions.edit")}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="ys-btn-icon"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="ys-icon-btn-delete"
                              onClick={() => void handleDeleteProduct(product)}
                              disabled={deletingProductId === product.id}
                              aria-label={t("app.catalog.actions.delete")}
                              title={t("app.catalog.actions.delete")}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="ys-btn-icon"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canManageCatalog ? 8 : 7} className="ys-table-cell py-8 text-center text-sm text-muted-foreground">
                        {t("app.catalog.list.empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
