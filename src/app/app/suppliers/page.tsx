"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { hasOrganizationAccess } from "@/lib/accessControl";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { EmployeesRolesService } from "@/lib";
import type { OrganizationMember } from "@/lib";
import { ProductCatalogService } from "@/lib-stock";
import type { Product, ProductCategory } from "@/lib-stock";
import { SuppliersService } from "@/yowyob-tiers/appServices";
import type { Supplier, SupplierProduct } from "@/yowyob-tiers/appServices";
import MovableModal from "@/components/MovableModal";
import ExportMenu from "@/components/ExportMenu";
import { downloadCsv, printTablePdf } from "@/lib/exportFiles";

type SupplierStatus = "ACTIVE" | "INACTIVE";

type Toast = { tone: "success" | "error"; message: string };

type LeadTimeFilter = "ALL" | "UNKNOWN" | "0_7" | "8_14" | "15_30" | "31_PLUS";

type SupplierForm = {
 name: string;
 status: SupplierStatus;
 email: string;
 phone: string;
 address: string;
 notes: string;
};

const EMPTY_FORM: SupplierForm = {
 name: "",
 status: "ACTIVE",
 email: "",
 phone: "",
 address: "",
 notes: "",
};

function formatMoney(value: number, currency = "XAF") {
 return new Intl.NumberFormat(undefined, {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
 }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
 if (!value) return "—";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function finiteNumber(value: number | undefined) {
 return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function Modal({
 open,
 title,
 children,
 onClose,
}: {
 open: boolean;
 title: string;
 children: React.ReactNode;
 onClose: () => void;
}) {
 return (
 <MovableModal open={open} title={title} onClose={onClose} initialWidth={1120} initialHeight={680}>
 <div className="mt-4">{children}</div>
 </MovableModal>
 );
}

function Drawer({
 open,
 title,
 children,
 onClose,
}: {
 open: boolean;
 title: string;
 children: React.ReactNode;
 onClose: () => void;
}) {
 if (!open) return null;
 return (
 <div className="fixed inset-0 z-50">
 <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
 <div className="ys-drawer-panel max-w-2xl">
 <div className="flex items-start justify-between gap-4">
 <div className="ys-section-title">{title}</div>
 <button
 type="button"
 onClick={onClose}
 className="ys-icon-btn"
 aria-label="Close"
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 <div className="mt-4">{children}</div>
 </div>
 </div>
 );
}

function normalizeStatus(status?: string | null): SupplierStatus {
 const s = String(status || "").trim().toUpperCase();
 return s === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

const COVERAGE_UNCATEGORIZED = "__UNCATEGORIZED__";

function toLeadTimeBucket(values: number[]): LeadTimeFilter {
 if (!values.length) return "UNKNOWN";
 const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
 if (avg <= 7) return "0_7";
 if (avg <= 14) return "8_14";
 if (avg <= 30) return "15_30";
 return "31_PLUS";
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
 const results = new Array<R>(items.length);
 let nextIndex = 0;

 const workers = Array.from({ length: Math.max(1, limit) }, async () => {
 while (true) {
 const idx = nextIndex++;
 if (idx >= items.length) return;
 results[idx] = await fn(items[idx]);
 }
 });

 await Promise.all(workers);
 return results;
}

export default function SuppliersPage() {
 const { t } = useT();
 const { tenant, user, roles: sessionRoles, currency } = useSession();
 const { query, setQuery } = usePageSearch();

 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState("");
 const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
 const [reloadSeq, setReloadSeq] = useState(0);

 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [statusFilter, setStatusFilter] = useState<"ALL" | SupplierStatus>("ALL");
 const [categoryCoverage, setCategoryCoverage] = useState<string>("ALL");
 const [leadTime, setLeadTime] = useState<LeadTimeFilter>("ALL");

 const [orgMember, setOrgMember] = useState<OrganizationMember | null>(null);

 const [detailsId, setDetailsId] = useState<string | null>(null);
 const [detailsOpen, setDetailsOpen] = useState(false);
 const [isEditing, setIsEditing] = useState(false);
 const [editBusy, setEditBusy] = useState(false);
 const [deleteBusy, setDeleteBusy] = useState(false);

 const [createOpen, setCreateOpen] = useState(false);
 const [createBusy, setCreateBusy] = useState(false);
 const [createForm, setCreateForm] = useState<SupplierForm>(EMPTY_FORM);
 const [editForm, setEditForm] = useState<SupplierForm>(EMPTY_FORM);

 const [products, setProducts] = useState<Product[]>([]);
 const [categories, setCategories] = useState<ProductCategory[]>([]);

 const [supplierLinksLoading, setSupplierLinksLoading] = useState(false);
 const [supplierLinksError, setSupplierLinksError] = useState("");
 const [supplierLinksIndex, setSupplierLinksIndex] = useState<Record<string, SupplierProduct[]>>({});

 const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
 const [supplierProductsLoading, setSupplierProductsLoading] = useState(false);
 const [supplierProductsError, setSupplierProductsError] = useState("");

 const [linkBusy, setLinkBusy] = useState(false);
 const [linkForm, setLinkForm] = useState<{
 productId: string;
 leadTimeDays: string;
 moq: string;
 preferred: boolean;
 unitPrice: string;
 }>({ productId: "", leadTimeDays: "", moq: "", preferred: true, unitPrice: "" });
 const [productSearch, setProductSearch] = useState("");
 const [productDropdownOpen, setProductDropdownOpen] = useState(false);
 const productSearchRef = useRef<HTMLDivElement>(null);

 const toastTimeoutRef = useRef<number | null>(null);
 const [toast, setToast] = useState<Toast | null>(null);
 const showToast = (tone: Toast["tone"], message: string) => {
 setToast({ tone, message });
 if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
 toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2500);
 };

 useEffect(() => {
 return () => {
 if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
 };
 }, []);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 setLoading(true);
 setLoadError("");
 try {
 const list = await SuppliersService.list();
 if (!mounted) return;
 setSuppliers(list || []);
 setLastSyncedAt(new Date().toISOString());
 } catch (err: unknown) {
 if (!mounted) return;
 setLoadError(t("app.suppliers.error.load"));
 console.error(err);
 } finally {
 if (mounted) setLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [reloadSeq, t, tenant]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 try {
 const [pRes, cRes] = await Promise.allSettled([
 ProductCatalogService.getProducts(),
 ProductCatalogService.getCategories(),
 ]);
 if (!mounted) return;
 setProducts(pRes.status === "fulfilled" ? (pRes.value || []) : []);
 setCategories(cRes.status === "fulfilled" ? (cRes.value || []) : []);
 } catch (err) {
 if (!mounted) return;
 setProducts([]);
 setCategories([]);
 console.error(err);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [tenant]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!user?.id && !user?.email) return;
 try {
 const list = await EmployeesRolesService.getEmployees();
 if (!mounted) return;
 const meMember = (list || []).find(
 (m) =>
 (!!user?.id && m.userId === user.id) ||
 (!!user?.email && !!m.userEmail && m.userEmail.toLowerCase() === user.email.toLowerCase())
 );
 setOrgMember(meMember || null);
 } catch {
 setOrgMember(null);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [user?.email, user?.id]);

 const canManage = hasOrganizationAccess(
 {
 authorities: sessionRoles,
 memberRole: orgMember?.roleName,
 organization: tenant,
 user,
 },
 ["third-parties:write"],
 );

 const productById = useMemo(() => {
 const map = new Map<string, Product>();
 (products || []).forEach((p) => {
 if (p?.id) map.set(p.id, p);
 });
 return map;
 }, [products]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 if (!suppliers.length) {
 setSupplierLinksIndex({});
 setSupplierLinksError("");
 setSupplierLinksLoading(false);
 return;
 }

 setSupplierLinksLoading(true);
 setSupplierLinksError("");
 try {
 const ids = suppliers.map((s) => s.id).filter(Boolean);
 const lists = await mapWithConcurrency(ids, 6, async (supplierId) => {
 try {
 const rows = await SuppliersService.listSupplierProducts(supplierId);
 return { supplierId, rows: rows || [] };
 } catch (err) {
 // Keep the directory usable even if one supplier link request fails.
 console.error(err);
 return { supplierId, rows: [] as SupplierProduct[] };
 }
 });

 if (!mounted) return;
 const index: Record<string, SupplierProduct[]> = {};
 lists.forEach((item) => {
 index[item.supplierId] = item.rows;
 });
 setSupplierLinksIndex(index);
 } catch (err) {
 if (!mounted) return;
 setSupplierLinksError(t("app.suppliers.products.error"));
 setSupplierLinksIndex({});
 console.error(err);
 } finally {
 if (mounted) setSupplierLinksLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [suppliers, t, tenant]);

 const filtered = useMemo(() => {
 const needle = query.trim().toLowerCase();
 return (suppliers || [])
 .filter((s) => (statusFilter === "ALL" ? true : normalizeStatus(s.status) === statusFilter))
 .filter((s) => {
 if (categoryCoverage === "ALL") return true;
 const links = supplierLinksIndex[s.id] || [];
 if (!links.length) return false;

 if (categoryCoverage === COVERAGE_UNCATEGORIZED) {
 return links.some((row) => {
 const p = row.productId ? productById.get(row.productId) : null;
 return !String(p?.categoryId || "").trim();
 });
 }

 return links.some((row) => {
 const p = row.productId ? productById.get(row.productId) : null;
 return String(p?.categoryId || "").trim() === categoryCoverage;
 });
 })
 .filter((s) => {
 if (leadTime === "ALL") return true;
 const links = supplierLinksIndex[s.id] || [];
 const leadTimes = links
 .map((row) => row.leadTimeDays)
 .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
 const bucket = toLeadTimeBucket(leadTimes);
 return leadTime === bucket;
 })
 .filter((s) => {
 if (!needle) return true;
 const hay = [s.name || "", s.email || "", s.phone || "", s.address || "", s.notes || ""].join(" ").toLowerCase();
 return hay.includes(needle);
 })
 .slice()
 .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
 }, [categoryCoverage, leadTime, productById, query, statusFilter, supplierLinksIndex, suppliers]);

 const details = useMemo(() => {
 if (!detailsId) return null;
 return suppliers.find((s) => s.id === detailsId) || null;
 }, [detailsId, suppliers]);

 const categoryLabelById = useMemo(() => {
 const map = new Map<string, string>();
 (categories || []).forEach((c) => {
 if (!c?.id) return;
 map.set(c.id, c.name || c.description || c.id);
 });
 (products || []).forEach((p) => {
 if (!p?.categoryId) return;
 if (!map.has(p.categoryId) && p.categoryName) map.set(p.categoryId, p.categoryName);
 });
 return map;
 }, [categories, products]);

 const coverageOptions = useMemo(() => {
 const covered = new Map<string, string>();
 let hasUncategorized = false;

 Object.values(supplierLinksIndex).forEach((links) => {
 (links || []).forEach((row) => {
 const p = row.productId ? productById.get(row.productId) : null;
 const catId = String(p?.categoryId || "").trim();
 if (!catId) {
 hasUncategorized = true;
 return;
 }
 const label = categoryLabelById.get(catId) || catId;
 covered.set(catId, label);
 });
 });

 const list = [...covered.entries()]
 .map(([id, label]) => ({ id, label }))
 .sort((a, b) => a.label.localeCompare(b.label));

 return { list, hasUncategorized };
 }, [categoryLabelById, productById, supplierLinksIndex]);

 const filteredProductOptions = useMemo(() => {
  const q = productSearch.trim().toLowerCase();
  const all = products.filter((p) =>
   !q ||
   (p.sku || "").toLowerCase().includes(q) ||
   (p.name || "").toLowerCase().includes(q) ||
   (p.description || "").toLowerCase().includes(q)
  );
  return all.slice(0, 30);
 }, [products, productSearch]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!detailsOpen || !detailsId) return;
 setSupplierProductsLoading(true);
 setSupplierProductsError("");
 try {
 const sp = await SuppliersService.listSupplierProducts(detailsId);
 if (!mounted) return;
 setSupplierProducts(sp || []);
 setSupplierLinksIndex((prev) => ({ ...prev, [detailsId]: sp || [] }));
 } catch (err: unknown) {
 if (!mounted) return;
 setSupplierProductsError(t("app.suppliers.products.error"));
 console.error(err);
 } finally {
 if (mounted) setSupplierProductsLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [detailsId, detailsOpen, t]);

 useEffect(() => {
 setIsEditing(false);
 setEditBusy(false);
 setDeleteBusy(false);
 setSupplierProducts([]);
 setSupplierProductsError("");
 setLinkBusy(false);
 setLinkForm({ productId: "", leadTimeDays: "", moq: "", preferred: true, unitPrice: "" });
 setProductSearch("");
 setProductDropdownOpen(false);
 }, [detailsId]);

 useEffect(() => {
  const handler = (e: MouseEvent) => {
   if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
    setProductDropdownOpen(false);
   }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
 }, []);

 const openDetails = (id: string) => {
 setDetailsId(id);
 setDetailsOpen(true);
 setIsEditing(false);
 };

 const startCreate = () => {
 if (!canManage) {
 showToast("error", t("app.suppliers.forbidden.manage"));
 return;
 }
 setCreateForm(EMPTY_FORM);
 setCreateOpen(true);
 };

 const createSupplier = async () => {
 if (!canManage) return;
 const name = createForm.name.trim();
 if (!name) {
 showToast("error", t("app.suppliers.form.required"));
 return;
 }
 setCreateBusy(true);
 try {
 const created = await SuppliersService.create({
 name,
 status: createForm.status,
 email: createForm.email.trim() || undefined,
 phone: createForm.phone.trim() || undefined,
 address: createForm.address.trim() || undefined,
 notes: createForm.notes.trim() || undefined,
 });
 setSuppliers((prev) => [created, ...(prev || [])]);
 setSupplierLinksIndex((prev) => ({ ...prev, [created.id]: [] }));
 setCreateOpen(false);
 showToast("success", t("app.suppliers.toast.created"));
 } catch (err: unknown) {
 showToast("error", t("app.suppliers.toast.failed"));
 console.error(err);
 } finally {
 setCreateBusy(false);
 }
 };

 const startEdit = () => {
 if (!details) return;
 if (!canManage) {
 showToast("error", t("app.suppliers.forbidden.manage"));
 return;
 }
 setEditForm({
 name: details.name || "",
 status: normalizeStatus(details.status),
 email: details.email || "",
 phone: details.phone || "",
 address: details.address || "",
 notes: details.notes || "",
 });
 setIsEditing(true);
 };

 const saveEdit = async () => {
 if (!details) return;
 const name = editForm.name.trim();
 if (!name) {
 showToast("error", t("app.suppliers.form.required"));
 return;
 }
 setEditBusy(true);
 try {
 const saved = await SuppliersService.upsert(details.id, {
 name,
 status: editForm.status,
 email: editForm.email.trim() || undefined,
 phone: editForm.phone.trim() || undefined,
 address: editForm.address.trim() || undefined,
 notes: editForm.notes.trim() || undefined,
 });
 setSuppliers((prev) => (prev || []).map((s) => (s.id === details.id ? saved : s)));
 setIsEditing(false);
 showToast("success", t("app.suppliers.toast.saved"));
 } catch (err: unknown) {
 showToast("error", t("app.suppliers.toast.failed"));
 console.error(err);
 } finally {
 setEditBusy(false);
 }
 };

 const deleteSupplier = async () => {
 if (!details) return;
 if (!canManage) return;
 const ok = window.confirm(t("app.suppliers.confirm.delete"));
 if (!ok) return;
 setDeleteBusy(true);
 try {
 await SuppliersService.delete(details.id);
 setSuppliers((prev) => (prev || []).filter((s) => s.id !== details.id));
 setSupplierLinksIndex((prev) => {
 const next = { ...prev };
 delete next[details.id];
 return next;
 });
 setDetailsOpen(false);
 setDetailsId(null);
 showToast("success", t("app.suppliers.toast.deleted"));
 } catch (err: unknown) {
 showToast("error", t("app.suppliers.toast.failed"));
 console.error(err);
 } finally {
 setDeleteBusy(false);
 }
 };

 const exportSuppliers = (format: "csv" | "pdf") => {
 const headers = [
 t("app.suppliers.table.name"),
 t("app.suppliers.table.status"),
 t("app.suppliers.table.emailPhone"),
 t("app.suppliers.field.address"),
 t("app.suppliers.table.notes"),
 t("app.suppliers.table.lastActivity"),
 ];
 const rows = filtered.map((s) => [
 s.name || "",
 normalizeStatus(s.status),
 [s.email || "", s.phone || ""].filter(Boolean).join(" / "),
 s.address || "",
 s.notes || "",
 s.updatedAt ? formatDate(s.updatedAt) : "",
 ]);
 if (format === "csv") {
 downloadCsv(`yowspare-suppliers-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
 showToast("success", t("app.suppliers.toast.exported"));
 return;
 }
 printTablePdf({
 title: t("app.suppliers.directory.title"),
 headers,
 rows,
 });
 showToast("success", t("app.suppliers.toast.exported"));
 };

 const submitLink = async () => {
 if (!details || !canManage) return;
 const productId = linkForm.productId.trim();
 if (!productId) {
 showToast("error", t("app.suppliers.products.form.required"));
 return;
 }

 const leadTimeDays = linkForm.leadTimeDays.trim() ? Number.parseInt(linkForm.leadTimeDays.trim(), 10) : undefined;
 const moq = linkForm.moq.trim() ? Number.parseInt(linkForm.moq.trim(), 10) : undefined;
 const unitPrice = linkForm.unitPrice.trim() ? Number.parseFloat(linkForm.unitPrice.trim()) : undefined;

 setLinkBusy(true);
 try {
 const saved = await SuppliersService.upsertSupplierProduct(details.id, productId, {
 leadTimeDays: finiteNumber(leadTimeDays),
 moq: finiteNumber(moq),
 preferred: linkForm.preferred,
 unitPrice: finiteNumber(unitPrice),
 });
 const applyUpdate = (prev: SupplierProduct[]) => {
 const next = [...(prev || [])];
 const idx = next.findIndex((p) => p.productId === saved.productId);
 if (idx >= 0) next[idx] = saved;
 else next.unshift(saved);
 return next;
 };
 setSupplierProducts(applyUpdate);
 setSupplierLinksIndex((prev) => ({ ...prev, [details.id]: applyUpdate(prev[details.id] || []) }));
 showToast("success", t("app.suppliers.products.toast.saved"));
 } catch (err: unknown) {
 showToast("error", t("app.suppliers.toast.failed"));
 console.error(err);
 } finally {
 setLinkBusy(false);
 }
 };

 const startEditLink = (row: SupplierProduct) => {
 const p = productById.get(row.productId);
 setProductSearch(p ? `${p.sku || "—"} — ${p.name || p.description || "—"}` : row.productId);
 setProductDropdownOpen(false);
 setLinkForm({
  productId: row.productId,
  leadTimeDays: row.leadTimeDays == null ? "" : String(row.leadTimeDays),
  moq: row.moq == null ? "" : String(row.moq),
  preferred: row.preferred == null ? true : Boolean(row.preferred),
  unitPrice: row.unitPrice == null ? "" : String(row.unitPrice),
 });
 };

 const deleteLink = async (productId: string) => {
 if (!details || !canManage) return;
 const ok = window.confirm(t("app.suppliers.products.confirm.unlink"));
 if (!ok) return;
 try {
 await SuppliersService.deleteSupplierProduct(details.id, productId);
 setSupplierProducts((prev) => (prev || []).filter((p) => p.productId !== productId));
 setSupplierLinksIndex((prev) => ({
 ...prev,
 [details.id]: (prev[details.id] || []).filter((p) => p.productId !== productId),
 }));
 showToast("success", t("app.suppliers.products.toast.deleted"));
 } catch (err: unknown) {
 showToast("error", t("app.suppliers.toast.failed"));
 console.error(err);
 }
 };

 return (
 <main className="ys-page">
 <div className="ys-page-header">
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground ">
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
   <path d="M3 7h11v10H3z" strokeLinecap="round" />
   <path d="M14 10h4l3 3v4h-7v-7z" strokeLinecap="round" />
   <circle cx="7" cy="19" r="1.5" />
   <circle cx="18" cy="19" r="1.5" />
 </svg>
 </span>
 <h2 className="ys-page-title">{t("app.suppliers.title")}</h2>
 </div>
 <p className="ys-page-subtitle">{t("app.suppliers.subtitle")}</p>

 <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground ">
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground">{t("app.suppliers.context.tenant")}</span>
 <span className="font-semibold">{tenant?.name || tenant?.code || t("app.workspace.fallback")}</span>
 </span>
 {lastSyncedAt && (
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground">{t("app.suppliers.synced")}</span>
 <span className="font-semibold">{formatDate(lastSyncedAt)}</span>
 </span>
 )}
 </div>
 </div>

 {toast && (
 <div
 className={[
 "border px-4 py-3 text-sm",
 toast.tone === "success"
 ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100"
 : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100",
 ].join(" ")}
 >
 {toast.message}
 </div>
 )}

 {loadError && (
 <div className="ys-alert-error">
 {loadError}
 </div>
 )}

 <section className="ys-card p-4">
 <div className="ys-toolbar">
 <div className="ys-section-title">{t("app.suppliers.directory.title")}</div>
 <div className="ys-toolbar-actions">
 <button
 type="button"
 onClick={() => setReloadSeq((s) => s + 1)}
 className="ys-btn-secondary gap-2 text-xs"
 aria-label={t("app.suppliers.action.refresh")}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
   <path d="M4 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
   <path d="M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
   <path d="M4 9a8 8 0 0 1 14.93-4.36" strokeLinecap="round" />
   <path d="M20 15a8 8 0 0 1-14.93 4.36" strokeLinecap="round" />
 </svg>
 {t("app.suppliers.action.refresh")}
 </button>

 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportSuppliers("csv")}
 onPdf={() => exportSuppliers("pdf")}
 />

 <button
 type="button"
 onClick={startCreate}
 className={[
 "ys-btn-primary gap-2 text-xs",
 canManage ? "" : "cursor-not-allowed rounded-xl border border-border bg-muted text-muted-foreground opacity-70",
 ].join(" ")}
 aria-disabled={!canManage}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 5v14" strokeLinecap="round" />
 <path d="M5 12h14" strokeLinecap="round" />
 </svg>
 {t("app.suppliers.action.addLocal")}
 </button>
 </div>
 </div>

 <div className="ys-filter-grid mt-4">
 <label className="ys-filter-label md:col-span-2">
 {t("app.suppliers.search.label")}
 <input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder={t("app.suppliers.search.placeholder")}
 className="ys-filter-control"
 />
 </label>

 <label className="ys-filter-label">
 {t("app.suppliers.filters.status")}
 <select
 className="ys-filter-control"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as "ALL" | SupplierStatus)}
 >
 <option value="ALL">{t("app.suppliers.filter.all")}</option>
 <option value="ACTIVE">{t("app.suppliers.status.active")}</option>
 <option value="INACTIVE">{t("app.suppliers.status.inactive")}</option>
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.suppliers.filters.coverage")}
 <select
 className={[
 "ys-filter-control",
 supplierLinksLoading || supplierLinksError ? "text-muted-foreground" : "text-foreground",
 ].join(" ")}
 value={categoryCoverage}
 onChange={(e) => setCategoryCoverage(e.target.value)}
 disabled={supplierLinksLoading || !!supplierLinksError}
 >
 <option value="ALL">{t("app.suppliers.filter.all")}</option>
 {coverageOptions.hasUncategorized && (
 <option value={COVERAGE_UNCATEGORIZED}>{t("app.suppliers.coverage.uncategorized")}</option>
 )}
 {coverageOptions.list.map((opt) => (
 <option key={opt.id} value={opt.id}>
 {opt.label}
 </option>
 ))}
 </select>
 </label>
 </div>

 <div className="ys-filter-grid mt-3">
 <label className="ys-filter-label md:col-span-1">
 {t("app.suppliers.filters.leadTime")}
 <select
 className={[
 "ys-filter-control",
 supplierLinksLoading || supplierLinksError ? "text-muted-foreground" : "text-foreground",
 ].join(" ")}
 value={leadTime}
 onChange={(e) => setLeadTime(e.target.value as LeadTimeFilter)}
 disabled={supplierLinksLoading || !!supplierLinksError}
 >
 <option value="ALL">{t("app.suppliers.filter.all")}</option>
 <option value="UNKNOWN">{t("app.suppliers.leadTime.unknown")}</option>
 <option value="0_7">{t("app.suppliers.leadTime.0_7")}</option>
 <option value="8_14">{t("app.suppliers.leadTime.8_14")}</option>
 <option value="15_30">{t("app.suppliers.leadTime.15_30")}</option>
 <option value="31_PLUS">{t("app.suppliers.leadTime.31_plus")}</option>
 </select>
 </label>
 </div>

 {loading ? (
 <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
 ) : !filtered.length ? (
 <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-foreground">
 <div className="font-semibold">{t("app.suppliers.empty.title")}</div>
 <div className="mt-1 text-muted-foreground">{t("app.suppliers.empty.subtitle")}</div>
 </div>
 ) : (
 <div className="ys-table-wrap mt-4">
 <table className="ys-table min-w-[920px]">
 <thead className="ys-table-head bg-muted/30">
 <tr>
 <th className="ys-table-cell pl-4">{t("app.suppliers.table.name")}</th>
 <th className="ys-table-cell">{t("app.suppliers.table.emailPhone")}</th>
 <th className="ys-table-cell">{t("app.suppliers.field.address")}</th>
 <th className="ys-table-cell">{t("app.suppliers.table.notes")}</th>
 <th className="ys-table-cell">{t("app.suppliers.table.lastActivity")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card text-foreground">
 {filtered.map((s) => {
 const status = normalizeStatus(s.status);
 return (
 <tr
 key={s.id}
 className="ys-table-row cursor-pointer"
 onClick={() => openDetails(s.id)}
 >
 <td className="ys-table-cell pl-4">
 <div className="flex items-center gap-2">
 <div className="font-medium">{s.name || "—"}</div>
 <span
 className={[
 "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
 status === "ACTIVE"
 ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
 : "border-border bg-slate-50 text-foreground ",
 ].join(" ")}
 >
 {status === "ACTIVE" ? t("app.suppliers.status.active") : t("app.suppliers.status.inactive")}
 </span>
 </div>
 </td>
 <td className="ys-table-cell text-muted-foreground">
 {[s.email, s.phone].filter(Boolean).join(" / ") || "—"}
 </td>
 <td className="ys-table-cell text-muted-foreground">{s.address || "—"}</td>
 <td className="ys-table-cell text-muted-foreground">
 {s.notes ? (s.notes.length > 48 ? `${s.notes.slice(0, 48)}…` : s.notes) : "—"}
 </td>
 <td className="ys-table-cell text-muted-foreground">{s.updatedAt ? formatDate(s.updatedAt) : "—"}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <Drawer
 open={detailsOpen}
 title={t("app.suppliers.details.label")}
 onClose={() => {
 setDetailsOpen(false);
 setDetailsId(null);
 setIsEditing(false);
 }}
 >
 {!details ? (
 <div className="text-sm text-muted-foreground">{t("app.common.loading")}</div>
 ) : (
 <div className="space-y-4">
 <div className="ys-card p-4">
 <div className="flex items-start justify-between gap-3">
 <div>
 <div className="ys-section-title">
 {t("app.suppliers.details.profile")}
 </div>
 <div className="mt-1 text-lg font-semibold text-foreground ">{details.name || "—"}</div>
 <div className="mt-2">
  <span className={[
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
    normalizeStatus(details.status) === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      : "border-border bg-slate-50 text-foreground",
  ].join(" ")}>
    {normalizeStatus(details.status) === "ACTIVE" ? t("app.suppliers.status.active") : t("app.suppliers.status.inactive")}
  </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={isEditing ? saveEdit : startEdit}
 className={canManage ? "ys-icon-btn-edit h-10 w-10" : "ys-icon-btn h-10 w-10"}
 aria-label={isEditing ? t("app.suppliers.action.saveLocal") : t("app.suppliers.action.editLocal")}
 disabled={!canManage || editBusy || deleteBusy}
 >
 {isEditing ? (
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M5 12l4 4L19 6" strokeLinecap="round" />
 </svg>
 ) : (
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 )}
 </button>

 <button
 type="button"
 onClick={deleteSupplier}
 className={canManage ? "ys-icon-btn-delete h-10 w-10" : "ys-icon-btn h-10 w-10"}
 aria-label={t("app.suppliers.action.delete")}
 disabled={!canManage || deleteBusy || editBusy}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 10v8M15 10v8" strokeLinecap="round" />
 <path d="M9 7V5h6v2" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </div>

 {!isEditing ? (
 <ul className="mt-4 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.suppliers.field.email")}</span>
 <span className="font-medium">{details.email || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.suppliers.field.phone")}</span>
 <span className="font-medium">{details.phone || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.suppliers.field.address")}</span>
 <span className="font-medium">{details.address || "—"}</span>
 </li>
 <li className="flex items-start justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.suppliers.table.notes")}</span>
 <span className="max-w-[18rem] whitespace-pre-wrap text-right font-medium">{details.notes || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-6 py-2">
 <span className="text-muted-foreground">{t("app.suppliers.table.lastActivity")}</span>
 <span className="font-medium">{details.updatedAt ? formatDate(details.updatedAt) : "—"}</span>
 </li>
 </ul>
 ) : (
 <div className="mt-4 grid grid-cols-1 gap-3">
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.name")}
 <input
 value={editForm.name}
 onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.status")}
 <select
 value={editForm.status}
 onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as SupplierStatus }))}
 className="mt-1 ys-input"
 >
 <option value="ACTIVE">{t("app.suppliers.status.active")}</option>
 <option value="INACTIVE">{t("app.suppliers.status.inactive")}</option>
 </select>
 </label>

 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.email")}
 <input
 value={editForm.email}
 onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.phone")}
 <input
 value={editForm.phone}
 onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>
 </div>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.address")}
 <input
 value={editForm.address}
 onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.table.notes")}
 <textarea
 value={editForm.notes}
 onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
 className="mt-1 min-h-[110px] ys-input"
 />
 </label>
 </div>
 )}
 </div>

 <div className="ys-card p-4">
 <div className="ys-section-title">
 {t("app.suppliers.products.title")}
 </div>
 <div className="mt-1 text-sm text-muted-foreground">{t("app.suppliers.products.subtitle")}</div>

 {supplierProductsError && (
 <div className="mt-3 ys-alert-error">
 {supplierProductsError}
 </div>
 )}

 <div className="ys-table-wrap mt-3">
 <table className="ys-table min-w-[720px]">
 <thead className="ys-table-head bg-muted/30">
 <tr>
 <th className="ys-table-cell pl-4">{t("app.suppliers.products.table.product")}</th>
 <th className="ys-table-cell">{t("app.suppliers.products.table.leadTime")}</th>
 <th className="ys-table-cell">{t("app.suppliers.products.table.moq")}</th>
 <th className="ys-table-cell">{t("app.suppliers.products.table.preferred")}</th>
 <th className="ys-table-cell">{t("app.suppliers.products.table.price")}</th>
 <th className="ys-table-cell text-right">{t("app.suppliers.products.table.actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card text-foreground">
 {supplierProductsLoading ? (
 <tr>
 <td colSpan={6} className="ys-table-cell pl-4 py-6 text-sm text-muted-foreground">
 {t("app.common.loading")}
 </td>
 </tr>
 ) : supplierProducts.length ? (
 supplierProducts.map((row) => {
 const p = row.productId ? productById.get(row.productId) : null;
 const label = p ? `${p.sku || "—"} — ${p.name || p.description || "—"}` : row.productId;
 return (
 <tr key={row.id || row.productId}>
 <td className="ys-table-cell pl-4 font-medium">
 <div className="flex min-w-0 items-center gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={p}
 productId={row.productId}
 alt={label || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback />}
 />
 </div>
 <span className="truncate">{label}</span>
 </div>
 </td>
 <td className="ys-table-cell text-muted-foreground">{row.leadTimeDays ?? "—"}</td>
 <td className="ys-table-cell text-muted-foreground">{row.moq ?? "—"}</td>
 <td className="ys-table-cell text-muted-foreground">
 {row.preferred ? t("app.suppliers.products.preferred.yes") : t("app.suppliers.products.preferred.no")}
 </td>
 <td className="ys-table-cell text-muted-foreground">
				   {row.unitPrice != null ? formatMoney(row.unitPrice, currency) : "—"}
				 </td>
 <td className="ys-table-cell text-right">
 <div className="inline-flex items-center gap-2">
 <button
 type="button"
 onClick={() => startEditLink(row)}
 className="ys-icon-btn-edit"
 disabled={!canManage}
 aria-label={t("app.suppliers.products.action.edit")}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 20h4l11-11-4-4L4 16v4z" strokeLinecap="round" />
 <path d="M14 6l4 4" strokeLinecap="round" />
 </svg>
 </button>
 <button
 type="button"
 onClick={() => deleteLink(row.productId)}
 className="ys-icon-btn-delete"
 disabled={!canManage}
 aria-label={t("app.suppliers.products.action.delete")}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M6 7l1 14h10l1-14" strokeLinecap="round" />
 <path d="M9 10v8M15 10v8" strokeLinecap="round" />
 <path d="M9 7V5h6v2" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={6} className="ys-table-cell pl-4 py-6 text-sm text-muted-foreground">
 {t("app.suppliers.products.empty")}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="mt-4 ys-card p-4">
 <div className="ys-section-title">{t("app.suppliers.products.form.title")}</div>
 <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
 <div className="md:col-span-2">
				 <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("app.suppliers.products.form.product")}</div>
				 <div className="relative" ref={productSearchRef}>
				   <input
				     type="text"
				     value={productSearch}
				     onChange={(e) => {
				       setProductSearch(e.target.value);
				       setLinkForm((p) => ({ ...p, productId: "" }));
				       setProductDropdownOpen(true);
				     }}
				     onFocus={() => setProductDropdownOpen(true)}
				     placeholder={t("app.suppliers.products.form.selectProduct")}
				     className="ys-input w-full"
				     disabled={!canManage}
				     autoComplete="off"
				   />
				   {linkForm.productId && (
				     <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
				       <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l4 4L19 6" strokeLinecap="round"/></svg>
				     </span>
				   )}
				   {productDropdownOpen && filteredProductOptions.length > 0 && (
				     <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
				       {filteredProductOptions.map((p) => (
				         <li
				           key={p.id}
				           onMouseDown={(e) => {
				             e.preventDefault();
				             const label = `${p.sku || "—"} — ${p.name || p.description || "—"}`;
				             setProductSearch(label);
				             setLinkForm((prev) => ({ ...prev, productId: p.id || "" }));
				             setProductDropdownOpen(false);
				           }}
				           className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
				         >
				           <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
				             <ProductImage
				               product={p}
				               alt={p.name || p.sku || t("app.catalog.image.alt")}
				               className="h-full w-full object-cover"
				               fallback={<ProductImageFallback />}
				             />
				           </span>
				           <span className="min-w-0">
				           <span className="font-medium text-foreground">{p.sku || "—"}</span>
				           <span className="text-xs text-muted-foreground">{p.name || p.description || "—"}</span>
				           </span>
				         </li>
				       ))}
				     </ul>
				   )}
				   {productDropdownOpen && filteredProductOptions.length === 0 && productSearch.trim() !== "" && (
				     <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-lg">
				       {t("app.suppliers.products.form.noMatch")}
				     </div>
				   )}
				 </div>
				 </div>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.products.form.leadTime")}
 <input
 value={linkForm.leadTimeDays}
 onChange={(e) => setLinkForm((p) => ({ ...p, leadTimeDays: e.target.value }))}
 inputMode="numeric"
 className="mt-1 ys-input"
 disabled={!canManage}
 />
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.products.form.moq")}
 <input
 value={linkForm.moq}
 onChange={(e) => setLinkForm((p) => ({ ...p, moq: e.target.value }))}
 inputMode="numeric"
 className="mt-1 ys-input"
 disabled={!canManage}
 />
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.products.form.price")}
 <input
 value={linkForm.unitPrice}
 onChange={(e) => setLinkForm((p) => ({ ...p, unitPrice: e.target.value }))}
 inputMode="decimal"
 className="mt-1 ys-input"
 disabled={!canManage}
 />
 </label>

 <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground ">
 <input
 type="checkbox"
 checked={linkForm.preferred}
 onChange={(e) => setLinkForm((p) => ({ ...p, preferred: e.target.checked }))}
 className="h-4 w-4 border border-slate-300"
 disabled={!canManage}
 />
 {t("app.suppliers.products.form.preferred")}
 </label>
 </div>

 <div className="mt-3 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => { setLinkForm({ productId: "", leadTimeDays: "", moq: "", preferred: true, unitPrice: "" }); setProductSearch(""); setProductDropdownOpen(false); }}
 className="ys-btn-secondary text-xs disabled:opacity-50"
 disabled={!canManage || linkBusy}
 >
 {t("app.suppliers.products.form.clear")}
 </button>
 <button
 type="button"
 onClick={submitLink}
 className="ys-btn-primary text-xs disabled:opacity-50"
 disabled={!canManage || linkBusy}
 >
 {linkBusy ? t("app.suppliers.products.form.saving") : t("app.suppliers.products.form.save")}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </Drawer>

 <Modal open={createOpen} title={t("app.suppliers.create.title")} onClose={() => setCreateOpen(false)}>
 <div className="space-y-3">
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.name")}
 <input
 value={createForm.name}
 onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.status")}
 <select
 value={createForm.status}
 onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value as SupplierStatus }))}
 className="mt-1 ys-input"
 >
 <option value="ACTIVE">{t("app.suppliers.status.active")}</option>
 <option value="INACTIVE">{t("app.suppliers.status.inactive")}</option>
 </select>
 </label>

 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.email")}
 <input
 value={createForm.email}
 onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.phone")}
 <input
 value={createForm.phone}
 onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>
 </div>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.field.address")}
 <input
 value={createForm.address}
 onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
 className="mt-1 ys-input"
 />
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.suppliers.table.notes")}
 <textarea
 value={createForm.notes}
 onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
 className="mt-1 min-h-[110px] ys-input"
 />
 </label>

 <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setCreateOpen(false)}
 className="ys-btn-secondary text-xs"
 disabled={createBusy}
 >
 {t("app.suppliers.action.cancel")}
 </button>
 <button
 type="button"
 onClick={createSupplier}
 className="ys-btn-primary text-xs disabled:opacity-50"
 disabled={createBusy}
 >
 {createBusy ? t("app.suppliers.action.creating") : t("app.suppliers.action.create")}
 </button>
 </div>
 </div>
 </Modal>
 </main>
 );
}
