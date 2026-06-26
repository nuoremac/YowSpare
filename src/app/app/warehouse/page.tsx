"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { useSession } from "@/store/session";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { AgenciesService, EmployeesRolesService } from "@/lib";
import type { Agency, OrganizationMember } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type {
 CreateMovementRequest,
 Product,
 ProductCategory,
 StockLevel,
 StockMovement,
} from "@/lib-stock";
import {
 MaterialOperationsControllerService,
 type MaterialRequestDto,
 type MaterialRequestItemDto,
} from "@/lib-spare";
import { ReceiptsService, WarehousesService as SpareWarehousesService } from "@/lib-spare/appServices";
import type { ProductLocation, Receipt as ReceiptApi } from "@/lib-spare/appServices";
import MovableModal from "@/components/MovableModal";
import Warehouse3DMap from "@/components/Warehouse3DMap";
import { hasOrganizationAccess } from "@/lib/accessControl";
import { reportHandledApiError } from "@/lib/reportApiError";
import {
 getWarehouseBinPosition,
 WAREHOUSE_BINS,
 WAREHOUSE_BIN_COLUMNS,
 WAREHOUSE_BIN_ROWS,
} from "@/lib/warehouseLayout";

type Tab = "OPS" | "STOCK" | "MAP";
type HeatmapMode = "qty" | "low";
type StockStatus = "OK" | "LOW" | "OUT";
type SortKey = "sku" | "name" | "category" | "qty" | "status" | "lastMove" | "updated";
type SortDir = "asc" | "desc";
type OpKind = "IN" | "OUT" | "TRANSFER";
type IssueMode = "REQUEST" | "MANUAL";
type BinStockItem = { product: Product; level: StockLevel; binCode: string; quantity: number; unassigned?: boolean };

// ── Receipt types (mirrors receipts page) ────────────────────────────────────
type ReceiptLine = { id: string; poLineId: string; productId: string; productName: string; sku: string; orderedQty: number; receivedQty: number; note: string; };
type ReceiptRecord = { id: string; receiptNumber: string; poId: string; poNumber: string; agencyId: string; supplierId: string; supplierName: string; supplierAddress: string; status: "COMPLETE" | "PARTIAL" | "REJECTED"; stockPosted?: boolean; receivedAt: string; note: string; lines: ReceiptLine[]; createdAt: string; updatedAt: string; };

const ALL_BINS = WAREHOUSE_BINS;

function formatDate(value?: string) {
 if (!value) return "—";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function shortId(value?: string) {
 if (!value) return "—";
 return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function normalizeReceiptStatus(status?: string | null): ReceiptRecord["status"] {
 if (status === "COMPLETE" || status === "PARTIAL" || status === "REJECTED") return status;
 return "PARTIAL";
}

function fromApiReceipt(receipt: ReceiptApi): ReceiptRecord {
 return {
 id: receipt.id,
 receiptNumber: receipt.receiptNumber,
 poId: receipt.poId,
 poNumber: receipt.poNumber,
 agencyId: receipt.agencyId || "",
 supplierId: receipt.supplierId || "",
 supplierName: receipt.supplierName || "",
 supplierAddress: receipt.supplierAddress || "",
 status: normalizeReceiptStatus(receipt.status),
 stockPosted: receipt.stockPosted,
 receivedAt: receipt.receivedAt || receipt.createdAt || "",
 note: receipt.note || "",
 lines: (receipt.lines || []).map((line, index) => ({
 id: line.id || `${receipt.id}:line:${index}`,
 poLineId: line.poLineId,
 productId: line.productId,
 productName: line.productName,
 sku: line.sku,
 orderedQty: line.orderedQty,
 receivedQty: line.receivedQty,
 note: line.note || "",
 })),
 createdAt: receipt.createdAt || "",
 updatedAt: receipt.updatedAt || receipt.createdAt || "",
 };
}

function getApiErrorMessage(error: unknown) {
 if (typeof error === "object" && error && "body" in error) {
 const body = (error as { body?: unknown }).body;
 if (typeof body === "string") return body;
 if (typeof body === "object" && body) {
 const payload = body as { message?: unknown; error?: unknown; requestId?: unknown };
 const message = payload.message ?? payload.error;
 if (typeof message === "string") {
 return typeof payload.requestId === "string" ? `${message} (${payload.requestId})` : message;
 }
 }
 }
 if (typeof error === "object" && error && "message" in error) {
 const message = (error as { message?: unknown }).message;
 if (typeof message === "string") return message;
 }
 return "";
}

function hashString(input: string) {
 // djb2
 let h = 5381;
 for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
 return h >>> 0;
}

function statusRank(s: StockStatus) {
 if (s === "OUT") return 3;
 if (s === "LOW") return 2;
 return 1;
}

function normalizeRackCategories(layout: unknown) {
 const candidate =
 typeof layout === "object" && layout && "rackCategories" in layout
 ? (layout as { rackCategories?: unknown }).rackCategories
 : undefined;
 if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};
 return Object.entries(candidate).reduce<Record<string, string>>((acc, [rack, value]) => {
 const normalizedRack = rack.trim().toUpperCase();
 const normalizedValue = typeof value === "string" ? value.trim() : "";
 if (/^[A-F]$/.test(normalizedRack) && normalizedValue) acc[normalizedRack] = normalizedValue;
 return acc;
 }, {});
}

function warehouseLayoutPayload(agencyId: string, rackCategories: Record<string, string>) {
 return {
 agencyId,
 type: "WAREHOUSE_3D",
 width: WAREHOUSE_BIN_COLUMNS,
 height: WAREHOUSE_BIN_ROWS.length,
 layout: { rackCategories },
 };
}

function readLegacyRackCategories(agencyId: string) {
 if (typeof window === "undefined") return {};
 try {
 const stored = window.localStorage.getItem(`yowspare:warehouse:rack-categories:${agencyId}`);
 const parsed = stored ? JSON.parse(stored) : {};
 return normalizeRackCategories({ rackCategories: parsed });
 } catch {
 return {};
 }
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
 <div className="ys-section-title">
 {title}
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
 <MovableModal open={open} title={title} onClose={onClose} initialWidth={760} initialHeight={560}>
 <div className="mt-4">{children}</div>
 </MovableModal>
 );
}

export default function WarehousePage() {
 const router = useRouter();
 const { tenant, user, logout, activeAgencyId, setActiveAgencyId, roles: sessionRoles } = useSession();
 const { t } = useT();
 const { query, setQuery } = usePageSearch();

 const [tab, setTab] = useState<Tab>("OPS");
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

 // Local bin mapping: { [agencyId]: { [productId]: binCode } }
 const [binMap, setBinMap] = useState<Record<string, Record<string, string>>>({});

 // Operations wizard
 const [opOpen, setOpOpen] = useState(false);
 const [opKind, setOpKind] = useState<OpKind>("IN");
 const [opStep, setOpStep] = useState<1 | 2 | 3>(1);
 const [opSearch, setOpSearch] = useState("");
 const [opProductId, setOpProductId] = useState("");
 const [opQty, setOpQty] = useState(1);
 const [opNotes, setOpNotes] = useState("");
 const [opDestAgencyId, setOpDestAgencyId] = useState("");
 const [opIssueMode, setOpIssueMode] = useState<IssueMode>("MANUAL");
 const [opMaterialRequestId, setOpMaterialRequestId] = useState("");
 const [opMaterialRequestSearch, setOpMaterialRequestSearch] = useState("");
 const [opIssueBins, setOpIssueBins] = useState<Record<string, string>>({});
 const [opBusy, setOpBusy] = useState(false);
 const [opError, setOpError] = useState("");
 const [opSuccess, setOpSuccess] = useState<{ title: string; message: string } | null>(null);
 // Receipt-linked IN flow
 const [allReceipts, setAllReceipts] = useState<ReceiptRecord[]>([]);
 const [opReceiptId, setOpReceiptId] = useState("");
 const [opReceiptSearch, setOpReceiptSearch] = useState("");
 const [opLineBins, setOpLineBins] = useState<Record<string, string>>({});
 const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);
 const [approvedMaterialRequests, setApprovedMaterialRequests] = useState<MaterialRequestDto[]>([]);

 // Stock table
 const [sortKey, setSortKey] = useState<SortKey>("status");
 const [sortDir, setSortDir] = useState<SortDir>("desc");
 const [page, setPage] = useState(1);
 const pageSize = 12;

 // Movements drawer
 const [movementDrawerOpen, setMovementDrawerOpen] = useState(false);
 const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);

 // Map
 const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("qty");
 const [selectedBin, setSelectedBin] = useState<string | null>(null);
 const [mapSearch, setMapSearch] = useState("");
 const [isEditingBins, setIsEditingBins] = useState(false);
 const [rackCategoryRack, setRackCategoryRack] = useState("A");
 const [rackCategories, setRackCategories] = useState<Record<string, string>>({});
 const binDetailsRef = useRef<HTMLElement | null>(null);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant || !activeAgencyId) return;
 try {
 const locs = await SpareWarehousesService.listProductLocations(activeAgencyId);
 if (!mounted) return;
 const next: Record<string, string> = {};
 (locs || []).forEach((l) => {
 if (l?.productId && l?.binCode) next[l.productId] = l.binCode;
 });
 setProductLocations(locs || []);
 setBinMap((prev) => ({ ...prev, [activeAgencyId]: next }));
 } catch (err: unknown) {
 if (!mounted) return;
 // Non-blocking: if spare-api is down / misconfigured, we can still show a deterministic fallback mapping.
 // (We deliberately do NOT log the user out here, because core-api/stock-api auth may still be valid.)
 reportHandledApiError("Warehouse product locations could not be loaded.", err);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [activeAgencyId, tenant]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant || !activeAgencyId) {
 setRackCategories({});
 return;
 }
 try {
 const layout = await SpareWarehousesService.getLayout(activeAgencyId);
 if (!mounted) return;
 const sharedCategories = normalizeRackCategories(layout?.layout);
 const legacyCategories = Object.keys(sharedCategories).length
 ? {}
 : readLegacyRackCategories(activeAgencyId);
 const nextCategories = Object.keys(sharedCategories).length
 ? sharedCategories
 : legacyCategories;
 setRackCategories(nextCategories);
 if (!Object.keys(sharedCategories).length && Object.keys(legacyCategories).length) {
 void SpareWarehousesService.putLayout(
 activeAgencyId,
 warehouseLayoutPayload(activeAgencyId, legacyCategories),
 ).catch((saveErr: unknown) => {
 reportHandledApiError("Legacy warehouse layout could not be migrated.", saveErr);
 });
 }
 } catch (err: unknown) {
 if (!mounted) return;
 setRackCategories({});
 reportHandledApiError("Warehouse layout could not be loaded.", err);
 }
 setRackCategoryRack("A");
 })();
 return () => {
 mounted = false;
 };
 }, [activeAgencyId, tenant]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 setLoading(true);
 setLoadError("");
 try {
 const results = await Promise.allSettled([
 ProductCatalogService.getProducts(),
 ProductCatalogService.getCategories(),
 StockLevelsService.getStockLevels(),
 StockMovementsService.getAllMovements(),
 AgenciesService.getAgencies(),
 ReceiptsService.list(),
 MaterialOperationsControllerService.listMaterialRequests(activeAgencyId || undefined, undefined, "APPROVED"),
 ]);
 if (!mounted) return;
 const [
 productsResult,
 categoriesResult,
 levelsResult,
 movementsResult,
 agenciesResult,
 receiptsResult,
 materialRequestsResult,
 ] = results;
 const unauthorized = results.some(
 (result) => result.status === "rejected" && result.reason?.status === 401,
 );
 if (unauthorized) {
 logout();
 router.replace("/");
 return;
 }
 if (productsResult.status === "fulfilled") setProducts(productsResult.value || []);
 if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value || []);
 if (levelsResult.status === "fulfilled") setLevels(levelsResult.value || []);
 if (movementsResult.status === "fulfilled") setMovements(movementsResult.value || []);
 if (agenciesResult.status === "fulfilled") setAgencies(agenciesResult.value || []);
 if (receiptsResult.status === "fulfilled") {
 setAllReceipts((receiptsResult.value || []).map(fromApiReceipt).filter((receipt) => receipt.status !== "REJECTED" && !receipt.stockPosted));
 }
 if (materialRequestsResult.status === "fulfilled") {
 setApprovedMaterialRequests(materialRequestsResult.value || []);
 } else {
 setApprovedMaterialRequests([]);
 }
 if (productsResult.status === "rejected" || agenciesResult.status === "rejected" || receiptsResult.status === "rejected") {
 setLoadError(t("app.warehouse.error.load"));
 }
 results.forEach((result) => {
 if (result.status === "rejected") {
 reportHandledApiError("Warehouse data request failed.", result.reason);
 }
 });
 setLastSyncedAt(new Date().toISOString());
 } catch (err: unknown) {
 if (!mounted) return;
 if (typeof err === "object" && err !== null && "status" in err && err.status === 401) {
 logout();
 router.replace("/");
 return;
 }
 setLoadError(t("app.warehouse.error.load"));
 reportHandledApiError("Warehouse data could not be loaded.", err);
 } finally {
 if (mounted) setLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [activeAgencyId, logout, reloadSeq, router, t, tenant]);

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
 // ignore
 }
 })();
 return () => {
 mounted = false;
 };
 }, [user?.email, user?.id]);

 const canOps = hasOrganizationAccess(
 {
 authorities: sessionRoles,
 memberRole: orgMember?.roleName,
 organization: tenant,
 user,
 },
 ["inventory:write"],
 );

 const agency = useMemo(() => agencies.find((a) => a.id === activeAgencyId) || null, [activeAgencyId, agencies]);
 const agencyType = (agency?.type || "").toUpperCase();

 const productById = useMemo(() => {
 const map = new Map<string, Product>();
 products.forEach((p) => {
 if (p.id) map.set(p.id, p);
 });
 return map;
 }, [products]);

 const categoryById = useMemo(() => {
 const map = new Map<string, ProductCategory>();
 categories.forEach((c) => {
 if (c.id) map.set(c.id, c);
 });
 return map;
 }, [categories]);

 const binFor = (agencyId: string, product: Product) => {
 const override = binMap?.[agencyId]?.[product.id || ""];
 if (override && ALL_BINS.includes(override)) return override;
 const seed = `${agencyId}|${product.categoryId || ""}|${product.sku || product.id || ""}`;
 return ALL_BINS[hashString(seed) % ALL_BINS.length];
 };

 const setBinForProduct = (agencyId: string, productId: string, bin: string, quantity?: number) => {
 if (!agencyId || !productId) return;
 if (!ALL_BINS.includes(bin)) return;
 const prevBin = binMap?.[agencyId]?.[productId];
 if (prevBin === bin) return;
 const persistedQuantity =
 typeof quantity === "number"
 ? quantity
 : levels.find((level) => level.agencyId === agencyId && level.productId === productId)?.quantity || 0;

 // Optimistic update (keeps the UI snappy).
 setBinMap((prev) => ({
 ...prev,
 [agencyId]: {
 ...(prev[agencyId] || {}),
 [productId]: bin,
 },
 }));

 (async () => {
 try {
 await SpareWarehousesService.upsertProductLocation(agencyId, productId, { binCode: bin, quantity: persistedQuantity, note: "Assigned in UI" });
 setProductLocations((prev) => {
 const withoutUpdatedProduct = prev.filter(
 (location) => !(location.agencyId === agencyId && location.productId === productId),
 );
 return [
 ...withoutUpdatedProduct,
 { agencyId, productId, binCode: bin, quantity: persistedQuantity, note: "Assigned in UI" },
 ];
 });
 } catch (err: unknown) {
 // Roll back if persistence fails.
 setBinMap((prev) => {
 const agencyMap = { ...(prev[agencyId] || {}) };
 if (prevBin) agencyMap[productId] = prevBin;
 else delete agencyMap[productId];
 return { ...prev, [agencyId]: agencyMap };
 });
 reportHandledApiError("Product location could not be saved.", err);
 }
 })();
 };

 const setRackCategory = (rack: string, categoryName: string) => {
 if (!activeAgencyId) return;
 const trimmedCategoryName = categoryName.trim();
 setRackCategories((prev) => {
 const next = { ...prev };
 if (trimmedCategoryName) next[rack] = trimmedCategoryName;
 else delete next[rack];
 void SpareWarehousesService.putLayout(
 activeAgencyId,
 warehouseLayoutPayload(activeAgencyId, next),
 ).catch((err: unknown) => {
 reportHandledApiError("Warehouse layout could not be saved.", err);
 });
 return next;
 });
 };

 const levelsByProductInAgency = useMemo(() => {
 const map = new Map<string, StockLevel>();
 (levels || [])
 .filter((l) => (activeAgencyId ? l.agencyId === activeAgencyId : true))
 .forEach((l) => {
 const pid = l.productId || "";
 if (!pid) return;
 // In theory one StockLevel per product per agency; keep last one if duplicates.
 map.set(pid, l);
 });
 return map;
 }, [activeAgencyId, levels]);

 const movementsInAgency = useMemo(() => {
 if (!activeAgencyId) return [];
 return (movements || [])
 .filter((m) => m.sourceAgencyId === activeAgencyId || m.destinationAgencyId === activeAgencyId)
 .slice()
 .sort((a, b) => new Date(b.date || b.validatedAt || 0).getTime() - new Date(a.date || a.validatedAt || 0).getTime());
 }, [activeAgencyId, movements]);

 const lastMoveByProduct = useMemo(() => {
 const map = new Map<string, string>();
 movementsInAgency.forEach((m) => {
 const raw = m.date || m.validatedAt;
 if (!raw) return;
 (m.items || []).forEach((it) => {
 const pid = it.productId || "";
 if (!pid) return;
 const existing = map.get(pid);
 if (!existing || new Date(raw).getTime() > new Date(existing).getTime()) map.set(pid, raw);
 });
 });
 return map;
 }, [movementsInAgency]);

 const stockStatusFor = (p: Product, qty: number): StockStatus => {
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : 0;
 if (qty <= 0) return "OUT";
 if (qty <= min) return "LOW";
 return "OK";
 };

 const filteredProducts = useMemo(() => {
 const needle = query.trim().toLowerCase();
 if (!needle) return products;
 return products.filter((p) => {
 const hay = `${p.sku || ""} ${p.name || ""} ${p.description || ""} ${p.categoryName || ""}`.toLowerCase();
 return hay.includes(needle);
 });
 }, [products, query]);

 const stockRows = useMemo(() => {
 if (!activeAgencyId) return [];
 return filteredProducts.map((p) => {
 const st = levelsByProductInAgency.get(p.id || "");
 const qty = st?.quantity ?? 0;
 const status = stockStatusFor(p, qty);
 const categoryName = p.categoryName || (p.categoryId ? categoryById.get(p.categoryId)?.name || "" : "");
 const lastMove = lastMoveByProduct.get(p.id || "") || "";
 const bin = p.id ? binFor(activeAgencyId, p) : "—";
 return {
 product: p,
 qty,
 status,
 categoryName,
 lastMove,
 updated: st?.lastUpdated || "",
 bin,
 };
 });
 }, [activeAgencyId, categoryById, filteredProducts, lastMoveByProduct, levelsByProductInAgency, binMap]);

 const sortedStockRows = useMemo(() => {
 const dir = sortDir === "asc" ? 1 : -1;
 const rows = [...stockRows];
 rows.sort((a, b) => {
 if (sortKey === "sku") return dir * String(a.product.sku || "").localeCompare(String(b.product.sku || ""));
 if (sortKey === "name") {
 const an = a.product.name || a.product.description || "";
 const bn = b.product.name || b.product.description || "";
 return dir * an.localeCompare(bn);
 }
 if (sortKey === "category") return dir * String(a.categoryName || "").localeCompare(String(b.categoryName || ""));
 if (sortKey === "qty") return dir * ((a.qty || 0) - (b.qty || 0));
 if (sortKey === "status") return dir * (statusRank(a.status) - statusRank(b.status));
 if (sortKey === "lastMove") return dir * (new Date(a.lastMove || 0).getTime() - new Date(b.lastMove || 0).getTime());
 if (sortKey === "updated") return dir * (new Date(a.updated || 0).getTime() - new Date(b.updated || 0).getTime());
 return 0;
 });
 return rows;
 }, [sortDir, sortKey, stockRows]);

 const totalPages = Math.max(1, Math.ceil(sortedStockRows.length / pageSize));
 const currentPage = Math.min(Math.max(1, page), totalPages);
 const pagedStockRows = useMemo(() => {
 const start = (currentPage - 1) * pageSize;
 return sortedStockRows.slice(start, start + pageSize);
 }, [currentPage, sortedStockRows]);

 useEffect(() => {
 setPage(1);
 }, [query, sortKey, sortDir, activeAgencyId]);

 const statusBadgeClass = (s: StockStatus) => {
 if (s === "OUT") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200";
 if (s === "LOW") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
 return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100";
 };

 const sortToggle = (key: SortKey) => {
 if (sortKey !== key) {
 setSortKey(key);
 setSortDir(key === "sku" || key === "name" || key === "category" ? "asc" : "desc");
 return;
 }
 setSortDir((d) => (d === "asc" ? "desc" : "asc"));
 };

 const selectedMovement = useMemo(() => {
 if (!selectedMovementId) return null;
 return movements.find((m) => m.id === selectedMovementId) || null;
 }, [movements, selectedMovementId]);

 const openMovement = (id?: string) => {
 if (!id) return;
 setSelectedMovementId(id);
 setMovementDrawerOpen(true);
 };

 const retryLoad = () => setReloadSeq((n) => n + 1);

 const openOpWizard = (kind: OpKind) => {
 setOpKind(kind);
 setOpStep(1);
 setOpSearch("");
 setOpProductId("");
 setOpQty(1);
 setOpNotes("");
 setOpDestAgencyId("");
 setOpIssueMode(kind === "OUT" && approvedMaterialRequests.length ? "REQUEST" : "MANUAL");
 setOpMaterialRequestId("");
 setOpMaterialRequestSearch("");
 setOpIssueBins({});
 setOpError("");
 if (kind === "IN") {
 setOpReceiptId("");
 setOpReceiptSearch("");
 setOpLineBins({});
 }
 setOpOpen(true);
 };

 const opCandidates = useMemo(() => {
 const needle = opSearch.trim().toLowerCase();
 if (!needle) return products.slice(0, 20);
 return products
 .filter((p) => {
 const hay = `${p.sku || ""} ${p.name || ""} ${p.description || ""}`.toLowerCase();
 return hay.includes(needle);
 })
 .slice(0, 30);
 }, [opSearch, products]);

 const opSelectedProduct = opProductId ? productById.get(opProductId) || null : null;

 const filteredReceipts = useMemo(() => {
 const needle = opReceiptSearch.trim().toLowerCase();
 const receipts = activeAgencyId ? allReceipts.filter((r) => r.agencyId === activeAgencyId) : allReceipts;
 if (!needle) return receipts;
 return receipts.filter((r) =>
 `${r.receiptNumber} ${r.poNumber} ${r.supplierName}`.toLowerCase().includes(needle)
 );
 }, [activeAgencyId, allReceipts, opReceiptSearch]);

 const selectedReceipt = opReceiptId ? allReceipts.find((r) => r.id === opReceiptId) || null : null;

 const materialItemRemainingQty = (item: MaterialRequestItemDto) =>
 Math.max(0, Number(item.quantityRequested || 0) - Number(item.quantityIssued || 0));

 const materialItemsToIssue = useCallback(
 (request: MaterialRequestDto | null) =>
 (request?.items || []).filter((item) => item.productId && materialItemRemainingQty(item) > 0),
 [],
 );

 const materialProductLabel = useCallback((productId?: string) => {
 if (!productId) return "—";
 const product = productById.get(productId);
 return product ? `${product.sku || "—"} — ${product.name || product.description || "—"}` : shortId(productId);
 }, [productById]);

 const materialRequestSummary = useCallback((request: MaterialRequestDto) => {
 const items = materialItemsToIssue(request);
 const units = items.reduce((sum, item) => sum + materialItemRemainingQty(item), 0);
 const firstProduct = materialProductLabel(items[0]?.productId);
 return `${shortId(request.id)} · ${firstProduct}${items.length > 1 ? ` +${items.length - 1}` : ""} · ${units} ${t("app.common.qty").toLowerCase()}`;
 }, [materialItemsToIssue, materialProductLabel, t]);

 const filteredApprovedRequests = useMemo(() => {
 const needle = opMaterialRequestSearch.trim().toLowerCase();
 const rows = (approvedMaterialRequests || []).filter((request) => materialItemsToIssue(request).length > 0);
 if (!needle) return rows;
 return rows.filter((request) => {
 const hay = [
 request.id,
 request.departmentId,
 request.requestedBy,
 request.reasonText,
 ...(request.items || []).map((item) => materialProductLabel(item.productId)),
 ].join(" ").toLowerCase();
 return hay.includes(needle);
 });
 }, [approvedMaterialRequests, materialItemsToIssue, materialProductLabel, opMaterialRequestSearch]);

 const selectedMaterialRequest = opMaterialRequestId
 ? approvedMaterialRequests.find((request) => request.id === opMaterialRequestId) || null
 : null;

 const defaultBinForMaterialItem = (item: MaterialRequestItemDto) => {
 if (!activeAgencyId || !item.productId) return ALL_BINS[0];
 const stockedLocation = productLocations.find(
 (location) =>
 location.agencyId === activeAgencyId &&
 location.productId === item.productId &&
 Number(location.quantity || 0) > 0 &&
 !!location.binCode,
 );
 if (stockedLocation?.binCode && ALL_BINS.includes(stockedLocation.binCode)) return stockedLocation.binCode;
 const product = productById.get(item.productId);
 return product ? binFor(activeAgencyId, product) : ALL_BINS[0];
 };

 const selectMaterialRequestForIssue = (request: MaterialRequestDto) => {
 const items = materialItemsToIssue(request);
 const nextBins: Record<string, string> = {};
 items.forEach((item) => {
 if (item.productId) nextBins[item.productId] = defaultBinForMaterialItem(item);
 });
 const firstItem = items[0];
 setOpMaterialRequestId(request.id || "");
 setOpIssueBins(nextBins);
 setOpProductId(firstItem?.productId || "");
 setOpQty(firstItem ? materialItemRemainingQty(firstItem) : 1);
 };

 const defaultBinForLine = (line: ReceiptLine) => {
 if (!activeAgencyId) return ALL_BINS[0];
 const product = productById.get(line.productId);
 return product ? binFor(activeAgencyId, product) : ALL_BINS[0];
 };

 const selectReceiptForPosting = (receipt: ReceiptRecord) => {
 const nextBins: Record<string, string> = {};
 receipt.lines
 .filter((line) => line.receivedQty > 0)
 .forEach((line) => {
 nextBins[line.id] = defaultBinForLine(line);
 });
 setOpReceiptId(receipt.id);
 setOpLineBins(nextBins);
 };

 const applyIssueBinQuantities = async (items: MaterialRequestItemDto[], note: string) => {
 if (!activeAgencyId) return false;
 const binEntryMap = new Map<string, { productId: string; binCode: string; quantity: number }>();
 items.forEach((item) => {
 const productId = item.productId || "";
 if (!productId) return;
 const binCode = opIssueBins[productId] || defaultBinForMaterialItem(item);
 const quantity = materialItemRemainingQty(item);
 if (!binCode || quantity <= 0) return;
 const key = `${productId}:${binCode.toLowerCase()}`;
 const existing = binEntryMap.get(key);
 binEntryMap.set(key, {
 productId,
 binCode,
 quantity: (existing?.quantity || 0) + quantity,
 });
 });

 const binEntries = Array.from(binEntryMap.values()).map((entry) => {
 const existingLocation = productLocations.find(
 (location) =>
 location.agencyId === activeAgencyId &&
 location.productId === entry.productId &&
 location.binCode?.toLowerCase() === entry.binCode.toLowerCase(),
 );
 return {
 ...entry,
 quantity: Math.max(0, Number(existingLocation?.quantity || 0) - entry.quantity),
 };
 });

 const results = await Promise.allSettled(
 binEntries.map((entry) =>
 SpareWarehousesService.upsertProductLocation(activeAgencyId, entry.productId, {
 binCode: entry.binCode,
 quantity: entry.quantity,
 note,
 })
 ),
 );
 const hasWarning = results.some((result) => result.status === "rejected");
 results.forEach((result) => {
 if (result.status === "rejected") {
 reportHandledApiError("Warehouse request issue bin update failed.", result.reason);
 }
 });
 setBinMap((prev) => ({
 ...prev,
 [activeAgencyId]: {
 ...(prev[activeAgencyId] || {}),
 ...Object.fromEntries(binEntries.map((entry) => [entry.productId, entry.binCode])),
 },
 }));
 setProductLocations((prev) => {
 const withoutUpdated = prev.filter(
 (location) =>
 !binEntries.some(
 (entry) =>
 location.agencyId === activeAgencyId &&
 location.productId === entry.productId &&
 location.binCode?.toLowerCase() === entry.binCode.toLowerCase(),
 ),
 );
 return [
 ...withoutUpdated,
 ...binEntries.map((entry) => ({
 agencyId: activeAgencyId,
 productId: entry.productId,
 binCode: entry.binCode,
 quantity: entry.quantity,
 note,
 })),
 ];
 });
 return hasWarning;
 };

 const runOperation = async () => {
 if (!activeAgencyId) return;
 setOpError("");
 setOpBusy(true);
 try {
 let focusQuery = "";
 let focusBin: string | null = null;
 let receiptBinWarning = false;
 let requestIssueBinWarning = false;
 if (opKind === "IN") {
 if (!selectedReceipt) return;
 const lines = selectedReceipt.lines.filter((l) => l.receivedQty > 0);
 if (!lines.length) return;
 const firstLine = lines[0];
 focusQuery = firstLine.sku || firstLine.productName || "";
 const product = productById.get(firstLine.productId);
 focusBin = product ? binFor(activeAgencyId, product) : null;

 await ReceiptsService.postToStock(selectedReceipt.id);
 const binEntryMap = new Map<string, { productId: string; binCode: string; quantity: number }>();
 lines.forEach((line) => {
 const productId = line.productId;
 const binCode = opLineBins[line.id] || defaultBinForLine(line);
 if (!productId || !binCode) return;
 const key = `${productId}:${binCode.toLowerCase()}`;
 const existingLocation = productLocations.find(
 (location) =>
 location.agencyId === activeAgencyId &&
 location.productId === productId &&
 location.binCode?.toLowerCase() === binCode.toLowerCase(),
 );
 const currentQuantity = Number(existingLocation?.quantity || 0);
 const existingEntry = binEntryMap.get(key);
 binEntryMap.set(key, {
 productId,
 binCode,
 quantity: (existingEntry?.quantity ?? currentQuantity) + line.receivedQty,
 });
 });
 const binEntries = Array.from(binEntryMap.values());
 const binResults = await Promise.allSettled(
 binEntries.map((entry) =>
 SpareWarehousesService.upsertProductLocation(activeAgencyId, entry.productId, {
 binCode: entry.binCode,
 quantity: entry.quantity,
 note: selectedReceipt.receiptNumber,
 })
 ),
 );
 receiptBinWarning = binResults.some((result) => result.status === "rejected");
 binResults.forEach((result) => {
 if (result.status === "rejected") {
 reportHandledApiError("Warehouse receipt bin assignment failed.", result.reason);
 }
 });
 setBinMap((prev) => ({
 ...prev,
 [activeAgencyId]: {
 ...(prev[activeAgencyId] || {}),
 ...Object.fromEntries(binEntries.map((entry) => [entry.productId, entry.binCode])),
 },
 }));
 setProductLocations((prev) => {
 const withoutUpdated = prev.filter(
 (location) =>
 !binEntries.some(
 (entry) =>
 location.agencyId === activeAgencyId &&
 location.productId === entry.productId &&
 location.binCode?.toLowerCase() === entry.binCode.toLowerCase(),
 ),
 );
 return [
 ...withoutUpdated,
 ...binEntries.map((entry) => ({
 agencyId: activeAgencyId,
 productId: entry.productId,
 binCode: entry.binCode,
 quantity: entry.quantity,
 note: selectedReceipt.receiptNumber,
 })),
 ];
 });
 setAllReceipts((prev) => prev.filter((receipt) => receipt.id !== selectedReceipt.id));
 } else {
 if (opKind === "OUT" && opIssueMode === "REQUEST") {
 if (!selectedMaterialRequest?.id) return;
 const requestItems = materialItemsToIssue(selectedMaterialRequest);
 if (!requestItems.length) return;
 const firstProductId = requestItems[0]?.productId || "";
 const firstProduct = firstProductId ? productById.get(firstProductId) : null;
 focusQuery = firstProduct?.sku || firstProduct?.name || firstProduct?.description || "";
 focusBin = requestItems[0] ? opIssueBins[firstProductId] || defaultBinForMaterialItem(requestItems[0]) : null;
 const note = opNotes?.trim() || `${t("app.warehouse.ops.issueRequest.note")} ${shortId(selectedMaterialRequest.id)}`;
 const body: CreateMovementRequest = {
 type: "OUT",
 sourceAgencyId: activeAgencyId,
 items: requestItems.map((item) => ({
 productId: item.productId || "",
 quantity: materialItemRemainingQty(item),
 })),
 notes: note,
 };
 const draft = await StockMovementsService.createDraft(body);
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 await MaterialOperationsControllerService.issue(selectedMaterialRequest.id, {
 items: requestItems.map((item) => ({
 productId: item.productId || "",
 quantity: materialItemRemainingQty(item),
 note: opIssueBins[item.productId || ""] || undefined,
 })),
 note,
 });
 requestIssueBinWarning = await applyIssueBinQuantities(requestItems, note);
 setApprovedMaterialRequests((prev) => prev.filter((request) => request.id !== selectedMaterialRequest.id));
 } else {
 if (!opProductId || opQty <= 0) return;
 if (opKind === "TRANSFER" && (!opDestAgencyId || opDestAgencyId === activeAgencyId)) return;
 const product = productById.get(opProductId);
 focusQuery = product?.sku || product?.name || product?.description || "";
 focusBin = product ? binFor(activeAgencyId, product) : null;
 const body: CreateMovementRequest =
 opKind === "OUT"
 ? {
 type: "OUT",
 sourceAgencyId: activeAgencyId,
 items: [{ productId: opProductId, quantity: opQty }],
 notes: opNotes?.trim() || t("app.warehouse.ops.notes.default"),
 }
 : {
 type: "TRANSFER",
 sourceAgencyId: activeAgencyId,
 destinationAgencyId: opDestAgencyId,
 items: [{ productId: opProductId, quantity: opQty }],
 notes: opNotes?.trim() || t("app.warehouse.ops.notes.default"),
 };
 const draft = await StockMovementsService.createDraft(body);
 if (draft?.id) await StockMovementsService.validateMovement(draft.id);
 }
 }

 const [levelsResult, movementsResult, receiptsResult, materialRequestsResult] = await Promise.allSettled([
 StockLevelsService.getStockLevels(),
 StockMovementsService.getAllMovements(),
 ReceiptsService.list(),
 MaterialOperationsControllerService.listMaterialRequests(activeAgencyId || undefined, undefined, "APPROVED"),
 ]);
 if (levelsResult.status === "fulfilled") setLevels(levelsResult.value || []);
 if (movementsResult.status === "fulfilled") setMovements(movementsResult.value || []);
 if (receiptsResult.status === "fulfilled") {
 setAllReceipts((receiptsResult.value || []).map(fromApiReceipt).filter((receipt) => receipt.status !== "REJECTED" && !receipt.stockPosted));
 }
 if (materialRequestsResult.status === "fulfilled") setApprovedMaterialRequests(materialRequestsResult.value || []);
 setLastSyncedAt(new Date().toISOString());
 if (focusQuery) setQuery(focusQuery);
 if (focusBin) setSelectedBin(focusBin);
 setTab("STOCK");
 setOpOpen(false);
 setOpSuccess({
 title: t("app.warehouse.ops.feedback.successTitle"),
 message: opKind === "IN"
 ? receiptBinWarning
 ? t("app.warehouse.ops.feedback.receiptPostedBinWarning")
 : t("app.warehouse.ops.feedback.receiptPostedWithBins")
 : opKind === "OUT" && opIssueMode === "REQUEST"
 ? requestIssueBinWarning
 ? t("app.warehouse.ops.feedback.requestIssuedBinWarning")
 : t("app.warehouse.ops.feedback.requestIssued")
 : t("app.warehouse.ops.feedback.operationPosted"),
 });
 } catch (err: unknown) {
 const apiMessage = getApiErrorMessage(err);
 setOpError(apiMessage ? `${t("app.warehouse.ops.feedback.failed")} ${apiMessage}` : t("app.warehouse.ops.feedback.failed"));
 reportHandledApiError("Warehouse operation failed.", err);
 } finally {
 setOpBusy(false);
 }
 };

 // ------------------------ MAP ------------------------
 const mapLevels = useMemo(() => {
 if (!activeAgencyId) return [];
 return levels.filter((l) => l.agencyId === activeAgencyId);
 }, [activeAgencyId, levels]);

 const locationsByProductInAgency = useMemo(() => {
 const map = new Map<string, ProductLocation[]>();
 if (!activeAgencyId) return map;
 productLocations
 .filter((location) => location.agencyId === activeAgencyId && !!location.productId)
 .forEach((location) => {
 const productId = location.productId || "";
 const rows = map.get(productId) || [];
 rows.push(location);
 map.set(productId, rows);
 });
 map.forEach((rows) => rows.sort((a, b) => String(a.binCode || "").localeCompare(String(b.binCode || ""))));
 return map;
 }, [activeAgencyId, productLocations]);

 const binsAgg = useMemo(() => {
 const agg: Record<string, { qty: number; low: number; items: BinStockItem[] }> = {};
 ALL_BINS.forEach((b) => (agg[b] = { qty: 0, low: 0, items: [] }));
 if (!activeAgencyId) return agg;

 mapLevels.forEach((l) => {
 const pid = l.productId || "";
 if (!pid) return;
 const p = productById.get(pid);
 if (!p) return;
 const totalQty = l.quantity || 0;
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : 0;
 const locations = (locationsByProductInAgency.get(pid) || []).filter((location) => Number(location.quantity || 0) > 0);
 if (!locations.length) {
 const bin = binFor(activeAgencyId, p);
 agg[bin].qty += totalQty;
 if (totalQty <= min) agg[bin].low += 1;
 agg[bin].items.push({ product: p, level: l, binCode: bin, quantity: totalQty });
 return;
 }
 let assignedQty = 0;
 locations.forEach((location) => {
 const bin = ALL_BINS.includes(location.binCode) ? location.binCode : binFor(activeAgencyId, p);
 const quantity = Number(location.quantity || 0);
 assignedQty += quantity;
 agg[bin].qty += quantity;
 if (totalQty <= min) agg[bin].low += 1;
 agg[bin].items.push({ product: p, level: l, binCode: bin, quantity });
 });
 const remainingQty = Math.max(0, totalQty - assignedQty);
 if (remainingQty > 0) {
 const bin = binFor(activeAgencyId, p);
 agg[bin].qty += remainingQty;
 agg[bin].items.push({ product: p, level: l, binCode: bin, quantity: remainingQty, unassigned: true });
 }
 });
 Object.values(agg).forEach((b) => b.items.sort((a, b2) => b2.quantity - a.quantity));
 return agg;
 }, [activeAgencyId, binMap, locationsByProductInAgency, mapLevels, productById]);

 const mapStats = useMemo(() => ({
   occupied: ALL_BINS.filter((b) => binsAgg[b].qty > 0).length,
   low: ALL_BINS.filter((b) => binsAgg[b].low > 0).length,
   empty: ALL_BINS.filter((b) => binsAgg[b].qty === 0).length,
 }), [binsAgg]);

 const mapBins = useMemo(
 () =>
 ALL_BINS.map((code) => ({
 code,
 itemCount: binsAgg[code].items.length,
 lowCount: binsAgg[code].low,
 quantity: binsAgg[code].qty,
 })),
 [binsAgg],
 );

 const selectedBinItems = useMemo(() => {
 if (!selectedBin) return [];
 return binsAgg[selectedBin]?.items || [];
 }, [binsAgg, selectedBin]);
 const selectedBinPosition = selectedBin
 ? getWarehouseBinPosition(selectedBin)
 : null;

 const mapSearchResult = useMemo(() => {
 const needle = mapSearch.trim().toLowerCase();
 if (!needle || !activeAgencyId) return null;
 const match = mapLevels
 .map((l) => ({ level: l, product: l.productId ? productById.get(l.productId) || null : null }))
 .filter((x) => x.product)
 .find((x) => {
 const p = x.product as Product;
 const hay = `${p.sku || ""} ${p.name || ""} ${p.description || ""}`.toLowerCase();
 return hay.includes(needle);
 });
 if (!match) return null;
 const p = match.product as Product;
 const locationBin = p.id
 ? (locationsByProductInAgency.get(p.id) || []).find((location) => Number(location.quantity || 0) > 0)?.binCode
 : null;
 const bin = locationBin && ALL_BINS.includes(locationBin) ? locationBin : binFor(activeAgencyId, p);
 return { product: p, bin };
 }, [activeAgencyId, mapLevels, mapSearch, productById, binMap, locationsByProductInAgency]);

 useEffect(() => {
 if (!mapSearchResult) return;
 setSelectedBin(mapSearchResult.bin);
 }, [mapSearchResult?.bin]);

 useEffect(() => {
 if (!selectedBin) return;
 const el = binDetailsRef.current;
 if (!el) return;
 // On small screens the details panel is below the map; auto-scroll so users don't miss it.
 if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
 el.scrollIntoView({ behavior: "smooth", block: "start" });
 }
 }, [selectedBin]);

 const agencyTypeLabel = () => {
 if (agencyType === "HQ" || agency?.isHeadquarter) return t("app.warehouse.context.type.hq");
 if (agencyType === "WAREHOUSE") return t("app.warehouse.context.type.warehouse");
 if (agencyType === "POS") return t("app.warehouse.context.type.pos");
 return agencyType || "—";
 };

 return (
 <div className="ys-page">
 <div className="ys-page-header">
 <div className="flex items-center justify-between gap-4">
 <div>
 <h2 className="ys-page-title">{t("app.warehouse.title")}</h2>
 <p className="ys-page-subtitle">{t("app.warehouse.subtitle")}</p>
 </div>
 <div className="text-xs text-muted-foreground">
 {t("app.warehouse.synced")}{" "}
 <span className="font-medium text-foreground ">{formatDate(lastSyncedAt || undefined)}</span>
 </div>
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex flex-wrap items-center gap-3">
 <div className="ys-section-title">
 {t("app.warehouse.context.title")}
 </div>
 <div className="text-sm text-foreground ">
                <span className="text-muted-foreground">{t("app.warehouse.context.agency")}: </span>
 <span className="font-semibold">{agency?.name || (activeAgencyId ? activeAgencyId : t("app.warehouse.context.noAgency"))}</span>
 </div>
 {activeAgencyId && (
                <span className="inline-flex items-center rounded-xl border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground">
 {agencyTypeLabel()}
 </span>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <label className="ys-filter-label">
 {t("app.warehouse.context.select")}
 <select
 value={activeAgencyId || ""}
 onChange={(e) => setActiveAgencyId(e.target.value || null)}
 className="ys-input ml-2 h-10 min-w-[220px] text-sm font-medium"
 >
 <option value="">{t("app.warehouse.context.select.placeholder")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id || ""}>
 {a.name || a.id}
 </option>
 ))}
 </select>
 </label>

 <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("OPS")}
                  className={`ys-tab ${
                    tab === "OPS"
                      ? "ys-tab-active"
                      : ""
                  }`}
                >
 {t("app.warehouse.tab.ops")}
 </button>
                <button
                  type="button"
                  onClick={() => setTab("STOCK")}
                  className={`ys-tab ${
                    tab === "STOCK"
                      ? "ys-tab-active"
                      : ""
                  }`}
                >
 {t("app.warehouse.tab.stock")}
 </button>
                <button
                  type="button"
                  onClick={() => setTab("MAP")}
                  className={`ys-tab ${
                    tab === "MAP"
                      ? "ys-tab-active"
                      : ""
                  }`}
                >
 {t("app.warehouse.tab.map")}
 </button>
 </div>
 </div>
 </div>

 {!activeAgencyId && (
 <div className="mt-3 ys-alert-warning">
 {t("app.warehouse.context.required")}
 </div>
 )}
 </div>

 {loadError && (
 <div className="ys-alert-warning">
 <div className="flex items-center justify-between gap-4">
 <div>{loadError}</div>
 <button
 type="button"
 onClick={retryLoad}
 className="ys-btn-secondary text-xs"
 >
 {t("app.warehouse.error.retry")}
 </button>
 </div>
 </div>
 )}

 {loading ? (
 <div className="text-sm text-muted-foreground">{t("app.warehouse.loading")}</div>
 ) : !activeAgencyId ? (
 <div className="ys-card p-8 text-sm text-muted-foreground">
 {t("app.warehouse.context.empty")}
 </div>
 ) : tab === "OPS" ? (
 <div className="ys-page">
 <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
 <button
 type="button"
 onClick={() => openOpWizard("IN")}
 disabled={!canOps}
 className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-900 dark:bg-blue-950/40"
 >
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="ys-section-title text-blue-700">
 {t("app.warehouse.ops.receive")}
 </div>
 <div className="mt-2 text-sm text-foreground ">{t("app.warehouse.ops.receive.help")}</div>
 </div>
 <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 bg-card text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 5v14M5 12h14" strokeLinecap="round" />
 </svg>
 </div>
 </div>
 </button>

 <button
 type="button"
 onClick={() => openOpWizard("OUT")}
 disabled={!canOps}
 className="rounded-2xl border border-red-200 bg-red-50/60 p-5 text-left transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/30"
 >
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="ys-section-title text-red-700">
 {t("app.warehouse.ops.ship")}
 </div>
 <div className="mt-2 text-sm text-foreground ">{t("app.warehouse.ops.ship.help")}</div>
 </div>
 <div className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 bg-card text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 19V5M5 12h14" strokeLinecap="round" />
 </svg>
 </div>
 </div>
 </button>

 <button
 type="button"
 onClick={() => openOpWizard("TRANSFER")}
 disabled={!canOps}
 className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60 dark:border-violet-900 dark:bg-violet-950/40"
 >
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="ys-section-title text-violet-700">
 {t("app.warehouse.ops.transfer")}
 </div>
 <div className="mt-2 text-sm text-foreground ">{t("app.warehouse.ops.transfer.help")}</div>
 </div>
 <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-200 bg-card text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200">
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M7 7h10M7 7l3-3M7 7l3 3" strokeLinecap="round" />
 <path d="M17 17H7m10 0-3-3m3 3-3 3" strokeLinecap="round" />
 </svg>
 </div>
 </div>
 </button>
 </section>

 {!canOps && (
 <div className="ys-card p-4 text-sm text-muted-foreground">
 {t("app.warehouse.ops.readOnly")}
 </div>
 )}

 <section className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div>
 <div className="ys-section-title">
 {t("app.warehouse.activity.title")}
 </div>
 <div className="mt-1 text-sm text-muted-foreground ">{t("app.warehouse.activity.subtitle")}</div>
 </div>
 <button
 type="button"
 onClick={() => setTab("STOCK")}
 className="ys-btn-secondary px-3 py-1.5 text-xs"
 >
 {t("app.warehouse.activity.openStock")}
 </button>
 </div>

 <div className="mt-4 space-y-2">
 {movementsInAgency.slice(0, 6).map((m) => (
 <button
 key={m.id}
 type="button"
 onClick={() => openMovement(m.id)}
 className="flex w-full items-center justify-between gap-4 rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40"
 >
 <div>
 <div className="font-medium text-foreground ">{m.reference || m.id}</div>
 <div className="text-xs text-muted-foreground">
 {m.type || "—"} · {m.status || "—"}
 </div>
 </div>
 <div className="text-xs text-muted-foreground">{formatDate(m.date || m.validatedAt)}</div>
 </button>
 ))}
 {!movementsInAgency.length && <div className="text-sm text-muted-foreground">{t("app.warehouse.activity.empty")}</div>}
 </div>
 </section>
 </div>
 ) : tab === "STOCK" ? (
 <div className="ys-page">
 <section className="ys-card p-4">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="ys-section-title">
 {t("app.warehouse.stock.title")}
 </div>
 <div className="mt-1 text-sm text-muted-foreground ">{t("app.warehouse.stock.subtitle")}</div>
 </div>
 <div className="flex flex-col gap-2 lg:items-end">
 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.warehouse.stock.search")}
 <input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder={t("app.warehouse.stock.searchPlaceholder")}
 className="ys-input mt-1 w-full max-w-xl"
 />
 </label>
 </div>
 </div>
 </section>

 <section className="ys-card p-4">
 <div className="flex items-center justify-between gap-3">
 <div className="text-xs text-muted-foreground ">
 {t("app.warehouse.stock.pagination", { page: currentPage, total: totalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={currentPage <= 1}
 className="ys-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
 >
 {t("app.warehouse.stock.prev")}
 </button>
 <button
 type="button"
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={currentPage >= totalPages}
 className="ys-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
 >
 {t("app.warehouse.stock.next")}
 </button>
 </div>
 </div>

 <div className="mt-4 ys-table-wrap">
 <table className="ys-table">
 <thead>
 <tr className="ys-table-head">
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("sku")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.sku")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("name")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.part")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("category")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.category")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("qty")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.qty")}
 </button>
 </th>
 <th className="py-2 pr-4">{t("app.warehouse.stock.table.min")}</th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("status")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.status")}
 </button>
 </th>
 <th className="py-2 pr-4">{t("app.warehouse.stock.table.bin")}</th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("lastMove")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.lastMove")}
 </button>
 </th>
 <th className="py-2 pr-4">
 <button type="button" onClick={() => sortToggle("updated")} className="hover:text-foreground dark:hover:text-slate-200">
 {t("app.warehouse.stock.table.updated")}
 </button>
 </th>
 <th className="py-2 text-right">{t("app.warehouse.stock.table.actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {pagedStockRows.map((r) => {
 const p = r.product;
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : undefined;
 return (
 <tr key={p.id} className="ys-table-row">
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
 <div className="font-medium text-foreground ">{p.name || p.description || "—"}</div>
 <div className="truncate text-xs text-muted-foreground">{p.description || ""}</div>
 </div>
 </div>
 </td>
                        <td className="ys-table-cell text-muted-foreground">{r.categoryName || "—"}</td>
                        <td className="ys-table-cell font-semibold">{r.qty}</td>
                        <td className="ys-table-cell text-muted-foreground">{min ?? "—"}</td>
 <td className="ys-table-cell">
 <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${statusBadgeClass(r.status)}`}>
 {r.status === "OK"
 ? t("app.warehouse.stock.status.ok")
 : r.status === "LOW"
 ? t("app.warehouse.stock.status.low")
 : t("app.warehouse.stock.status.out")}
 </span>
 </td>
 <td className="ys-table-cell">
 <select
 value={r.bin}
 onChange={(e) => setBinForProduct(activeAgencyId, p.id || "", e.target.value, r.qty)}
 className="ys-input px-2 py-1 text-xs font-semibold"
 >
 {ALL_BINS.map((b) => (
 <option key={b} value={b}>
 {b}
 </option>
 ))}
 </select>
 </td>
                        <td className="ys-table-cell text-muted-foreground">{formatDate(r.lastMove || undefined)}</td>
                        <td className="ys-table-cell text-muted-foreground">{formatDate(r.updated || undefined)}</td>
 <td className="ys-table-cell text-right">
 <div className="inline-flex items-center gap-2">
 <Link
 href={`/app/inventory/${p.id}`}
 className="ys-btn-secondary px-3 py-1.5 text-xs text-primary hover:border-primary/40"
 >
 {t("app.warehouse.stock.actions.open")}
 </Link>
 </div>
 </td>
 </tr>
 );
 })}
 {!pagedStockRows.length && (
 <tr>
 <td colSpan={10} className="py-10 text-center text-sm text-muted-foreground dark:text-muted-foreground">
 {t("app.warehouse.stock.empty")}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </section>
 </div>
 ) : (
 <div className="space-y-4">
     {/* Stats bar */}
     <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
       <div className="ys-card px-4 py-3">
         <div className="text-2xl font-bold text-foreground">{ALL_BINS.length}</div>
         <div className="mt-0.5 text-xs text-muted-foreground">{t("app.warehouse.map.stat.total")}</div>
       </div>
       <div className="ys-card px-4 py-3">
         <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mapStats.occupied}</div>
         <div className="mt-0.5 text-xs text-muted-foreground">{t("app.warehouse.map.stat.occupied")}</div>
       </div>
       <div className="ys-card px-4 py-3">
         <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{mapStats.low}</div>
         <div className="mt-0.5 text-xs text-muted-foreground">{t("app.warehouse.map.stat.low")}</div>
       </div>
       <div className="ys-card px-4 py-3">
         <div className="text-2xl font-bold text-slate-400">{mapStats.empty}</div>
         <div className="mt-0.5 text-xs text-muted-foreground">{t("app.warehouse.map.stat.empty")}</div>
       </div>
     </div>

     <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
       {/* Map panel */}
       <section className="min-w-0 overflow-hidden border-y border-border bg-card lg:border-l">
         {/* Toolbar */}
         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
           <div>
             <div className="font-semibold text-foreground">{t("app.warehouse.map.title")}</div>
             <div className="text-xs text-muted-foreground">{t("app.warehouse.map.subtitle")}</div>
           </div>
           <div className="flex flex-wrap items-center gap-2">
             <input
               type="search"
               value={mapSearch}
               onChange={(e) => setMapSearch(e.target.value)}
               placeholder={t("app.warehouse.map.searchPlaceholder")}
               className="ys-input h-8 w-44 text-xs"
             />
             <select
               value={heatmapMode}
               onChange={(e) => setHeatmapMode(e.target.value as HeatmapMode)}
               className="ys-input h-8 text-xs"
             >
               <option value="qty">{t("app.warehouse.map.heatmap.qty")}</option>
               <option value="low">{t("app.warehouse.map.heatmap.low")}</option>
             </select>
             <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
               {t("app.warehouse.map.rackCategory.rack")}
               <select
                 value={rackCategoryRack}
                 onChange={(e) => setRackCategoryRack(e.target.value)}
                 className="ys-input h-8 w-16 text-xs"
               >
                 {WAREHOUSE_BIN_ROWS.map((rack) => (
                   <option key={rack} value={rack}>
                     {rack}
                   </option>
                 ))}
               </select>
             </label>
             <select
               value={rackCategories[rackCategoryRack] || ""}
               onChange={(e) => setRackCategory(rackCategoryRack, e.target.value)}
               disabled={!canOps}
               className="ys-input h-8 min-w-40 text-xs"
               aria-label={t("app.warehouse.map.rackCategory.category")}
             >
               <option value="">{t("app.warehouse.map.rackCategory.unassigned")}</option>
               {categories.map((category) => {
                 const label = category.name || category.code || category.id || "";
                 return label ? (
                   <option key={category.id || label} value={label}>
                     {label}
                   </option>
                 ) : null;
               })}
             </select>
           </div>
         </div>

         <Warehouse3DMap
           bins={mapBins}
           heatmapMode={heatmapMode}
           rackCategories={rackCategories}
           selectedBin={selectedBin}
           onSelectBin={(bin) => setSelectedBin(bin)}
         />
       </section>

       {/* Details panel */}
       <section ref={binDetailsRef} className="ys-card flex max-h-[760px] flex-col overflow-hidden lg:sticky lg:top-20">
         <div className="border-b border-border px-5 py-4">
           <div className="flex items-start justify-between gap-2">
             <div>
               <div className="flex items-center gap-2">
                 {selectedBin && (
                   <span className="rounded-sm bg-blue-100 px-2 py-0.5 font-mono text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                     {selectedBin}
                   </span>
                 )}
                 <span className="font-semibold text-foreground">{t("app.warehouse.map.binDetails")}</span>
               </div>
               {selectedBin && (
                 <div className="mt-1 text-xs text-muted-foreground">
                   {t("app.warehouse.map.binDetails.count", { count: selectedBinItems.length })}
                 </div>
               )}
             </div>
             <button
               type="button"
               onClick={() => setIsEditingBins((v) => !v)}
               disabled={!selectedBin}
               className="ys-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
             >
               {isEditingBins ? t("app.warehouse.map.edit.done") : t("app.warehouse.map.edit")}
             </button>
           </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4">
           {!selectedBin ? (
             <div className="flex h-full flex-col items-center justify-center py-10 text-center">
               <svg viewBox="0 0 24 24" className="mb-3 h-10 w-10 text-muted-foreground/25" fill="none" stroke="currentColor" strokeWidth="1.2">
                 <rect x="2" y="7" width="20" height="14" rx="2" />
                 <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                 <path d="M12 12v4M10 14h4" strokeLinecap="round" />
               </svg>
               <div className="text-sm text-muted-foreground">{t("app.warehouse.map.binDetails.pick")}</div>
             </div>
           ) : !selectedBinItems.length ? (
             <div>
               {selectedBinPosition && (
                 <div className="mb-4 grid grid-cols-2 gap-2">
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.aisle")}</div>
                     <div className="mt-1 font-semibold">{selectedBinPosition.aisle}</div>
                   </div>
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.rack")}</div>
                     <div className="mt-1 font-semibold">{selectedBinPosition.rack}</div>
                   </div>
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.bay")}</div>
                     <div className="mt-1 font-semibold">{String(selectedBinPosition.bay).padStart(2, "0")}</div>
                   </div>
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.level")}</div>
                     <div className="mt-1 font-semibold">{selectedBinPosition.level}</div>
                   </div>
                 </div>
               )}
               <div className="py-8 text-center text-sm text-muted-foreground">{t("app.warehouse.map.binDetails.none")}</div>
             </div>
           ) : (
             <div className="space-y-3">
               {selectedBinPosition && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.aisle")}</div>
                     <div className="mt-1 font-semibold">{selectedBinPosition.aisle}</div>
                   </div>
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.rack")}</div>
                     <div className="mt-1 font-semibold">{selectedBinPosition.rack}</div>
                   </div>
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.bay")}</div>
                     <div className="mt-1 font-semibold">{String(selectedBinPosition.bay).padStart(2, "0")}</div>
                   </div>
                   <div className="rounded-md border border-border bg-muted/30 p-3">
                     <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.warehouse.map.position.level")}</div>
                     <div className="mt-1 font-semibold">{selectedBinPosition.level}</div>
                   </div>
                 </div>
               )}
               {selectedBinItems.map(({ product, level, binCode, quantity, unassigned }) => {
                 const derivedBin = binCode || binFor(activeAgencyId, product);
                 const cat = product.categoryName || (product.categoryId ? categoryById.get(product.categoryId)?.name : "") || "—";
                 const qty = quantity ?? level.quantity ?? 0;
                 const min = typeof product.minStockLevel === "number" ? product.minStockLevel : 0;
                 const stockColor = qty <= 0 ? "#ef4444" : qty <= min ? "#f59e0b" : "#10b981";
                 const stockPct = min > 0 ? Math.min(100, Math.round((qty / (min * 2)) * 100)) : qty > 0 ? 65 : 0;
                 return (
                   <div key={product.id} className="rounded-md border border-border bg-card p-3">
                     <div className="flex items-start justify-between gap-3">
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
                         <div className="truncate text-sm font-medium text-foreground">{product.name || product.description || product.sku || "—"}</div>
                         <div className="mt-0.5 text-xs text-muted-foreground">{product.sku || "—"} · {cat}</div>
                         {unassigned && <div className="mt-1 text-[11px] font-semibold text-amber-600">{t("app.part.binAllocation.unassigned")}</div>}
                       </div>
                       </div>
                       <div className="shrink-0 text-right">
                         <div className="text-xl font-bold" style={{ color: stockColor }}>{qty}</div>
                         {min > 0 && <div className="text-[10px] text-muted-foreground">min {min}</div>}
                       </div>
                     </div>
                     <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                       <div className="h-full rounded-full transition-all" style={{ width: `${stockPct}%`, background: stockColor }} />
                     </div>
                     <div className="mt-2.5 flex items-center justify-between gap-2">
                       <Link href={`/app/inventory/${product.id}`} className="text-xs font-semibold text-blue-600 underline underline-offset-4 dark:text-blue-400">
                         {t("app.warehouse.map.openPart")}
                       </Link>
                       {isEditingBins && !(locationsByProductInAgency.get(product.id || "") || []).length ? (
                         <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                           {t("app.warehouse.map.assignBin")}
                           <select
                             value={derivedBin}
                             onChange={(e) => setBinForProduct(activeAgencyId, product.id || "", e.target.value, qty)}
                             className="ys-input px-1.5 py-0.5 text-xs"
                           >
                             {ALL_BINS.map((b) => <option key={b} value={b}>{b}</option>)}
                           </select>
                         </label>
                       ) : (
                         <div className="text-xs text-muted-foreground">
                           {t("app.warehouse.map.bin")}: <span className="font-semibold text-foreground">{derivedBin}</span>
                         </div>
                       )}
                     </div>
                     {selectedBinPosition && (
                       <div className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                         {t("app.warehouse.map.position.path", {
                           aisle: selectedBinPosition.aisle,
                           rack: selectedBinPosition.rack,
                           bay: String(selectedBinPosition.bay).padStart(2, "0"),
                           level: selectedBinPosition.level,
                         })}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
         </div>
       </section>
     </div>
 </div>
 )}

 <Modal open={opOpen} title={t("app.warehouse.ops.wizard.title")} onClose={() => setOpOpen(false)}>
 <div className="mb-4 flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {opKind === "IN"
 ? t("app.warehouse.ops.receive")
 : opKind === "OUT"
 ? t("app.warehouse.ops.ship")
 : t("app.warehouse.ops.transfer")}
 </div>
 <div className="text-xs text-muted-foreground">{t("app.warehouse.ops.wizard.step", { step: opStep })}</div>
 </div>

 {opError && (
 <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
 {opError}
 </div>
 )}

 {opKind === "IN" ? (
 opStep === 1 ? (
 /* ── Step 1: Select receipt ──────────────────── */
 <div className="space-y-3">
 <div className="text-xs text-muted-foreground">{t("app.warehouse.ops.wizard.receipt.select")}</div>
 <input
 value={opReceiptSearch}
 onChange={(e) => setOpReceiptSearch(e.target.value)}
 placeholder={t("app.warehouse.ops.wizard.receipt.search")}
 className="ys-input"
 />
 <div className="max-h-64 space-y-2 overflow-y-auto">
 {filteredReceipts.map((r) => (
 <button
 key={r.id}
 type="button"
 onClick={() => selectReceiptForPosting(r)}
 className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
 opReceiptId === r.id
 ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
 : "border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800/40"
 }`}
 >
 <div className="flex items-center justify-between gap-3">
 <div>
 <div className="font-semibold text-foreground">{r.receiptNumber}</div>
 <div className="text-xs text-muted-foreground">{r.supplierName} · PO {r.poNumber}</div>
 </div>
 <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${r.status === "COMPLETE" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"}`}>
 {r.status}
 </span>
 </div>
 <div className="mt-1 text-[11px] text-muted-foreground">{r.lines.length} line(s) · {formatDate(r.receivedAt)}</div>
 </button>
 ))}
 {!filteredReceipts.length && (
 <div className="py-6 text-center text-sm text-muted-foreground">{t("app.warehouse.ops.wizard.receipt.empty")}</div>
 )}
 </div>
 </div>
 ) : opStep === 2 ? (
 /* ── Step 2: Review receipt lines ─────────────── */
 <div className="space-y-3">
 <div className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs font-semibold text-muted-foreground dark:bg-slate-800/40">
 {selectedReceipt?.receiptNumber} · {selectedReceipt?.supplierName} · PO {selectedReceipt?.poNumber}
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-border text-left text-muted-foreground">
 <th className="pb-1.5 pr-3 font-semibold">SKU / Part</th>
 <th className="pb-1.5 pr-3 font-semibold text-right">{t("app.warehouse.ops.wizard.lines.ordered")}</th>
 <th className="pb-1.5 pr-3 font-semibold text-right">{t("app.warehouse.ops.wizard.lines.received")}</th>
 <th className="pb-1.5 font-semibold">{t("app.warehouse.stock.table.bin")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {(selectedReceipt?.lines || []).map((l) => (
 <tr key={l.id} className="align-middle">
 <td className="py-2 pr-3">
 <div className="font-medium text-foreground">{l.sku || "—"}</div>
 <div className="text-muted-foreground">{l.productName}</div>
 </td>
 <td className="py-2 pr-3 text-right text-muted-foreground">{l.orderedQty}</td>
 <td className="py-2 pr-3 text-right font-semibold text-foreground">{l.receivedQty}</td>
 <td className="py-2">
 <select
 value={opLineBins[l.id] || defaultBinForLine(l)}
 onChange={(e) => setOpLineBins((prev) => ({ ...prev, [l.id]: e.target.value }))}
 disabled={l.receivedQty <= 0}
 className="ys-input min-w-[92px] px-2 py-1 text-xs font-semibold disabled:opacity-50"
 >
 {ALL_BINS.map((bin) => (
 <option key={bin} value={bin}>
 {bin}
 </option>
 ))}
 </select>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 /* ── Step 3: Notes + confirm ──────────────────── */
 <div className="space-y-3">
 <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/40">
 <div className="text-xs font-semibold text-muted-foreground">{t("app.warehouse.ops.wizard.grn.title")}</div>
 <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
 <span className="text-muted-foreground">{t("app.warehouse.ops.wizard.grn.number")}</span>
 <span className="font-mono font-semibold text-foreground">{selectedReceipt?.receiptNumber}</span>
 <span className="text-muted-foreground">{t("app.warehouse.ops.wizard.grn.po")}</span>
 <span className="font-semibold text-foreground">{selectedReceipt?.poNumber}</span>
 <span className="text-muted-foreground">{t("app.warehouse.ops.wizard.grn.supplier")}</span>
 <span className="text-foreground">{selectedReceipt?.supplierName}</span>
 </div>
 <div className="mt-3 space-y-1">
 {(selectedReceipt?.lines || [])
 .filter((l) => l.receivedQty > 0)
 .map((l) => (
 <div key={l.id} className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">{l.sku} — {l.productName}</span>
 <span className="font-semibold text-foreground">× {l.receivedQty} · {opLineBins[l.id] || defaultBinForLine(l)}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
 ) : (
 opStep === 1 ? (
 /* ── OUT / TRANSFER: Step 1 — product search ─── */
 <div className="space-y-3">
 {opKind === "OUT" ? (
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => setOpIssueMode("REQUEST")}
 className={`ys-tab ${opIssueMode === "REQUEST" ? "ys-tab-active" : ""}`}
 >
 {t("app.warehouse.ops.issueRequest.tab")}
 </button>
 <button
 type="button"
 onClick={() => {
 setOpIssueMode("MANUAL");
 setOpMaterialRequestId("");
 setOpIssueBins({});
 }}
 className={`ys-tab ${opIssueMode === "MANUAL" ? "ys-tab-active" : ""}`}
 >
 {t("app.warehouse.ops.issueManual.tab")}
 </button>
 </div>
 ) : null}

 {opKind === "OUT" && opIssueMode === "REQUEST" ? (
 <>
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.warehouse.ops.wizard.request.search")}
 <input
 value={opMaterialRequestSearch}
 onChange={(e) => setOpMaterialRequestSearch(e.target.value)}
 placeholder={t("app.warehouse.ops.wizard.request.searchPlaceholder")}
 className="ys-input mt-1"
 />
 </label>
 <div className="max-h-72 space-y-2 overflow-y-auto">
 {filteredApprovedRequests.map((request) => (
 <button
 key={request.id}
 type="button"
 onClick={() => selectMaterialRequestForIssue(request)}
 className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
 opMaterialRequestId === request.id
 ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
 : "border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800/40"
 }`}
 >
 <div className="font-semibold text-foreground">{materialRequestSummary(request)}</div>
 <div className="mt-1 text-xs text-muted-foreground">
 {request.reasonText || t("app.warehouse.ops.wizard.request.noReason")}
 </div>
 <div className="mt-1 text-[11px] text-muted-foreground">
 {t("app.warehouse.ops.wizard.request.department")}: {shortId(request.departmentId)} · {t("app.warehouse.ops.wizard.request.requester")}: {shortId(request.requestedBy)}
 </div>
 </button>
 ))}
 {!filteredApprovedRequests.length && (
 <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
 {t("app.warehouse.ops.wizard.request.empty")}
 </div>
 )}
 </div>
 </>
 ) : (
 <>
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.warehouse.ops.wizard.search")}
 <input
 value={opSearch}
 onChange={(e) => setOpSearch(e.target.value)}
 placeholder={t("app.warehouse.ops.wizard.searchPlaceholder")}
 className="ys-input mt-1"
 />
 </label>
 <div className="grid grid-cols-1 gap-2">
 {opCandidates.map((p) => (
 <button
 key={p.id}
 type="button"
 onClick={() => setOpProductId(p.id || "")}
 className={`border px-3 py-2 text-left text-sm transition rounded-xl ${
 opProductId === p.id
 ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
 : "border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800/40"
 }`}
 >
 <div className="flex min-w-0 items-center gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={p}
 alt={p.name || p.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback />}
 />
 </div>
 <div className="min-w-0">
 <div className="font-medium text-foreground">{p.sku || "—"} — {p.name || p.description || "—"}</div>
 <div className="truncate text-xs text-muted-foreground">{p.description || ""}</div>
 </div>
 </div>
 </button>
 ))}
 {!opCandidates.length && <div className="text-sm text-muted-foreground">{t("app.warehouse.ops.wizard.noResults")}</div>}
 </div>
 </>
 )}
 </div>
 ) : opStep === 2 ? (
 /* ── OUT / TRANSFER: Step 2 — qty + destination ─ */
 <div className="space-y-3">
 {opKind === "OUT" && opIssueMode === "REQUEST" ? (
 <>
 <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/40">
 <div className="text-xs text-muted-foreground">{t("app.warehouse.ops.wizard.request.selected")}</div>
 <div className="mt-1 font-semibold text-foreground">
 {selectedMaterialRequest ? materialRequestSummary(selectedMaterialRequest) : "—"}
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-border text-left text-muted-foreground">
 <th className="pb-1.5 pr-3 font-semibold">{t("app.approvals.detail.product")}</th>
 <th className="pb-1.5 pr-3 font-semibold text-right">{t("app.warehouse.ops.wizard.request.remaining")}</th>
 <th className="pb-1.5 font-semibold">{t("app.warehouse.ops.wizard.request.sourceBin")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {materialItemsToIssue(selectedMaterialRequest).map((item) => (
 <tr key={item.productId} className="align-middle">
 <td className="py-2 pr-3">
 <div className="font-medium text-foreground">{materialProductLabel(item.productId)}</div>
 <div className="text-muted-foreground">{item.note || selectedMaterialRequest?.reasonText || ""}</div>
 </td>
 <td className="py-2 pr-3 text-right font-semibold text-foreground">{materialItemRemainingQty(item)}</td>
 <td className="py-2">
 <select
 value={opIssueBins[item.productId || ""] || defaultBinForMaterialItem(item)}
 onChange={(e) => setOpIssueBins((prev) => ({ ...prev, [item.productId || ""]: e.target.value }))}
 className="ys-input min-w-[92px] px-2 py-1 text-xs font-semibold"
 >
 {ALL_BINS.map((bin) => (
 <option key={bin} value={bin}>
 {bin}
 </option>
 ))}
 </select>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </>
 ) : (
 <>
 <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/40">
 <div className="text-xs text-muted-foreground">{t("app.warehouse.ops.wizard.selected")}</div>
 <div className="mt-1 font-semibold text-foreground">
 {opSelectedProduct ? `${opSelectedProduct.sku || "—"} — ${opSelectedProduct.name || opSelectedProduct.description || "—"}` : "—"}
 </div>
 </div>
 {opKind === "TRANSFER" && (
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.warehouse.ops.wizard.destination")}
 <select
 value={opDestAgencyId}
 onChange={(e) => setOpDestAgencyId(e.target.value)}
 className="ys-input mt-1"
 >
 <option value="">{t("app.warehouse.ops.wizard.destination.placeholder")}</option>
 {agencies.filter((a) => (a.id || "") !== activeAgencyId).map((a) => (
 <option key={a.id} value={a.id || ""}>{a.name || a.id}</option>
 ))}
 </select>
 </label>
 )}
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.warehouse.ops.wizard.qty")}
 <input
 type="number"
 min={1}
 value={opQty}
 onChange={(e) => setOpQty(Number(e.target.value))}
 className="ys-input mt-1"
 />
 </label>
 </>
 )}
 </div>
 ) : (
 /* ── OUT / TRANSFER: Step 3 — review + notes ─── */
 <div className="space-y-3">
 {opKind === "OUT" && opIssueMode === "REQUEST" ? (
 <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/40">
 <div className="text-xs text-muted-foreground">{t("app.warehouse.ops.wizard.request.issueTitle")}</div>
 <div className="mt-1 font-semibold text-foreground">
 {selectedMaterialRequest ? materialRequestSummary(selectedMaterialRequest) : "—"}
 </div>
 <div className="mt-3 space-y-1">
 {materialItemsToIssue(selectedMaterialRequest).map((item) => (
 <div key={item.productId} className="flex items-center justify-between gap-3 text-xs">
 <span className="text-muted-foreground">{materialProductLabel(item.productId)}</span>
 <span className="font-semibold text-foreground">
 × {materialItemRemainingQty(item)} · {opIssueBins[item.productId || ""] || defaultBinForMaterialItem(item)}
 </span>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/40">
 <div className="text-xs text-muted-foreground">{t("app.warehouse.ops.wizard.review")}</div>
 <div className="mt-1 font-semibold text-foreground">
 {opSelectedProduct ? `${opSelectedProduct.sku || "—"} — ${opSelectedProduct.name || opSelectedProduct.description || "—"}` : "—"}
 </div>
 <div className="mt-1 text-xs text-muted-foreground">
 {t("app.common.qty")}: <span className="font-semibold text-foreground">{opQty}</span>
 {opKind === "TRANSFER" && opDestAgencyId ? (
 <> · {t("app.warehouse.ops.wizard.destination.short")}: <span className="font-semibold text-foreground">{agencies.find((a) => a.id === opDestAgencyId)?.name || opDestAgencyId}</span></>
 ) : null}
 </div>
 </div>
 )}
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.warehouse.ops.wizard.notes")}
 <textarea
 value={opNotes}
 onChange={(e) => setOpNotes(e.target.value)}
 placeholder={t("app.warehouse.ops.wizard.notesPlaceholder")}
 className="ys-input mt-1"
 rows={3}
 />
 </label>
 </div>
 )
 )}

 <div className="mt-5 flex items-center justify-between gap-2">
 <button
 type="button"
 onClick={() => setOpOpen(false)}
 className="ys-btn-secondary px-3 py-2 text-sm"
 >
 {t("app.warehouse.ops.wizard.cancel")}
 </button>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setOpStep((s) => (s === 3 ? 2 : 1))}
 disabled={opStep === 1}
 className="ys-btn-secondary px-3 py-2 text-sm disabled:opacity-50"
 >
 {t("app.warehouse.ops.wizard.back")}
 </button>
 {opStep < 3 ? (
 <button
 type="button"
 onClick={() => setOpStep((s) => (s === 1 ? 2 : 3))}
 disabled={
 opKind === "IN"
 ? opStep === 1 ? !opReceiptId : false
 : opKind === "OUT" && opIssueMode === "REQUEST"
 ? opStep === 1 ? !opMaterialRequestId : !selectedMaterialRequest || !materialItemsToIssue(selectedMaterialRequest).length
 : opStep === 1 ? !opProductId : opQty <= 0 || (opKind === "TRANSFER" && !opDestAgencyId)
 }
 className="ys-btn-primary px-3 py-2 text-sm disabled:opacity-50"
 >
 {t("app.warehouse.ops.wizard.next")}
 </button>
 ) : (
 <button
 type="button"
 onClick={runOperation}
 disabled={
 opBusy || (
 opKind === "IN"
 ? !opReceiptId || !selectedReceipt?.lines.some((l) => l.receivedQty > 0)
 : opKind === "OUT" && opIssueMode === "REQUEST"
 ? !selectedMaterialRequest || !materialItemsToIssue(selectedMaterialRequest).length
 : opQty <= 0 || !opProductId || (opKind === "TRANSFER" && !opDestAgencyId)
 )
 }
 className="ys-btn-primary px-3 py-2 text-sm disabled:opacity-50"
 >
 {opBusy ? t("app.warehouse.ops.wizard.running") : t("app.warehouse.ops.wizard.confirm")}
 </button>
 )}
 </div>
 </div>
 </Modal>

 <Modal open={!!opSuccess} title={opSuccess?.title || ""} onClose={() => setOpSuccess(null)}>
 <div className="space-y-4">
 <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
 {opSuccess?.message}
 </div>
 <div className="flex justify-end">
 <button type="button" className="ys-btn-primary px-4 py-2 text-sm" onClick={() => setOpSuccess(null)}>
 {t("app.warehouse.ops.feedback.close")}
 </button>
 </div>
 </div>
 </Modal>

 <Drawer open={movementDrawerOpen && !!selectedMovement} title={t("app.warehouse.movement.title")} onClose={() => setMovementDrawerOpen(false)}>
 {selectedMovement ? (
 <div className="ys-page">
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground">{t("app.warehouse.movement.reference")}</div>
 <div className="mt-1 text-lg font-semibold text-foreground ">{selectedMovement.reference || selectedMovement.id}</div>
 <div className="mt-2 text-sm text-muted-foreground ">
 {t("app.warehouse.movement.meta", {
 type: selectedMovement.type || "—",
 status: selectedMovement.status || "—",
 date: formatDate(selectedMovement.date || selectedMovement.validatedAt),
 })}
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="text-sm font-semibold">{t("app.warehouse.movement.items")}</div>
 <div className="mt-3 space-y-2">
 {(selectedMovement.items || []).map((it) => {
 const pid = it.productId || "";
 const p = pid ? productById.get(pid) : null;
 return (
 <div key={it.id || `${pid}-${it.productCode}`} className="rounded-xl border border-border px-3 py-2 text-sm ">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="font-medium text-foreground ">
 {p?.sku || it.productCode || "—"} — {p?.name || it.productName || "—"}
 </div>
 <div className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">{p?.description || ""}</div>
 </div>
 <div className="text-right">
 <div className="text-xs text-muted-foreground">{t("app.common.qty")}</div>
 <div className="text-lg font-semibold text-foreground ">{it.quantity ?? 0}</div>
 </div>
 </div>
 {p?.id && (
 <div className="mt-2">
 <Link href={`/app/inventory/${p.id}`} className="text-xs font-semibold text-blue-700 underline underline-offset-4 dark:text-blue-300">
 {t("app.warehouse.movement.openPart")}
 </Link>
 </div>
 )}
 </div>
 );
 })}
 {!(selectedMovement.items || []).length && <div className="text-sm text-muted-foreground">{t("app.warehouse.movement.items.empty")}</div>}
 </div>
 </div>

 {selectedMovement.notes && (
 <div className="ys-card p-4 text-sm text-muted-foreground">
 <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground">
 {t("app.warehouse.movement.notes")}
 </div>
 <div className="mt-2">{selectedMovement.notes}</div>
 </div>
 )}
 </div>
 ) : null}
 </Drawer>
 </div>
 );
}
