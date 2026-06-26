"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { AgenciesService, EmployeesRolesService } from "@/lib";
import type { Agency, OrganizationMember } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type { Product, ProductCategory, StockLevel, StockMovement } from "@/lib-stock";
import { WarehousesService } from "@/lib-spare/appServices";
import { SuppliersService } from "@/yowyob-tiers/appServices";
import type { ProductLocation } from "@/lib-spare/appServices";
import type { Supplier } from "@/yowyob-tiers/appServices";
import MovableModal from "@/components/MovableModal";
import { hasOrganizationAccess } from "@/lib/accessControl";
import ExportMenu from "@/components/ExportMenu";
import { downloadCsv, printTablePdf } from "@/lib/exportFiles";

type StockStatus = "OK" | "LOW" | "OUT";
type SortKey = "sku" | "name" | "category" | "onHand" | "status" | "lastMove";
type SortDir = "asc" | "desc";
type LocationFilter = "ALL" | "WAREHOUSES" | { agencyId: string };

const REQUISITION_DRAFT_KEY = "yowspare-requisition-draft-v1";

function formatDate(value?: string) {
 if (!value) return "—";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function statusRank(s: StockStatus) {
 if (s === "OUT") return 3;
 if (s === "LOW") return 2;
 return 1;
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
 <MovableModal open={open} title={title} onClose={onClose} initialWidth={980} initialHeight={620}>
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
 <div className="ys-drawer-panel max-w-xl">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="ys-section-title">
 {title}
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="ys-icon-btn"
 aria-label="Close"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 <div className="mt-4">{children}</div>
 </div>
 </div>
 );
}

export default function InventoryPage() {
 const router = useRouter();
 const { tenant, user, logout, activeAgencyId, roles: sessionRoles } = useSession();
 const { t } = useT();
 const { query, setQuery } = usePageSearch();

 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState("");
 const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
 const [reloadSeq, setReloadSeq] = useState(0);

 const [products, setProducts] = useState<Product[]>([]);
 const [categories, setCategories] = useState<ProductCategory[]>([]);
 const [levels, setLevels] = useState<StockLevel[]>([]);
 const [movements, setMovements] = useState<StockMovement[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);

 const [orgMember, setOrgMember] = useState<OrganizationMember | null>(null);

 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [selectedProductLocations, setSelectedProductLocations] = useState<ProductLocation[] | null>(null);
 const [selectedProductLocationsLoading, setSelectedProductLocationsLoading] = useState(false);

 const [tab, setTab] = useState<"ALL" | "LOW">("ALL");
 const [location, setLocation] = useState<LocationFilter>("ALL");
 const [statusFilter, setStatusFilter] = useState<"ALL" | StockStatus>("ALL");
 const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
 const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

 const [sortKey, setSortKey] = useState<SortKey>("status");
 const [sortDir, setSortDir] = useState<SortDir>("desc");
 const [page, setPage] = useState(1);
 const pageSize = 12;

 const [detailsId, setDetailsId] = useState<string | null>(null);
 const [detailsOpen, setDetailsOpen] = useState(false);
 const [reorderOpen, setReorderOpen] = useState(false);

 const [actionAgencyId, setActionAgencyId] = useState<string>("");
 const [transferDestAgencyId, setTransferDestAgencyId] = useState<string>("");
 const [qtyIn, setQtyIn] = useState(1);
 const [qtyOut, setQtyOut] = useState(1);
 const [qtyTransfer, setQtyTransfer] = useState(1);
 const [desiredQty, setDesiredQty] = useState<number>(0);
 const [mutating, setMutating] = useState(false);
 const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

 const toastTimeoutRef = useRef<number | null>(null);
 const supplierProductsCacheRef = useRef(new Map<string, string[]>());
 const [supplierProductIds, setSupplierProductIds] = useState<string[] | null>(null);
 const [supplierProductsLoading, setSupplierProductsLoading] = useState(false);

 const showToast = (tone: "success" | "error", message: string) => {
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
 const [p, c, s, m, a] = await Promise.all([
 ProductCatalogService.getProducts(),
 ProductCatalogService.getCategories(),
 StockLevelsService.getStockLevels(),
 StockMovementsService.getAllMovements(),
 AgenciesService.getAgencies(),
 ]);
 if (!mounted) return;
 setProducts(p || []);
 setCategories(c || []);
 setLevels(s || []);
 setMovements(m || []);
 setAgencies(a || []);
 setLastSyncedAt(new Date().toISOString());
 } catch (err: unknown) {
 if (!mounted) return;
 const status = typeof err === "object" && err !== null && "status" in err ? (err as { status?: unknown }).status : undefined;
 if (status === 401) {
 logout();
 router.replace("/");
 return;
 }
 setLoadError(t("app.inventory.error.load"));
 console.error(err);
 } finally {
 if (mounted) setLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [logout, reloadSeq, router, t, tenant]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 try {
 const list = await SuppliersService.list();
 if (!mounted) return;
 setSuppliers(list || []);
 } catch (err) {
 // Supplier data is optional; don't block Inventory if spare-api isn't available.
 if (!mounted) return;
 console.warn(err);
 setSuppliers([]);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [reloadSeq, tenant]);

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
 // Ignore: membership may be forbidden for some roles.
 }
 })();
 return () => {
 mounted = false;
 };
 }, [user?.email, user?.id]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (supplierFilter === "ALL") {
 setSupplierProductIds(null);
 return;
 }

 // Avoid showing a stale set from another supplier while we load.
 setSupplierProductIds(null);

 const cached = supplierProductsCacheRef.current.get(supplierFilter);
 if (cached) {
 setSupplierProductIds(cached);
 return;
 }

 setSupplierProductsLoading(true);
 try {
 const links = await SuppliersService.listSupplierProducts(supplierFilter);
 const productIds = (links || [])
 .map((l) => l.productId)
 .filter((id): id is string => typeof id === "string" && id.length > 0);

 supplierProductsCacheRef.current.set(supplierFilter, productIds);
 if (mounted) setSupplierProductIds(productIds);
 } catch (err) {
 console.warn(err);
 supplierProductsCacheRef.current.set(supplierFilter, []);
 if (mounted) setSupplierProductIds([]);
 } finally {
 if (mounted) setSupplierProductsLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [supplierFilter]);

 const accessContext = {
 organization: tenant,
 user,
 authorities: sessionRoles,
 memberRole: orgMember?.roleName,
 };
 const canReceive = hasOrganizationAccess(accessContext, ["inventory:write"]);
 const canRemove = hasOrganizationAccess(accessContext, ["inventory:write"]);
 const canTransfer = hasOrganizationAccess(accessContext, ["inventory:write"]);
 const canAdjust = hasOrganizationAccess(accessContext, ["inventory:write"]);

 const agencyById = useMemo(() => {
 const map = new Map<string, Agency>();
 agencies.forEach((a) => {
 if (a.id) map.set(a.id, a);
 });
 return map;
 }, [agencies]);

 const categoryById = useMemo(() => {
 const map = new Map<string, ProductCategory>();
 categories.forEach((c) => {
 if (c.id) map.set(c.id, c);
 });
 return map;
 }, [categories]);

 const resolveLocationFilter = (l: LocationFilter) => {
 if (l === "ALL") return { kind: "ALL" as const };
 if (l === "WAREHOUSES") return { kind: "WAREHOUSES" as const };
 return { kind: "AGENCY" as const, agencyId: l.agencyId };
 };

 const locationState = useMemo(() => resolveLocationFilter(location), [location]);
 const locationAgencyId = locationState.kind === "AGENCY" ? locationState.agencyId : "";

 const filteredLevels = useMemo(() => {
 if (locationState.kind === "ALL") return levels;
 if (locationState.kind === "AGENCY") return levels.filter((l) => l.agencyId === locationState.agencyId);
 const warehouseIds = new Set(
 agencies
 .filter((a) => (a.type || "").toUpperCase() === "WAREHOUSE")
 .map((a) => a.id)
 .filter(Boolean) as string[]
 );
 return levels.filter((l) => (l.agencyId ? warehouseIds.has(l.agencyId) : false));
 }, [agencies, levels, locationAgencyId, locationState.kind]);

 const qtyByProduct = useMemo(() => {
 const map = new Map<string, number>();
 filteredLevels.forEach((l) => {
 const key = l.productId || "";
 if (!key) return;
 map.set(key, (map.get(key) || 0) + (l.quantity || 0));
 });
 return map;
 }, [filteredLevels]);

 const primaryAgencyByProduct = useMemo(() => {
 const map = new Map<string, string>();
 const bestQty = new Map<string, number>();
 filteredLevels.forEach((l) => {
 const pid = l.productId || "";
 const aid = l.agencyId || "";
 if (!pid || !aid) return;
 const q = l.quantity || 0;
 const currentBest = bestQty.get(pid);
 if (currentBest === undefined || q > currentBest) {
 bestQty.set(pid, q);
 map.set(pid, aid);
 }
 });
 return map;
 }, [filteredLevels]);

 const lastMoveByProduct = useMemo(() => {
 const map = new Map<string, string>();
 movements.forEach((m) => {
 const raw = m.date || m.validatedAt;
 if (!raw) return;
 (m.items || []).forEach((it) => {
 const pid = it.productId || "";
 if (!pid) return;
 const existing = map.get(pid);
 if (!existing) {
 map.set(pid, raw);
 return;
 }
 if (new Date(raw).getTime() > new Date(existing).getTime()) {
 map.set(pid, raw);
 }
 });
 });
 return map;
 }, [movements]);

 const supplierProductIdSet = useMemo(() => {
 if (!supplierProductIds) return null;
 return new Set(supplierProductIds);
 }, [supplierProductIds]);

 const stockStatusFor = (p: Product): StockStatus => {
 const qty = qtyByProduct.get(p.id || "") || 0;
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : 0;
 if (qty <= 0) return "OUT";
 if (qty <= min) return "LOW";
 return "OK";
 };

 const allRows = useMemo(() => {
 const needle = query.trim().toLowerCase();
 return (products || []).map((p) => {
 const pid = p.id || "";
 const qty = pid ? qtyByProduct.get(pid) || 0 : 0;
 const status = stockStatusFor(p);
 const lastMove = pid ? lastMoveByProduct.get(pid) || "" : "";
 const primaryAgencyId = pid ? primaryAgencyByProduct.get(pid) || "" : "";
 const primaryAgencyName = primaryAgencyId ? agencyById.get(primaryAgencyId)?.name || primaryAgencyId : "";
 const categoryName = p.categoryName || (p.categoryId ? categoryById.get(p.categoryId)?.name || "" : "");

 const hay = `${p.sku || ""} ${p.name || ""} ${p.description || ""} ${categoryName}`.toLowerCase();
 const matchesSearch = !needle ? true : hay.includes(needle);

 return {
 product: p,
 qty,
 status,
 lastMove,
 primaryAgencyId,
 primaryAgencyName,
 categoryName,
 matchesSearch,
 };
 });
 }, [agencyById, categoryById, lastMoveByProduct, primaryAgencyByProduct, products, qtyByProduct, query]);

 const filteredRows = useMemo(() => {
 const base = allRows
 .filter((r) => r.matchesSearch)
 .filter((r) => (categoryFilter === "ALL" ? true : (r.product.categoryId || "") === categoryFilter))
 .filter((r) => (statusFilter === "ALL" ? true : r.status === statusFilter));

 const tabbed = tab === "LOW" ? base.filter((r) => r.status === "LOW" || r.status === "OUT") : base;

 const withSupplier =
 supplierFilter === "ALL" || !supplierProductIdSet
 ? tabbed
 : tabbed.filter((r) => {
 const pid = r.product.id || "";
 if (!pid) return false;
 return supplierProductIdSet.has(pid);
 });
 return withSupplier;
 }, [allRows, categoryFilter, statusFilter, supplierFilter, supplierProductIdSet, tab]);

 const sortedRows = useMemo(() => {
 const dir = sortDir === "asc" ? 1 : -1;
 const rows = [...filteredRows];
 rows.sort((a, b) => {
 const ap = a.product;
 const bp = b.product;
 if (sortKey === "sku") return dir * String(ap.sku || "").localeCompare(String(bp.sku || ""));
 if (sortKey === "name") return dir * String(ap.name || ap.description || "").localeCompare(String(bp.name || bp.description || ""));
 if (sortKey === "category") return dir * String(a.categoryName || "").localeCompare(String(b.categoryName || ""));
 if (sortKey === "onHand") return dir * ((a.qty || 0) - (b.qty || 0));
 if (sortKey === "lastMove") return dir * (new Date(a.lastMove || 0).getTime() - new Date(b.lastMove || 0).getTime());
 if (sortKey === "status") return dir * (statusRank(a.status) - statusRank(b.status));
 return 0;
 });
 return rows;
 }, [filteredRows, sortDir, sortKey]);

 const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
 const currentPage = Math.min(Math.max(1, page), totalPages);
 const pagedRows = useMemo(() => {
 const start = (currentPage - 1) * pageSize;
 return sortedRows.slice(start, start + pageSize);
 }, [currentPage, sortedRows]);

 useEffect(() => {
 setPage(1);
 }, [query, tab, location, statusFilter, categoryFilter, supplierFilter, sortKey, sortDir]);

 const openDetails = (productId: string) => {
 setDetailsId(productId);
 setDetailsOpen(true);
 };

 const selectedProduct = useMemo(() => {
 if (!detailsId) return null;
 return products.find((p) => p.id === detailsId) || null;
 }, [detailsId, products]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!detailsOpen || !selectedProduct?.id) {
 setSelectedProductLocations(null);
 setSelectedProductLocationsLoading(false);
 return;
 }

 setSelectedProductLocationsLoading(true);
 try {
 const locs = await WarehousesService.listLocationsForProduct(selectedProduct.id);
 if (!mounted) return;
 setSelectedProductLocations(locs || []);
 } catch (err) {
 // Optional enrichment only; don't log out if spare-api isn't available.
 console.warn(err);
 if (!mounted) return;
 setSelectedProductLocations([]);
 } finally {
 if (mounted) setSelectedProductLocationsLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [detailsOpen, selectedProduct?.id]);

 const stockForSelected = useMemo(() => {
 if (!selectedProduct?.id) return [];
 return levels.filter((l) => l.productId === selectedProduct.id);
 }, [levels, selectedProduct?.id]);

 const selectedTotalQty = useMemo(() => {
 return stockForSelected.reduce((sum, s) => sum + (s.quantity || 0), 0);
 }, [stockForSelected]);

 const selectedStatus = useMemo(() => {
 if (!selectedProduct) return "OK" as StockStatus;
 const min = typeof selectedProduct.minStockLevel === "number" ? selectedProduct.minStockLevel : 0;
 if (selectedTotalQty <= 0) return "OUT";
 if (selectedTotalQty <= min) return "LOW";
 return "OK";
 }, [selectedProduct, selectedTotalQty]);

 const selectedRecentMovements = useMemo(() => {
 if (!selectedProduct?.id) return [];
 const pid = selectedProduct.id;
 const matched = movements.filter((m) => (m.items || []).some((it) => it.productId === pid));
 return matched
 .sort((a, b) => new Date(b.date || b.validatedAt || 0).getTime() - new Date(a.date || a.validatedAt || 0).getTime())
 .slice(0, 10);
 }, [movements, selectedProduct?.id]);

 const selectedProductLocationByAgency = useMemo(() => {
 const map = new Map<string, ProductLocation>();
 (selectedProductLocations || []).forEach((l) => {
 if (l.agencyId) map.set(l.agencyId, l);
 });
 return map;
 }, [selectedProductLocations]);

 useEffect(() => {
 if (!detailsOpen) return;
 const loc = locationState.kind === "AGENCY" ? locationState.agencyId : activeAgencyId || "";
 setActionAgencyId(loc);
 setTransferDestAgencyId("");
 setQtyIn(1);
 setQtyOut(1);
 setQtyTransfer(1);
 const currentInAgency = stockForSelected.find((s) => s.agencyId === loc)?.quantity || 0;
 setDesiredQty(currentInAgency);
 }, [activeAgencyId, detailsOpen, locationAgencyId, locationState.kind, stockForSelected]);

 const refreshStock = async () => {
 const [s, m] = await Promise.all([StockLevelsService.getStockLevels(), StockMovementsService.getAllMovements()]);
 setLevels(s || []);
 setMovements(m || []);
 setLastSyncedAt(new Date().toISOString());
 };

 const receiveIn = async () => {
 if (!selectedProduct?.id || !actionAgencyId || qtyIn <= 0) return;
 setMutating(true);
 try {
 const draft = await StockMovementsService.createDraft({
 type: "IN",
 destinationAgencyId: actionAgencyId,
 items: [{ productId: selectedProduct.id, quantity: qtyIn }],
 notes: t("app.inventory.actions.notes.receive"),
 });
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 await refreshStock();
 showToast("success", t("app.inventory.toast.received"));
 } catch (err) {
 console.error(err);
 showToast("error", t("app.inventory.toast.error"));
 } finally {
 setMutating(false);
 }
 };

 const removeOut = async () => {
 if (!selectedProduct?.id || !actionAgencyId || qtyOut <= 0) return;
 const current = stockForSelected.find((s) => s.agencyId === actionAgencyId)?.quantity || 0;
 if (current <= 0) return;
 setMutating(true);
 try {
 const draft = await StockMovementsService.createDraft({
 type: "OUT",
 sourceAgencyId: actionAgencyId,
 items: [{ productId: selectedProduct.id, quantity: Math.min(qtyOut, current) }],
 notes: t("app.inventory.actions.notes.consume"),
 });
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 await refreshStock();
 showToast("success", t("app.inventory.toast.removed"));
 } catch (err) {
 console.error(err);
 showToast("error", t("app.inventory.toast.error"));
 } finally {
 setMutating(false);
 }
 };

 const transfer = async () => {
 if (!selectedProduct?.id || !actionAgencyId || !transferDestAgencyId || qtyTransfer <= 0) return;
 if (transferDestAgencyId === actionAgencyId) return;
 const current = stockForSelected.find((s) => s.agencyId === actionAgencyId)?.quantity || 0;
 if (current <= 0) return;
 setMutating(true);
 try {
 const draft = await StockMovementsService.createDraft({
 type: "TRANSFER",
 sourceAgencyId: actionAgencyId,
 destinationAgencyId: transferDestAgencyId,
 items: [{ productId: selectedProduct.id, quantity: Math.min(qtyTransfer, current) }],
 notes: t("app.inventory.actions.notes.transfer"),
 });
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 await refreshStock();
 showToast("success", t("app.inventory.toast.transferred"));
 } catch (err) {
 console.error(err);
 showToast("error", t("app.inventory.toast.error"));
 } finally {
 setMutating(false);
 }
 };

 const adjust = async () => {
 if (!selectedProduct?.id || !actionAgencyId) return;
 const current = stockForSelected.find((s) => s.agencyId === actionAgencyId)?.quantity || 0;
 const target = Math.max(0, desiredQty || 0);
 const delta = target - current;
 if (delta === 0) {
 showToast("success", t("app.inventory.toast.noChange"));
 return;
 }
 setMutating(true);
 try {
 if (delta > 0) {
 const draft = await StockMovementsService.createDraft({
 type: "IN",
 destinationAgencyId: actionAgencyId,
 items: [{ productId: selectedProduct.id, quantity: delta }],
 notes: t("app.inventory.actions.notes.adjust"),
 });
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 } else {
 const draft = await StockMovementsService.createDraft({
 type: "OUT",
 sourceAgencyId: actionAgencyId,
 items: [{ productId: selectedProduct.id, quantity: Math.abs(delta) }],
 notes: t("app.inventory.actions.notes.adjust"),
 });
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 }
 await refreshStock();
 showToast("success", t("app.inventory.toast.adjusted"));
 } catch (err) {
 console.error(err);
 showToast("error", t("app.inventory.toast.error"));
 } finally {
 setMutating(false);
 }
 };

 const sortToggle = (key: SortKey) => {
 if (sortKey !== key) {
 setSortKey(key);
 setSortDir(key === "sku" || key === "name" || key === "category" ? "asc" : "desc");
 return;
 }
 setSortDir((d) => (d === "asc" ? "desc" : "asc"));
 };

 const statusBadgeClass = (s: StockStatus) => {
 if (s === "OUT") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200";
 if (s === "LOW") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
 return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100";
 };

 const lowStockRows = useMemo(() => filteredRows.filter((r) => r.status === "LOW" || r.status === "OUT"), [filteredRows]);

 const reorderRows = useMemo(() => {
 return lowStockRows.map((r) => {
 const min = typeof r.product.minStockLevel === "number" ? r.product.minStockLevel : 0;
 const max = typeof r.product.maxStockLevel === "number" ? r.product.maxStockLevel : undefined;
 const target = typeof max === "number" ? max : min;
 const suggested = Math.max(0, target - (r.qty || 0));
 return {
 productId: r.product.id || "",
 sku: r.product.sku || "—",
 name: r.product.name || r.product.description || "—",
 qty: r.qty || 0,
 min,
 suggested,
 };
 });
 }, [lowStockRows]);

 const getLowStockExport = () => {
 const headers = [
 t("app.inventory.table.sku"),
 t("app.inventory.table.part"),
 t("app.inventory.table.onHand"),
 t("app.inventory.table.min"),
 t("app.inventory.table.status"),
 ];
 const rowsOut = lowStockRows.map((r) => [
 r.product.sku || "",
 r.product.name || r.product.description || "",
 r.qty || 0,
 r.product.minStockLevel ?? "",
 r.status,
 ]);
 return { headers, rowsOut };
 };

 const exportLowStock = (format: "csv" | "pdf") => {
 const { headers, rowsOut } = getLowStockExport();
 if (format === "csv") {
 downloadCsv("low-stock.csv", headers, rowsOut);
 return;
 }
 printTablePdf({
 title: t("app.inventory.tab.low"),
 subtitle: t("app.inventory.lowStock.count", { count: lowStockRows.length }),
 headers,
 rows: rowsOut,
 });
 };

 const getReorderExport = () => {
 const headers = [
 t("app.inventory.table.sku"),
 t("app.inventory.table.part"),
 t("app.inventory.table.onHand"),
 t("app.inventory.table.min"),
 t("app.inventory.reorder.suggested"),
 ];
 const rowsOut = reorderRows.map((r) => [r.sku, r.name, r.qty, r.min, r.suggested]);
 return { headers, rowsOut };
 };

 const exportReorder = (format: "csv" | "pdf") => {
 const { headers, rowsOut } = getReorderExport();
 if (format === "csv") {
 downloadCsv("reorder-list.csv", headers, rowsOut);
 return;
 }
 printTablePdf({
 title: t("app.inventory.reorder.title"),
 headers,
 rows: rowsOut,
 });
 };

 return (
 <div className="ys-page">
 <div className="ys-page-header">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <h2 className="ys-page-title">{t("app.inventory.title")}</h2>
 <p className="ys-page-subtitle">{t("app.inventory.subtitle")}</p>
 <div className="mt-2 text-xs text-muted-foreground">
 {t("app.inventory.synced")}{" "}
 <span className="font-medium text-foreground ">{formatDate(lastSyncedAt || undefined)}</span>
 </div>
 </div>

 <div className="flex flex-col gap-3 lg:items-end">
 <div className="flex items-center gap-2">
         <button
           type="button"
           onClick={() => setTab("ALL")}
            className={`ys-tab ${
              tab === "ALL"
                ? "ys-tab-active"
                : ""
            }`}
          >
 {t("app.inventory.tab.all")}
 </button>
         <button
           type="button"
           onClick={() => setTab("LOW")}
            className={`ys-tab ${
              tab === "LOW"
                ? "ys-tab-active"
                : ""
            }`}
          >
 {t("app.inventory.tab.low")}
 </button>
 </div>

 <div className="flex flex-wrap items-center justify-end gap-2">
 <input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder={t("app.inventory.searchPlaceholder")}
 className="ys-input w-full max-w-xl"
 />
 </div>
 </div>
 </div>

 <div className="ys-filter-grid mt-4 lg:grid-cols-4">
 <label className="ys-filter-label">
 {t("app.inventory.filters.location")}
 <select
 value={locationState.kind === "ALL" ? "ALL" : locationState.kind === "WAREHOUSES" ? "WAREHOUSES" : locationState.agencyId}
 onChange={(e) => {
 const v = e.target.value;
 if (v === "ALL") setLocation("ALL");
 else if (v === "WAREHOUSES") setLocation("WAREHOUSES");
 else setLocation({ agencyId: v });
 }}
 className="ys-input mt-1"
 >
 <option value="ALL">{t("app.inventory.location.all")}</option>
 <option value="WAREHOUSES">{t("app.inventory.location.warehouses")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id || ""}>
 {a.name || a.id}
 </option>
 ))}
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.inventory.filters.status")}
 <select
 value={statusFilter}
 onChange={(e) => {
 const value = e.target.value;
 setStatusFilter(value === "OK" || value === "LOW" || value === "OUT" ? value : "ALL");
 }}
 className="ys-input mt-1"
 >
 <option value="ALL">{t("app.inventory.filter.all")}</option>
 <option value="OK">{t("app.inventory.status.ok")}</option>
 <option value="LOW">{t("app.inventory.status.low")}</option>
 <option value="OUT">{t("app.inventory.status.out")}</option>
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.inventory.filters.category")}
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="ys-input mt-1"
 >
 <option value="ALL">{t("app.inventory.filter.all")}</option>
 {categories.map((c) => (
 <option key={c.id} value={c.id || ""}>
 {c.name || c.id}
 </option>
 ))}
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.inventory.filters.supplier")}
 <select
 value={supplierFilter}
 onChange={(e) => setSupplierFilter(e.target.value)}
 className="ys-input mt-1"
 >
 <option value="ALL">{t("app.inventory.filter.all")}</option>
 {suppliers.map((s) => (
 <option key={s.id} value={s.id}>
 {s.name}
 </option>
 ))}
 </select>
 </label>
 </div>

 {supplierFilter !== "ALL" && supplierProductsLoading && (
 <div className="mt-3 text-xs text-muted-foreground ">{t("app.common.loading")}</div>
 )}

 {tab === "LOW" && (
 <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 ">
 <div className="text-xs text-muted-foreground ">
 {t("app.inventory.lowStock.count", { count: lowStockRows.length })}
 </div>
 <div className="flex items-center gap-2">
 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportLowStock("csv")}
 onPdf={() => exportLowStock("pdf")}
 className="ys-btn-secondary text-xs"
 />
 <button
 type="button"
 onClick={() => setReorderOpen(true)}
 className="ys-btn-primary text-xs"
 >
 {t("app.inventory.reorder.create")}
 </button>
 </div>
 </div>
 )}
 </div>

 {loadError && (
 <div className="ys-alert-warning">
 <div className="flex items-center justify-between gap-4">
 <div>{loadError}</div>
 <button
 type="button"
 onClick={() => setReloadSeq((n) => n + 1)}
 className="ys-btn-secondary text-xs"
 >
 {t("app.inventory.error.retry")}
 </button>
 </div>
 </div>
 )}

 <div className="ys-card p-4">
 <div className="flex items-center justify-between gap-3">
 <div className="text-xs text-muted-foreground ">
 {t("app.inventory.pagination", { page: currentPage, total: totalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={currentPage <= 1}
 className="ys-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
 >
 {t("app.inventory.prev")}
 </button>
 <button
 type="button"
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={currentPage >= totalPages}
 className="ys-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
 >
 {t("app.inventory.next")}
 </button>
 </div>
 </div>

 <div className="mt-4 ys-table-wrap">
 <table className="ys-table">
 <thead>
 <tr className="ys-table-head">
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("sku")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.inventory.table.sku")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("name")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.inventory.table.part")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("category")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.inventory.table.category")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("onHand")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.inventory.table.onHand")}
 </button>
 </th>
 <th className="py-2 pr-4">{t("app.inventory.table.min")}</th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("status")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.inventory.table.status")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("lastMove")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.inventory.table.lastMove")}
 </button>
 </th>
 <th className="py-2 pr-4">{t("app.inventory.table.location")}</th>
 <th className="py-2 text-right">{t("app.inventory.table.actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {loading ? (
 new Array(6).fill(0).map((_, i) => (
 <tr key={i} className="animate-pulse">
 <td className="ys-table-cell">
 <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-56 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell">
 <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800" />
 </td>
 <td className="ys-table-cell text-right">
 <div className="ml-auto h-3 w-24 bg-slate-200 dark:bg-slate-800" />
 </td>
 </tr>
 ))
 ) : (
 <>
 {pagedRows.map((r) => {
 const p = r.product;
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : undefined;
 const max = typeof p.maxStockLevel === "number" ? p.maxStockLevel : undefined;
 return (
 <tr
 key={p.id}
 className="cursor-pointer ys-table-row"
 onClick={() => openDetails(p.id || "")}
 >
                        <td className="ys-table-cell font-medium">{p.sku || "—"}</td>
 <td className="ys-table-cell">
 <div className="flex min-w-0 items-center gap-3">
 <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={p}
 alt={p.name || p.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback />}
 />
 </div>
 <div className="min-w-0">
 <div className="font-medium text-foreground ">
 {p.name || p.description || t("app.inventory.unnamed")}
 </div>
 <div className="truncate text-xs text-muted-foreground">{p.description || ""}</div>
 </div>
 </div>
 </td>
                        <td className="ys-table-cell text-muted-foreground">{r.categoryName || "—"}</td>
                        <td className="ys-table-cell font-semibold">{r.qty}</td>
                        <td className="ys-table-cell text-muted-foreground">
 {min ?? "—"}
 {typeof max === "number" ? (
 <span className="text-xs text-muted-foreground"> / {max}</span>
 ) : null}
 </td>
 <td className="ys-table-cell">
 <span className={`inline-flex items-center border px-2 py-1 text-xs font-semibold ${statusBadgeClass(r.status)}`}>
 {r.status === "OK"
 ? t("app.inventory.status.ok")
 : r.status === "LOW"
 ? t("app.inventory.status.low")
 : t("app.inventory.status.out")}
 </span>
 </td>
                        <td className="ys-table-cell text-muted-foreground">{formatDate(r.lastMove || undefined)}</td>
                        <td className="ys-table-cell text-muted-foreground">{r.primaryAgencyName || "—"}</td>
 <td className="ys-table-cell text-right" onClick={(e) => e.stopPropagation()}>
 <div className="inline-flex items-center gap-2">
 <Link
 href="/app/warehouse"
 className="ys-icon-btn text-primary hover:border-primary/40"
 aria-label={t("app.inventory.actions.receive")}
 title={t("app.inventory.actions.receive")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 5v14M5 12h14" strokeLinecap="round" />
 </svg>
 </Link>
 <Link
 href={`/app/inventory/${p.id}`}
 className="ys-icon-btn-edit"
 aria-label={t("app.inventory.actions.view")}
 title={t("app.inventory.actions.view")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" />
 <path d="M3 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
 </svg>
 </Link>
 <button
 type="button"
 onClick={() => openDetails(p.id || "")}
 className="ys-icon-btn"
 aria-label={t("app.inventory.actions.details")}
 title={t("app.inventory.actions.details")}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9z" strokeLinecap="round" />
 <path d="M12 11v5" strokeLinecap="round" />
 <path d="M12 7h.01" strokeLinecap="round" />
 </svg>
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 {!pagedRows.length && (
 <tr>
 <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
 {t("app.inventory.empty")}
 </td>
 </tr>
 )}
 </>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <Drawer
 open={detailsOpen && !!selectedProduct}
 title={t("app.inventory.details.title")}
 onClose={() => setDetailsOpen(false)}
 >
 {selectedProduct ? (
 <div className="space-y-5">
 <div className="ys-card p-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex min-w-0 items-start gap-3">
 <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={selectedProduct}
 alt={selectedProduct.name || selectedProduct.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback className="h-6 w-6" />}
 />
 </div>
 <div className="min-w-0">
 <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
 {selectedProduct.sku || "—"}
 </div>
 <div className="mt-1 text-lg font-semibold text-foreground ">
 {selectedProduct.name || selectedProduct.description || t("app.inventory.unnamed")}
 </div>
 <div className="mt-1 text-sm text-muted-foreground ">
 {selectedProduct.categoryName || (selectedProduct.categoryId ? categoryById.get(selectedProduct.categoryId)?.name : "") || "—"}
 </div>
 </div>
 </div>
 <span className={`inline-flex items-center border px-2 py-1 text-xs font-semibold ${statusBadgeClass(selectedStatus)}`}>
 {selectedStatus === "OK"
 ? t("app.inventory.status.ok")
 : selectedStatus === "LOW"
 ? t("app.inventory.status.low")
 : t("app.inventory.status.out")}
 </span>
 </div>

 <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
 <div className="border border-border bg-card rounded-xl px-3 py-2 ">
 <div className="text-xs text-muted-foreground">{t("app.inventory.details.onHand")}</div>
 <div className="mt-1 text-lg font-semibold text-foreground ">{selectedTotalQty}</div>
 </div>
 <div className="border border-border bg-card rounded-xl px-3 py-2 ">
 <div className="text-xs text-muted-foreground">{t("app.inventory.details.min")}</div>
 <div className="mt-1 text-lg font-semibold text-foreground ">{selectedProduct.minStockLevel ?? "—"}</div>
 </div>
 <div className="border border-border bg-card rounded-xl px-3 py-2 ">
 <div className="text-xs text-muted-foreground">{t("app.inventory.details.suggested")}</div>
 <div className="mt-1 text-lg font-semibold text-foreground ">
 {Math.max(
 0,
 (typeof selectedProduct.maxStockLevel === "number" ? selectedProduct.maxStockLevel : selectedProduct.minStockLevel || 0) -
 selectedTotalQty
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="flex items-center justify-between gap-4">
 <div className="text-sm font-semibold">{t("app.inventory.details.stockByAgency")}</div>
 <div className="text-xs text-muted-foreground">
 {selectedProductLocationsLoading ? t("app.common.loading") : t("app.inventory.bin")}
 </div>
 </div>
 <div className="mt-3 space-y-2">
 {stockForSelected
 .slice()
 .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
 .map((s) => {
 const agencyName = s.agencyId ? agencyById.get(s.agencyId)?.name || s.agencyId : "—";
 const bin = s.agencyId ? selectedProductLocationByAgency.get(s.agencyId)?.binCode || "" : "";
 const note = s.agencyId ? selectedProductLocationByAgency.get(s.agencyId)?.note || null : null;
 return (
 <div
 key={s.id}
 className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border border-border rounded-xl px-3 py-2 text-sm "
 >
 <div className="min-w-0">
 <div className="font-medium text-foreground ">{agencyName}</div>
 <div className="text-xs text-muted-foreground">{t("app.inventory.details.lastUpdated")} {formatDate(s.lastUpdated)}</div>
 </div>
 <div
 className="whitespace-nowrap text-xs font-semibold text-foreground "
 title={note || undefined}
 >
 {bin || "—"}
 </div>
 <div className="font-semibold text-foreground ">{s.quantity ?? 0}</div>
 </div>
 );
 })}
 {!stockForSelected.length && (
 <div className="text-sm text-muted-foreground">{t("app.inventory.details.noStock")}</div>
 )}
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="text-sm font-semibold">{t("app.inventory.details.recentMovements")}</div>
 <div className="mt-3 space-y-2">
 {selectedRecentMovements.map((m) => (
 <div key={m.id} className="border border-border rounded-xl px-3 py-2 text-sm ">
 <div className="flex items-center justify-between gap-4">
 <div className="font-medium text-foreground ">{m.type || "—"}</div>
 <div className="text-xs text-muted-foreground">{formatDate(m.date || m.validatedAt)}</div>
 </div>
 <div className="mt-1 text-xs text-muted-foreground">
 {(m.items || [])
 .filter((it) => it.productId === selectedProduct.id)
 .map((it) => `${t("app.common.qty")}: ${it.quantity ?? 0}`)
 .join(" · ")}
 </div>
 </div>
 ))}
 {!selectedRecentMovements.length && (
 <div className="text-sm text-muted-foreground">{t("app.inventory.details.noMovements")}</div>
 )}
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="text-sm font-semibold">{t("app.inventory.details.actions")}</div>

 <div className="mt-3 grid grid-cols-1 gap-3">
 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.inventory.actions.agency")}
 <select
 value={actionAgencyId}
 onChange={(e) => setActionAgencyId(e.target.value)}
 className="ys-input mt-1"
 >
 <option value="">{t("app.inventory.actions.agency.placeholder")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id || ""}>
 {a.name || a.id}
 </option>
 ))}
 </select>
 </label>

 <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
 <div className="ys-card p-3">
 <div className="flex items-center justify-between">
 <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
 {t("app.inventory.actions.receive")}
 </div>
 {!canReceive && <div className="text-xs text-muted-foreground">{t("app.inventory.actions.notAllowed")}</div>}
 </div>
 <div className="mt-2 flex items-center gap-2">
 <input
 type="number"
 min={1}
 value={qtyIn}
 onChange={(e) => setQtyIn(Number(e.target.value))}
 className="ys-input w-28"
 />
 <button
 type="button"
 disabled={!canReceive || mutating || !actionAgencyId}
 onClick={receiveIn}
 className="ys-btn-primary flex-1 px-3 py-2 text-sm disabled:opacity-50"
 >
 {t("app.inventory.actions.run")}
 </button>
 </div>
 </div>

 <div className="ys-card p-3">
 <div className="flex items-center justify-between">
 <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
 {t("app.inventory.actions.remove")}
 </div>
 {!canRemove && <div className="text-xs text-muted-foreground">{t("app.inventory.actions.notAllowed")}</div>}
 </div>
 <div className="mt-2 flex items-center gap-2">
 <input
 type="number"
 min={1}
 value={qtyOut}
 onChange={(e) => setQtyOut(Number(e.target.value))}
 className="ys-input w-28"
 />
 <button
 type="button"
 disabled={!canRemove || mutating || !actionAgencyId}
 onClick={removeOut}
 className="ys-btn-danger flex-1 px-3 py-2 text-sm disabled:opacity-50"
 >
 {t("app.inventory.actions.run")}
 </button>
 </div>
 </div>
 </div>

 <div className="ys-card p-3">
 <div className="flex items-center justify-between">
 <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
 {t("app.inventory.actions.transfer")}
 </div>
 {!canTransfer && <div className="text-xs text-muted-foreground">{t("app.inventory.actions.notAllowed")}</div>}
 </div>
 <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr_120px_120px] lg:items-center">
 <select
 value={transferDestAgencyId}
 onChange={(e) => setTransferDestAgencyId(e.target.value)}
 className="ys-input"
 >
 <option value="">{t("app.inventory.actions.transfer.to")}</option>
 {agencies
 .filter((a) => (a.id || "") !== actionAgencyId)
 .map((a) => (
 <option key={a.id} value={a.id || ""}>
 {a.name || a.id}
 </option>
 ))}
 </select>
 <div className="text-xs text-muted-foreground">
 {t("app.inventory.actions.transfer.hint")}
 </div>
 <input
 type="number"
 min={1}
 value={qtyTransfer}
 onChange={(e) => setQtyTransfer(Number(e.target.value))}
 className="ys-input"
 />
 <button
 type="button"
 disabled={!canTransfer || mutating || !actionAgencyId || !transferDestAgencyId}
 onClick={transfer}
 className="ys-btn-primary px-3 py-2 text-sm disabled:opacity-50"
 >
 {t("app.inventory.actions.run")}
 </button>
 </div>
 </div>

 <div className="ys-card p-3">
 <div className="flex items-center justify-between">
 <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
 {t("app.inventory.actions.adjust")}
 </div>
 {!canAdjust && <div className="text-xs text-muted-foreground">{t("app.inventory.actions.notAllowed")}</div>}
 </div>
 <div className="mt-2 flex items-center gap-2">
 <input
 type="number"
 min={0}
 value={desiredQty}
 onChange={(e) => setDesiredQty(Number(e.target.value))}
 className="ys-input w-40"
 />
 <button
 type="button"
 disabled={!canAdjust || mutating || !actionAgencyId}
 onClick={adjust}
 className="ys-btn-primary flex-1 px-3 py-2 text-sm disabled:opacity-50"
 >
 {t("app.inventory.actions.run")}
 </button>
 </div>
 <div className="mt-2 text-xs text-muted-foreground">
 {t("app.inventory.actions.adjust.hint")}
 </div>
 </div>
 </div>
 </div>

 <div className="ys-card p-4 text-xs text-muted-foreground">
 {t("app.inventory.details.attachmentsHint")}
 </div>
 </div>
 ) : null}
 </Drawer>

 <Modal open={reorderOpen} title={t("app.inventory.reorder.title")} onClose={() => setReorderOpen(false)}>
 <div className="flex items-center justify-between gap-4">
 <div className="text-sm text-muted-foreground ">
 {t("app.inventory.reorder.subtitle")}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 const items = reorderRows
 .filter((r) => !!r.productId && (r.suggested || 0) > 0)
 .map((r) => ({
 productId: r.productId,
 sku: r.sku,
 name: r.name,
 qty: Math.max(1, r.suggested || 1),
 }));

 if (!items.length) {
 showToast("error", t("app.inventory.reorder.empty"));
 return;
 }

 try {
 localStorage.setItem(
 REQUISITION_DRAFT_KEY,
 JSON.stringify({
 source: "inventory",
 createdAt: new Date().toISOString(),
 items,
 })
 );
 } catch {
 // ignore
 }

 setReorderOpen(false);
 router.push("/app/procurement");
 }}
 className="ys-btn-primary px-3 py-1.5 text-xs"
 >
 {t("app.inventory.reorder.openProcurement")}
 </button>
 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportReorder("csv")}
 onPdf={() => exportReorder("pdf")}
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 />
 </div>
 </div>

 <div className="mt-4 ys-table-wrap">
 <table className="ys-table">
 <thead>
 <tr className="ys-table-head">
 <th className="ys-table-cell pr-3">{t("app.inventory.table.sku")}</th>
 <th className="ys-table-cell pr-3">{t("app.inventory.table.part")}</th>
 <th className="ys-table-cell pr-3">{t("app.inventory.table.onHand")}</th>
 <th className="ys-table-cell pr-3">{t("app.inventory.table.min")}</th>
 <th className="py-2">{t("app.inventory.reorder.suggested")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {reorderRows.map((r) => (
 <tr key={`${r.sku}-${r.name}`}>
 <td className="py-2 pr-3 font-medium text-foreground ">{r.sku}</td>
 <td className="py-2 pr-3 text-foreground ">{r.name}</td>
 <td className="py-2 pr-3 text-foreground ">{r.qty}</td>
 <td className="py-2 pr-3 text-foreground ">{r.min}</td>
 <td className="ys-table-cell font-semibold">{r.suggested}</td>
 </tr>
 ))}
 {!reorderRows.length && (
 <tr>
 <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
 {t("app.inventory.reorder.empty")}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </Modal>

 {toast && (
 <div
 className={`fixed bottom-4 right-4 z-50 border px-4 py-3 text-sm shadow-lg ${
 toast.tone === "success"
 ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
 : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
 }`}
 >
 {toast.message}
 </div>
 )}
 </div>
 );
}
