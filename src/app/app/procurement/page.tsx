"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageSearch } from "@/components/PageSearchContext";
import { hasOrganizationAccess } from "@/lib/accessControl";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { AgenciesService, EmployeesRolesService } from "@/lib";
import type { Agency, OrganizationMember } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type { Product, ProductCategory, StockLevel, StockMovement } from "@/lib-stock";
import { getOrganizationStorageId, getQuotationStorageKey } from "@/lib/quotationStorage";
import { WarehousesService as SpareWarehousesService } from "@/lib-spare/appServices";
import { SuppliersService } from "@/yowyob-tiers/appServices";
import type { SupplierProduct, Supplier } from "@/yowyob-tiers/appServices";
import MovableModal from "@/components/MovableModal";
import ExportMenu from "@/components/ExportMenu";
import { downloadCsv, printTablePdf } from "@/lib/exportFiles";

type StockStatus = "OK" | "LOW" | "OUT";
type SortKey = "status" | "sku" | "name" | "category" | "onHand" | "min" | "suggested" | "lastMove";
type SortDir = "asc" | "desc";
type LocationFilter = "ALL" | { agencyId: string };
type QuotationStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";

type QuotationLine = {
 id: string;
 productId: string;
 productName: string;
 sku: string;
 qty: number;
 unitPrice: number;
 stockAvailable: number;
};

type QuotationTotals = {
 ht: number;
 vat: number;
 ttc: number;
 discount: number;
 air?: number;
 ir?: number;
 netAPayer?: number;
 final: number;
};

type QuotationRecord = {
 id: string;
 quotationNumber: string;
 supplierId: string;
 supplierName: string;
 supplierAddress: string;
 status: QuotationStatus;
 paymentMethod: string;
 nosRef: string;
 vosRef: string;
 globalDiscountPct: number;
 installments: number;
 applyVat: boolean;
 applyRetenue?: boolean;
 referralPartner: boolean;
 issueDate: string;
 validUntil: string;
 systemDate: string;
 inStockOnly: boolean;
 lines: QuotationLine[];
 totals: QuotationTotals;
 createdAt: string;
 updatedAt: string;
};

type RequisitionItem = { productId: string; sku: string; name: string; qty: number };
type ProcurementRow = {
 id: string;
 sku: string;
 name: string;
 category: string;
 categoryId: string;
 onHand: number;
 min: number;
 status: StockStatus;
 suggested: number;
 lastMove: string;
 bin: string;
};
type UnknownRecord = Record<string, unknown>;

const NOTES_KEY = "yowspare-procurement-notes-v1";
const REQUISITION_DRAFT_KEY = "yowspare-requisition-draft-v1";
const VAT_RATE = 0.1925;
const AIR_RATE = 0.055;
const IR_RATE = 0.015;

function isRecord(value: unknown): value is UnknownRecord {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorStatus(error: unknown) {
 if (!isRecord(error)) return undefined;
 return typeof error.status === "number" ? error.status : undefined;
}

function toStringRecord(value: unknown): Record<string, string> {
 if (!isRecord(value)) return {};
 return Object.fromEntries(
 Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
 );
}

function toRequisitionItem(value: unknown): RequisitionItem | null {
 if (!isRecord(value)) return null;
 const productId = typeof value.productId === "string" ? value.productId : "";
 if (!productId) return null;
 const rawQty = typeof value.qty === "number" || typeof value.qty === "string" ? value.qty : 1;
 return {
 productId,
 sku: typeof value.sku === "string" ? value.sku : "—",
 name: typeof value.name === "string" ? value.name : "—",
 qty: Math.max(1, Number(rawQty || 1)),
 };
}

function compareSortableValues(x: string | number, y: string | number) {
 return x > y ? 1 : x < y ? -1 : 0;
}

function formatDate(value?: string) {
 if (!value) return "—";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function formatMoney(value: number, currency = "XAF") {
 return new Intl.NumberFormat(undefined, {
 style: "currency",
 currency,
 maximumFractionDigits: 0,
 }).format(Number.isFinite(value) ? value : 0);
}

function isoDate(value: Date) {
 return value.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
 const next = new Date(base);
 next.setDate(next.getDate() + days);
 return next;
}

function generateQuotationNumber() {
 const now = new Date();
 const y = now.getFullYear();
 const m = String(now.getMonth() + 1).padStart(2, "0");
 const d = String(now.getDate()).padStart(2, "0");
 const random = String(Math.floor(Math.random() * 9000) + 1000);
 return `RFQ-${y}${m}${d}-${random}`;
}

function computeQuotationTotals(
 lines: QuotationLine[],
 discountPct: number,
 applyVat: boolean,
 applyRetenue = true,
): QuotationTotals {
 const ht = lines.reduce((acc, line) => acc + line.qty * line.unitPrice, 0);
 const discount = Math.max(0, ht * (Math.max(0, discountPct) / 100));
 const base = Math.max(0, ht - discount);
 const vat = applyVat ? base * VAT_RATE : 0;
 const ttc = base + vat;
 const air = applyRetenue ? base * AIR_RATE : 0;
 const ir = applyRetenue ? base * IR_RATE : 0;
 const netAPayer = ttc - air - ir;
 return {
 ht,
 vat,
 ttc,
 discount,
 air,
 ir,
 netAPayer,
 final: netAPayer,
 };
}

function payableTotal(totals: QuotationTotals) {
 return totals.netAPayer ?? totals.final;
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

export default function ProcurementPage() {
 const router = useRouter();
 const { tenant, user, logout, activeAgencyId, roles: sessionRoles } = useSession();
 const { t } = useT();
 const { query } = usePageSearch();
 const organizationStorageId = getOrganizationStorageId(tenant, user);
 const quotationStorageKey = getQuotationStorageKey(organizationStorageId);

 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState("");
 const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
 const [reloadSeq, setReloadSeq] = useState(0);

 const [products, setProducts] = useState<Product[]>([]);
 const [categories, setCategories] = useState<ProductCategory[]>([]);
 const [levels, setLevels] = useState<StockLevel[]>([]);
 const [movements, setMovements] = useState<StockMovement[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);

 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [, setSupplierLinks] = useState<SupplierProduct[]>([]);
 const [supplierLinksLoading, setSupplierLinksLoading] = useState(false);
 const [supplierProductIds, setSupplierProductIds] = useState<Set<string> | null>(null);

 const [orgMember, setOrgMember] = useState<OrganizationMember | null>(null);

 const [tab, setTab] = useState<"REORDER" | "ALL">("REORDER");
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

 const [binMap, setBinMap] = useState<Record<string, Record<string, string>>>({});
 const [notes, setNotes] = useState<Record<string, string>>({});

 const [requisitionOpen, setRequisitionOpen] = useState(false);
 const [requisitionNote, setRequisitionNote] = useState("");
 const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);

 const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
 const [quotationSearch, setQuotationSearch] = useState("");
 const [quotationStatusFilter, setQuotationStatusFilter] = useState<"ALL" | QuotationStatus>("ALL");
 const [quotationOpen, setQuotationOpen] = useState(false);
 const [quotationError, setQuotationError] = useState("");
 const [quotationLineProductId, setQuotationLineProductId] = useState("");
 const [quotationLineQty, setQuotationLineQty] = useState(1);
 const [quotationLineUnitPrice, setQuotationLineUnitPrice] = useState("");
 const [quotationDraft, setQuotationDraft] = useState<Omit<QuotationRecord, "id" | "status" | "totals" | "createdAt" | "updatedAt">>(() => {
 const now = new Date();
 return {
 quotationNumber: generateQuotationNumber(),
 supplierId: "",
 supplierName: "",
 supplierAddress: "",
 paymentMethod: "VIREMENT",
 nosRef: "",
 vosRef: "",
 globalDiscountPct: 0,
 installments: 1,
 applyVat: true,
 applyRetenue: true,
 referralPartner: false,
 issueDate: isoDate(now),
 validUntil: isoDate(addDays(now, 14)),
 systemDate: isoDate(now),
 inStockOnly: false,
 lines: [],
 };
 });

 const toastTimeoutRef = useRef<number | null>(null);
 const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
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
 try {
 const raw = localStorage.getItem(NOTES_KEY);
 const parsed: unknown = raw ? JSON.parse(raw) : {};
 setNotes(toStringRecord(parsed));
 } catch {
 setNotes({});
 }
 }, []);

 useEffect(() => {
 try {
 const raw = localStorage.getItem(REQUISITION_DRAFT_KEY);
 if (!raw) return;
 localStorage.removeItem(REQUISITION_DRAFT_KEY);

 const parsed: unknown = JSON.parse(raw);
 const itemsRaw = isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : [];
 const items = itemsRaw
 .map(toRequisitionItem)
 .filter((it): it is RequisitionItem => !!it)
 .slice(0, 50);

 if (!items.length) return;

 setTab("REORDER");
 setRequisitionItems((prev) => {
 const existing = new Map(prev.map((p) => [p.productId, p]));
 items.forEach((it) => {
 if (!existing.has(it.productId)) existing.set(it.productId, it);
 });
 return Array.from(existing.values());
 });
 setRequisitionOpen(true);
 } catch {
 // ignore
 }
 }, []);

 useEffect(() => {
 if (!organizationStorageId) {
 setQuotations([]);
 return;
 }
 try {
 const raw = localStorage.getItem(quotationStorageKey);
 if (!raw) {
 setQuotations([]);
 return;
 }
 const parsed = JSON.parse(raw) as QuotationRecord[];
 if (Array.isArray(parsed)) {
 setQuotations(parsed);
 } else {
 setQuotations([]);
 }
 } catch {
 setQuotations([]);
 }
 }, [organizationStorageId, quotationStorageKey]);

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
 if (getErrorStatus(err) === 401) {
 logout();
 router.replace("/");
 return;
 }
 setLoadError(t("app.procurement.error.load"));
 } finally {
 if (mounted) setLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [logout, reloadSeq, router, t, tenant]);

 const binAgencyId = useMemo(() => {
 if (location !== "ALL") return location.agencyId;
 return activeAgencyId || null;
 }, [activeAgencyId, location]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant || !binAgencyId) return;
 try {
 const locs = await SpareWarehousesService.listProductLocations(binAgencyId);
 if (!mounted) return;
 const next: Record<string, string> = {};
 (locs || []).forEach((l) => {
 if (l?.productId && l?.binCode) next[l.productId] = l.binCode;
 });
 setBinMap((prev) => ({ ...prev, [binAgencyId]: next }));
 } catch {
 if (!mounted) return;
 // Non-blocking: bins are optional in this page.
 }
 })();
 return () => {
 mounted = false;
 };
 }, [binAgencyId, tenant]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 try {
 const list = await SuppliersService.list();
 if (!mounted) return;
 setSuppliers(list || []);
 } catch {
 if (!mounted) return;
 setSuppliers([]);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [tenant]);

 useEffect(() => {
 if (!suppliers.length) return;
 setQuotationDraft((prev) => {
 if (prev.supplierId) return prev;
 const first = suppliers[0];
 if (!first?.id) return prev;
 return {
 ...prev,
 supplierId: first.id,
 supplierName: first.name || "",
 supplierAddress: first.address || "",
 };
 });
 }, [suppliers]);

 useEffect(() => {
 let mounted = true;
 (async () => {
 if (!tenant) return;
 if (supplierFilter === "ALL") {
 setSupplierLinks([]);
 setSupplierProductIds(null);
 setSupplierLinksLoading(false);
 return;
 }
 setSupplierLinksLoading(true);
 setSupplierProductIds(null);
 try {
 const links = await SuppliersService.listSupplierProducts(supplierFilter);
 if (!mounted) return;
 setSupplierLinks(links || []);
 setSupplierProductIds(new Set((links || []).map((l) => l.productId).filter(Boolean)));
 } catch {
 if (!mounted) return;
 setSupplierLinks([]);
 setSupplierProductIds(new Set());
 } finally {
 if (mounted) setSupplierLinksLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [logout, router, supplierFilter, tenant]);

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

 useEffect(() => {
 setPage(1);
 }, [tab, location, statusFilter, categoryFilter, supplierFilter, sortKey, sortDir, query]);

 const canProcure = hasOrganizationAccess(
 {
 authorities: sessionRoles,
 memberRole: orgMember?.roleName,
 organization: tenant,
 user,
 },
 ["procurement:write"],
 );

 const quotationDraftTotals = useMemo(
 () =>
 computeQuotationTotals(
 quotationDraft.lines,
 quotationDraft.globalDiscountPct,
 quotationDraft.applyVat,
 quotationDraft.applyRetenue ?? true,
 ),
 [quotationDraft.applyRetenue, quotationDraft.applyVat, quotationDraft.globalDiscountPct, quotationDraft.lines]
 );

 const filteredQuotations = useMemo(() => {
 const needle = quotationSearch.trim().toLowerCase();
 return quotations
 .filter((q) => (quotationStatusFilter === "ALL" ? true : q.status === quotationStatusFilter))
 .filter((q) => {
 if (!needle) return true;
 return [q.quotationNumber, q.supplierName, q.status].join(" ").toLowerCase().includes(needle);
 })
 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 }, [quotationSearch, quotationStatusFilter, quotations]);

 const categoryNameById = useMemo(() => {
 const map = new Map<string, string>();
 for (const c of categories) {
 if (c.id) map.set(c.id, c.name || "—");
 }
 return map;
 }, [categories]);

 const agencyById = useMemo(() => {
 const map = new Map<string, Agency>();
 for (const a of agencies) {
 if (a.id) map.set(a.id, a);
 }
 return map;
 }, [agencies]);

 const qtyByProduct = useMemo(() => {
 const map = new Map<string, number>();
 for (const s of levels) {
 const pid = s.productId;
 if (!pid) continue;
 if (location !== "ALL" && s.agencyId !== location.agencyId) continue;
 map.set(pid, (map.get(pid) || 0) + (s.quantity || 0));
 }
 return map;
 }, [levels, location]);

 const qtyByProductAgency = useMemo(() => {
 const map = new Map<string, Map<string, number>>();
 for (const s of levels) {
 const pid = s.productId;
 const aid = s.agencyId;
 if (!pid || !aid) continue;
 if (!map.has(pid)) map.set(pid, new Map());
 const inner = map.get(pid)!;
 inner.set(aid, (inner.get(aid) || 0) + (s.quantity || 0));
 }
 return map;
 }, [levels]);

 const lastMoveByProduct = useMemo(() => {
 const map = new Map<string, string>();
 for (const mv of movements) {
 const when = mv.date || mv.validatedAt;
 if (!when) continue;
 for (const it of mv.items || []) {
 const pid = it.productId;
 if (!pid) continue;
 const existing = map.get(pid);
 if (!existing || new Date(when).getTime() > new Date(existing).getTime()) map.set(pid, when);
 }
 }
 return map;
 }, [movements]);

 const primaryBinByProduct = useMemo(() => {
 const map = new Map<string, string>();
 const fallbackAgencyId = location === "ALL" ? activeAgencyId : location.agencyId;
 for (const p of products) {
 const pid = p.id;
 if (!pid) continue;
 if (fallbackAgencyId && binMap?.[fallbackAgencyId]?.[pid]) {
 map.set(pid, binMap[fallbackAgencyId][pid]);
 continue;
 }
 const anyAgency = Object.keys(binMap || {}).find((aid) => !!binMap?.[aid]?.[pid]);
 if (anyAgency && binMap?.[anyAgency]?.[pid]) map.set(pid, binMap[anyAgency][pid]);
 }
 return map;
 }, [activeAgencyId, binMap, location, products]);

 const rows = useMemo(() => {
 const needle = query.trim().toLowerCase();
 const out: ProcurementRow[] = [];

 for (const p of products) {
 if (!p.id) continue;
 const sku = p.sku || "—";
 const name = p.name || p.description || t("app.procurement.unnamed");
 const catId = p.categoryId || "";
 const catName = p.categoryName || (catId ? categoryNameById.get(catId) || "—" : "—");
 const onHand = qtyByProduct.get(p.id) || 0;
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : 0;
 const status: StockStatus = onHand <= 0 ? "OUT" : min > 0 && onHand <= min ? "LOW" : "OK";
 const suggested = min > 0 ? Math.max(0, min - onHand) : 0;
 const lastMove = lastMoveByProduct.get(p.id) || "";
 const bin = primaryBinByProduct.get(p.id) || "—";

 if (needle) {
 const hit =
 sku.toLowerCase().includes(needle) ||
 name.toLowerCase().includes(needle) ||
 (catName || "").toLowerCase().includes(needle);
 if (!hit) continue;
 }

 if (categoryFilter !== "ALL" && catId !== categoryFilter) continue;
 if (supplierFilter !== "ALL") {
 if (!supplierProductIds) continue;
 if (!supplierProductIds.has(p.id)) continue;
 }
 if (statusFilter !== "ALL" && status !== statusFilter) continue;

 if (tab === "REORDER") {
 if (!(suggested > 0)) continue;
 }

 out.push({
 id: p.id,
 sku,
 name,
 category: catName || "—",
 categoryId: catId,
 onHand,
 min,
 status,
 suggested,
 lastMove,
 bin,
 });
 }

 const statusRank = (s: StockStatus) => (s === "OUT" ? 3 : s === "LOW" ? 2 : 1);
 const dir = sortDir === "asc" ? 1 : -1;
 out.sort((a, b) => {
 if (sortKey === "status") return dir * compareSortableValues(statusRank(a.status), statusRank(b.status));
 if (sortKey === "sku") return dir * compareSortableValues(a.sku, b.sku);
 if (sortKey === "name") return dir * compareSortableValues(a.name, b.name);
 if (sortKey === "category") return dir * compareSortableValues(a.category, b.category);
 if (sortKey === "onHand") return dir * compareSortableValues(a.onHand, b.onHand);
 if (sortKey === "min") return dir * compareSortableValues(a.min, b.min);
 if (sortKey === "suggested") return dir * compareSortableValues(a.suggested, b.suggested);
 if (sortKey === "lastMove") return dir * compareSortableValues(a.lastMove, b.lastMove);
 return 0;
 });

 return out;
 }, [
 categoryFilter,
 categoryNameById,
 lastMoveByProduct,
 primaryBinByProduct,
 products,
 qtyByProduct,
 query,
 sortDir,
 sortKey,
 statusFilter,
 supplierFilter,
 supplierProductIds,
 t,
 tab,
 ]);

 const kpis = useMemo(() => {
 const candidates = rows.length;
 const outCount = rows.filter((r) => r.status === "OUT").length;
 const suggestedTotal = rows.reduce((acc, r) => acc + (r.suggested || 0), 0);
 const uniqueProducts = new Set(rows.map((r) => r.id)).size;
 return { candidates, outCount, suggestedTotal, uniqueProducts };
 }, [rows]);

 const paged = useMemo(() => {
 const total = rows.length;
 const totalPages = Math.max(1, Math.ceil(total / pageSize));
 const safePage = Math.min(page, totalPages);
 const start = (safePage - 1) * pageSize;
 return {
 total,
 totalPages,
 page: safePage,
 items: rows.slice(start, start + pageSize),
 };
 }, [page, rows]);

 const detailsProduct = useMemo(() => {
 if (!detailsId) return null;
 return products.find((p) => p.id === detailsId) || null;
 }, [detailsId, products]);

 const detailsLevels = useMemo(() => {
 if (!detailsId) return [];
 const inner = qtyByProductAgency.get(detailsId);
 if (!inner) return [];
 const pairs = Array.from(inner.entries()).map(([agencyId, qty]) => ({
 agencyId,
 agencyName: agencyById.get(agencyId)?.name || agencyId,
 agencyType: agencyById.get(agencyId)?.type || "",
 qty,
 }));
 pairs.sort((a, b) => (b.qty || 0) - (a.qty || 0));
 return pairs;
 }, [agencyById, detailsId, qtyByProductAgency]);

 const detailsMovements = useMemo(() => {
 if (!detailsId) return [];
 const list = movements
 .filter((m) => (m.items || []).some((it) => it.productId === detailsId))
 .slice()
 .sort((a, b) => new Date(b.date || b.validatedAt || 0).getTime() - new Date(a.date || a.validatedAt || 0).getTime());
 return list.slice(0, 12);
 }, [detailsId, movements]);

 const openDetails = (id: string) => {
 setDetailsId(id);
 setDetailsOpen(true);
 };

 const getVisibleExport = () => {
 const headers = [
 t("app.procurement.table.sku"),
 t("app.procurement.table.part"),
 t("app.procurement.table.category"),
 t("app.procurement.table.onHand"),
 t("app.procurement.table.min"),
 t("app.procurement.table.status"),
 t("app.procurement.table.suggested"),
 t("app.procurement.table.lastMove"),
 ];
 const rowsOut = rows.map((r) => [
 r.sku,
 r.name,
 r.category,
 r.onHand,
 r.min,
 r.status,
 r.suggested,
 r.lastMove ? formatDate(r.lastMove) : "—",
 ]);
 return { headers, rowsOut };
 };

 const exportVisible = (format: "csv" | "pdf") => {
 const { headers, rowsOut } = getVisibleExport();
 if (format === "csv") {
 downloadCsv(`yowspare-procurement-${new Date().toISOString().slice(0, 10)}.csv`, headers, rowsOut);
 return;
 }
 printTablePdf({
 title: t("app.procurement.title"),
 headers,
 rows: rowsOut,
 });
 };

 const exportRequisition = (format: "csv" | "pdf") => {
 const headers = ["SKU", "Name", "Qty"];
 const rowsOut = requisitionItems.map((it) => [it.sku, it.name, it.qty]);
 if (format === "csv") {
 downloadCsv(`yowspare-requisition-${new Date().toISOString().slice(0, 10)}.csv`, headers, rowsOut);
 showToast("success", t("app.procurement.requisition.exported"));
 return;
 }
 printTablePdf({
 title: t("app.procurement.requisition.title"),
 headers,
 rows: rowsOut,
 });
 showToast("success", t("app.procurement.requisition.exported"));
 };

 const startRequisition = () => {
 const items = rows
 .filter((r) => (r.suggested || 0) > 0)
 .slice(0, 50)
 .map((r) => ({ productId: r.id, sku: r.sku, name: r.name, qty: r.suggested || 1 }));
 setRequisitionItems(items);
 setRequisitionOpen(true);
 };

 const saveNote = (productId: string, value: string) => {
 setNotes((prev) => {
 const next = { ...prev, [productId]: value };
 try {
 localStorage.setItem(NOTES_KEY, JSON.stringify(next));
 } catch {
 // ignore
 }
 return next;
 });
 };

 const updateQuotationDraft = (
 patch: Partial<Omit<QuotationRecord, "id" | "status" | "totals" | "createdAt" | "updatedAt">>
 ) => {
 setQuotationDraft((prev) => ({ ...prev, ...patch }));
 };

 const resetQuotationDraft = () => {
 const now = new Date();
 const firstSupplier = suppliers[0];
 setQuotationDraft({
 quotationNumber: generateQuotationNumber(),
 supplierId: firstSupplier?.id || "",
 supplierName: firstSupplier?.name || "",
 supplierAddress: firstSupplier?.address || "",
 paymentMethod: "VIREMENT",
 nosRef: "",
 vosRef: "",
 globalDiscountPct: 0,
 installments: 1,
 applyVat: true,
 applyRetenue: true,
 referralPartner: false,
 issueDate: isoDate(now),
 validUntil: isoDate(addDays(now, 14)),
 systemDate: isoDate(now),
 inStockOnly: false,
 lines: [],
 });
 setQuotationLineProductId("");
 setQuotationLineQty(1);
 setQuotationLineUnitPrice("");
 setQuotationError("");
 };

 const persistQuotations = (next: QuotationRecord[]) => {
 setQuotations(next);
 try {
 localStorage.setItem(quotationStorageKey, JSON.stringify(next));
 } catch {
 // ignore
 }
 };

 const openQuotationModal = () => {
 if (!canProcure) {
 showToast("error", t("app.procurement.requisition.forbidden"));
 return;
 }
 resetQuotationDraft();
 setQuotationOpen(true);
 };

 const onQuotationSupplierChange = (supplierId: string) => {
 const supplier = suppliers.find((s) => s.id === supplierId);
 updateQuotationDraft({
 supplierId,
 supplierName: supplier?.name || "",
 supplierAddress: supplier?.address || "",
 });
 };

 const onQuotationLineProductChange = (productId: string) => {
 setQuotationLineProductId(productId);
 const selectedProduct = products.find((p) => p.id === productId);
 if (!selectedProduct) {
 setQuotationLineUnitPrice("");
 return;
 }
 const defaultPrice = selectedProduct.defaultCostPrice ?? 0;
 setQuotationLineUnitPrice(defaultPrice > 0 ? String(defaultPrice) : "");
 };

 const addQuotationLine = () => {
 setQuotationError("");
 const selectedProduct = products.find((p) => p.id === quotationLineProductId);
 if (!selectedProduct?.id) {
 setQuotationError(t("app.procurement.quotation.error.productRequired"));
 return;
 }
 const qty = Math.max(1, Number(quotationLineQty || 1));
 const unitPrice = Math.max(0, Number(quotationLineUnitPrice || 0));
 const stockAvailable = qtyByProduct.get(selectedProduct.id) || 0;
 if (quotationDraft.inStockOnly && qty > stockAvailable) {
 setQuotationError(t("app.procurement.quotation.error.stockOnly"));
 return;
 }

 const line: QuotationLine = {
 id: `${selectedProduct.id}-${Date.now()}`,
 productId: selectedProduct.id,
 productName: selectedProduct.name || selectedProduct.description || t("app.procurement.unnamed"),
 sku: selectedProduct.sku || "—",
 qty,
 unitPrice,
 stockAvailable,
 };

 updateQuotationDraft({ lines: [...quotationDraft.lines, line] });
 setQuotationLineProductId("");
 setQuotationLineQty(1);
 setQuotationLineUnitPrice("");
 };

 const removeQuotationLine = (lineId: string) => {
 updateQuotationDraft({ lines: quotationDraft.lines.filter((line) => line.id !== lineId) });
 };

 const saveQuotation = () => {
 setQuotationError("");
 if (!quotationDraft.supplierId) {
 setQuotationError(t("app.procurement.quotation.error.supplierRequired"));
 return;
 }
 if (!quotationDraft.lines.length) {
 setQuotationError(t("app.procurement.quotation.error.linesRequired"));
 return;
 }

 const nowIso = new Date().toISOString();
 const totals = computeQuotationTotals(
 quotationDraft.lines,
 quotationDraft.globalDiscountPct,
 quotationDraft.applyVat,
 quotationDraft.applyRetenue ?? true,
 );
 const record: QuotationRecord = {
 id: `quotation-${Date.now()}`,
 ...quotationDraft,
 status: "BROUILLON",
 totals,
 createdAt: nowIso,
 updatedAt: nowIso,
 };

 persistQuotations([record, ...quotations]);
 setQuotationOpen(false);
 showToast("success", t("app.procurement.quotation.saved"));
 };

 const updateQuotationLineQty = (lineId: string, qty: number) => {
 updateQuotationDraft({
 lines: quotationDraft.lines.map((line) =>
 line.id === lineId ? { ...line, qty: Math.max(1, Number.isFinite(qty) ? qty : 1) } : line
 ),
 });
 };

 const updateQuotationLinePrice = (lineId: string, unitPrice: number) => {
 updateQuotationDraft({
 lines: quotationDraft.lines.map((line) =>
 line.id === lineId ? { ...line, unitPrice: Math.max(0, Number.isFinite(unitPrice) ? unitPrice : 0) } : line
 ),
 });
 };

 return (
 <main className="ys-page">
 <div className="ys-page-header">
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground ">
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M6 7h12l-1.5 11H7.5L6 7z" strokeLinecap="round" />
 <path d="M9 7V5h6v2" strokeLinecap="round" />
 </svg>
 </span>
 <h2 className="ys-page-title">{t("app.procurement.title")}</h2>
 </div>
 <p className="ys-page-subtitle">{t("app.procurement.subtitle")}</p>
 <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground ">
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground">{t("app.procurement.context.tenant")}</span>
 <span className="font-semibold">{tenant?.name || tenant?.code || t("app.workspace.fallback")}</span>
 </span>
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground">{t("app.procurement.context.location")}</span>
 <span className="font-semibold">
 {location === "ALL"
 ? t("app.procurement.location.all")
 : agencyById.get(location.agencyId)?.name || location.agencyId}
 </span>
 </span>
 {lastSyncedAt && (
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground">{t("app.procurement.synced")}</span>
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
 <div className="flex items-center justify-between gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100">
 <div>{loadError}</div>
 <button
 type="button"
 className="ys-btn-secondary text-xs text-rose-700"
 onClick={() => setReloadSeq((n) => n + 1)}
 >
 {t("app.procurement.error.retry")}
 </button>
 </div>
 )}

 <section className="ys-card p-4">
 <div className="ys-toolbar">
 <div>
 <div className="ys-page-title text-lg">{t("app.procurement.quotation.title")}</div>
 <p className="ys-page-subtitle">{t("app.procurement.quotation.subtitle")}</p>
 </div>
 <div className="ys-toolbar-actions">
 <div className="relative">
 <input
 type="search"
 className="ys-input h-10 w-72 pl-9"
 placeholder={t("app.procurement.quotation.searchPlaceholder")}
 value={quotationSearch}
 onChange={(e) => setQuotationSearch(e.target.value)}
 />
 <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="m21 21-4.3-4.3" strokeLinecap="round" />
 <circle cx="11" cy="11" r="7" />
 </svg>
 </span>
 </div>
 </div>
 </div>

 <div className="mt-4 flex flex-wrap items-center gap-3">
 <span className="ys-section-title">{t("app.procurement.quotation.filters.status")}</span>
 <select
 className="ys-filter-control max-w-56"
 value={quotationStatusFilter}
 onChange={(e) => setQuotationStatusFilter(e.target.value as "ALL" | QuotationStatus)}
 >
 <option value="ALL">{t("app.procurement.quotation.status.all")}</option>
 <option value="BROUILLON">{t("app.procurement.quotation.status.BROUILLON")}</option>
 <option value="ENVOYE">{t("app.procurement.quotation.status.ENVOYE")}</option>
 <option value="ACCEPTE">{t("app.procurement.quotation.status.ACCEPTE")}</option>
 <option value="REFUSE">{t("app.procurement.quotation.status.REFUSE")}</option>
 </select>
 </div>

 {!filteredQuotations.length ? (
 <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
 {t("app.procurement.quotation.empty")}
 </div>
 ) : (
 <div className="ys-table-wrap mt-4">
 <table className="ys-table min-w-[860px]">
 <thead className="ys-table-head bg-muted/30">
 <tr>
 <th className="ys-table-cell pl-4">{t("app.procurement.quotation.table.number")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.table.supplier")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.table.date")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.table.status")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.table.total")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card text-foreground">
 {filteredQuotations.map((quote) => (
 <tr key={quote.id} className="ys-table-row">
 <td className="ys-table-cell pl-4 font-mono text-xs">{quote.quotationNumber}</td>
 <td className="ys-table-cell">
 <div className="font-medium">{quote.supplierName || "—"}</div>
 <div className="text-xs text-muted-foreground">{quote.supplierAddress || "—"}</div>
 </td>
 <td className="ys-table-cell text-muted-foreground">{formatDate(quote.createdAt)}</td>
 <td className="ys-table-cell">
 <span
 className={[
 "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
 quote.status === "BROUILLON"
 ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
 : quote.status === "ENVOYE"
 ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"
 : quote.status === "ACCEPTE"
 ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
 : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200",
 ].join(" ")}
 >
 {t(`app.procurement.quotation.status.${quote.status}` as Parameters<typeof t>[0])}
 </span>
 </td>
 <td className="ys-table-cell font-semibold">{formatMoney(payableTotal(quote.totals))}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground">{t("app.procurement.kpi.candidates")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.candidates}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground">{t("app.procurement.kpi.out")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.outCount}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground">{t("app.procurement.kpi.suggested")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.suggestedTotal}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground">{t("app.procurement.kpi.products")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.uniqueProducts}</div>
 </div>
 </section>

 <section className="ys-card p-4">
 <div className="ys-toolbar">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setTab("REORDER")}
 className={`ys-tab ${tab === "REORDER" ? "ys-tab-active" : ""}`}
 >
 {t("app.procurement.tab.reorder")}
 </button>
 <button
 type="button"
 onClick={() => setTab("ALL")}
 className={`ys-tab ${tab === "ALL" ? "ys-tab-active" : ""}`}
 >
 {t("app.procurement.tab.all")}
 </button>
 </div>

 <div className="ys-toolbar-actions">
 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportVisible("csv")}
 onPdf={() => exportVisible("pdf")}
 />
 <button
 type="button"
 onClick={() => (canProcure ? startRequisition() : showToast("error", t("app.procurement.requisition.forbidden")))}
 className={[
 "ys-btn-primary gap-2 text-xs",
 canProcure ? "" : "cursor-not-allowed border border-border rounded-xl bg-muted text-muted-foreground opacity-70",
 ].join(" ")}
 aria-disabled={!canProcure}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M4 12h10" strokeLinecap="round" />
 <path d="M4 17h16" strokeLinecap="round" />
 <path d="M17 10v6" strokeLinecap="round" />
 </svg>
 {t("app.procurement.action.requisition")}
 </button>
 </div>
 </div>

 <div className="ys-filter-grid mt-4">
 <label className="ys-filter-label">
 {t("app.procurement.filters.location")}
 <select
 className="ys-filter-control"
 value={location === "ALL" ? "ALL" : location.agencyId}
 onChange={(e) => {
 const v = e.target.value;
 setLocation(v === "ALL" ? "ALL" : { agencyId: v });
 }}
 >
 <option value="ALL">{t("app.procurement.location.all")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id || ""}>
 {a.name || a.shortName || a.code || a.id}
 </option>
 ))}
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.procurement.filters.status")}
 <select
 className="ys-filter-control"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as "ALL" | StockStatus)}
 >
 <option value="ALL">{t("app.procurement.filter.all")}</option>
 <option value="OK">{t("app.procurement.status.ok")}</option>
 <option value="LOW">{t("app.procurement.status.low")}</option>
 <option value="OUT">{t("app.procurement.status.out")}</option>
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.procurement.filters.category")}
 <select
 className="ys-filter-control"
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 >
 <option value="ALL">{t("app.procurement.filter.all")}</option>
 {categories.map((c) => (
 <option key={c.id} value={c.id || ""}>
 {c.name || c.id}
 </option>
 ))}
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.procurement.filters.supplier")}
 <select
 className="ys-filter-control"
 value={supplierFilter}
 onChange={(e) => setSupplierFilter(e.target.value)}
 disabled={supplierLinksLoading}
 >
 <option value="ALL">{t("app.procurement.filter.all")}</option>
 {suppliers.map((s) => (
 <option key={s.id} value={s.id}>
 {s.name || s.id}
 </option>
 ))}
 </select>
 </label>
 </div>

 <div className="mt-4 flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => {
 setSortKey("status");
 setSortDir("desc");
 }}
 className="ys-btn-secondary text-xs"
 >
 {t("app.procurement.sort.priority")}
 </button>
 <button
 type="button"
 onClick={() => {
 setSortKey("suggested");
 setSortDir("desc");
 }}
 className="ys-btn-secondary text-xs"
 >
 {t("app.procurement.sort.suggested")}
 </button>
 <button
 type="button"
 onClick={() => {
 setSortKey("lastMove");
 setSortDir("desc");
 }}
 className="ys-btn-secondary text-xs"
 >
 {t("app.procurement.sort.lastMove")}
 </button>
 </div>

 {loading ? (
 <div className="mt-4 text-sm text-muted-foreground">{t("app.procurement.loading")}</div>
 ) : !rows.length ? (
 <div className="mt-4 border border-border rounded-xl bg-muted/20 p-4 text-sm text-foreground">
 <div className="font-semibold">{t("app.procurement.empty.title")}</div>
 <div className="mt-1 text-muted-foreground">{t("app.procurement.empty.subtitle")}</div>
 </div>
 ) : (
 <div className="ys-table-wrap mt-4">
 <table className="ys-table min-w-[980px]">
 <thead className="ys-table-head bg-muted/30">
 <tr>
 <th className="ys-table-cell pl-4">{t("app.procurement.table.sku")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.part")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.category")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.onHand")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.min")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.status")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.suggested")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.lastMove")}</th>
 <th className="ys-table-cell">{t("app.procurement.table.bin")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card text-foreground">
 {paged.items.map((r) => (
 <tr
 key={r.id}
 className="ys-table-row cursor-pointer"
 onClick={() => openDetails(r.id)}
 >
 <td className="ys-table-cell pl-4 font-mono text-xs">{r.sku}</td>
 <td className="ys-table-cell">
 <div className="font-medium">{r.name}</div>
 </td>
 <td className="ys-table-cell text-muted-foreground">{r.category}</td>
 <td className="ys-table-cell font-semibold">{r.onHand}</td>
 <td className="ys-table-cell">{r.min || "—"}</td>
 <td className="ys-table-cell">
 <span
 className={[
 "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
 r.status === "OUT"
 ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
 : r.status === "LOW"
 ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
 : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
 ].join(" ")}
 >
 {r.status === "OK"
 ? t("app.procurement.status.ok")
 : r.status === "LOW"
 ? t("app.procurement.status.low")
 : t("app.procurement.status.out")}
 </span>
 </td>
 <td className="ys-table-cell font-semibold">{r.suggested || "—"}</td>
 <td className="ys-table-cell text-muted-foreground">
 {r.lastMove ? formatDate(r.lastMove) : "—"}
 </td>
 <td className="ys-table-cell font-mono text-xs text-muted-foreground">{r.bin}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {!loading && rows.length > 0 && (
 <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
 <div>
 {t("app.procurement.pagination.showing")}{" "}
 <span className="font-semibold">{(paged.page - 1) * pageSize + 1}</span>–
 <span className="font-semibold">{Math.min(paged.total, paged.page * pageSize)}</span>{" "}
 {t("app.procurement.pagination.of")} <span className="font-semibold">{paged.total}</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 className="ys-btn-secondary disabled:opacity-50"
 disabled={paged.page <= 1}
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 >
 {t("app.procurement.pagination.prev")}
 </button>
 <div className="font-semibold">
 {paged.page} / {paged.totalPages}
 </div>
 <button
 type="button"
 className="ys-btn-secondary disabled:opacity-50"
 disabled={paged.page >= paged.totalPages}
 onClick={() => setPage((p) => Math.min(paged.totalPages, p + 1))}
 >
 {t("app.procurement.pagination.next")}
 </button>
 </div>
 </div>
 )}
 </section>

 <Drawer
 open={detailsOpen}
 title={t("app.procurement.details.label")}
 onClose={() => {
 setDetailsOpen(false);
 setDetailsId(null);
 }}
 >
 {!detailsProduct ? (
 <div className="text-sm text-muted-foreground">{t("app.common.loading")}</div>
 ) : (
 <div className="space-y-4">
 <div className="ys-card p-4">
 <div className="ys-section-title">
 {detailsProduct.sku || "—"}
 </div>
 <div className="mt-1 text-lg font-semibold text-foreground ">
 {detailsProduct.name || detailsProduct.description || t("app.procurement.unnamed")}
 </div>
 <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-foreground ">
 <div>
 <div className="text-xs text-muted-foreground">{t("app.procurement.details.category")}</div>
 <div className="font-medium">
 {detailsProduct.categoryName ||
 (detailsProduct.categoryId ? categoryNameById.get(detailsProduct.categoryId) : "") ||
 "—"}
 </div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("app.procurement.details.min")}</div>
 <div className="font-medium">{detailsProduct.minStockLevel ?? "—"}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("app.procurement.details.onHand")}</div>
 <div className="font-medium">{qtyByProduct.get(detailsProduct.id || "") || 0}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">{t("app.procurement.details.lastMove")}</div>
 <div className="font-medium">
 {lastMoveByProduct.get(detailsProduct.id || "")
 ? formatDate(lastMoveByProduct.get(detailsProduct.id || ""))
 : "—"}
 </div>
 </div>
 </div>

 <div className="mt-4 flex items-center justify-between gap-3">
 <div className="text-xs text-muted-foreground">{t("app.procurement.details.note")}</div>
 <button
 type="button"
 onClick={() => {
 if (!canProcure) {
 showToast("error", t("app.procurement.requisition.forbidden"));
 return;
 }
 const pid = detailsProduct.id || "";
 if (!pid) return;
 const sku = detailsProduct.sku || "—";
 const name = detailsProduct.name || detailsProduct.description || t("app.procurement.unnamed");
 const currentQty = Math.max(1, (detailsProduct.minStockLevel || 0) - (qtyByProduct.get(pid) || 0));
 setRequisitionItems((prev) => {
 if (prev.some((x) => x.productId === pid)) return prev;
 return [...prev, { productId: pid, sku, name, qty: currentQty }];
 });
 showToast("success", t("app.procurement.details.added"));
 }}
 className={[
 "ys-btn-primary gap-2 text-xs",
 canProcure ? "" : "cursor-not-allowed border border-border rounded-xl bg-muted text-muted-foreground opacity-70",
 ].join(" ")}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M12 5v14" strokeLinecap="round" />
 <path d="M5 12h14" strokeLinecap="round" />
 </svg>
 {t("app.procurement.details.addToRequisition")}
 </button>
 </div>

 <textarea
 className="mt-2 ys-input"
 rows={3}
 value={notes[detailsProduct.id || ""] || ""}
 onChange={(e) => saveNote(detailsProduct.id || "", e.target.value)}
 placeholder={t("app.procurement.details.notePlaceholder")}
 />
 </div>

 <div className="ys-card p-4">
 <div className="ys-section-title">
 {t("app.procurement.details.stockByLocation")}
 </div>
 <div className="mt-3 space-y-2 text-sm">
 {detailsLevels.map((l) => (
 <div
 key={l.agencyId}
 className="flex items-center justify-between gap-3 border-b border-border pb-2"
 >
 <div>
 <div className="font-medium">{l.agencyName}</div>
 <div className="text-xs text-muted-foreground">
 {l.agencyType || "—"}
 </div>
 </div>
 <div className="font-semibold">{l.qty}</div>
 </div>
 ))}
 {!detailsLevels.length && (
 <div className="text-sm text-muted-foreground">{t("app.procurement.details.stockEmpty")}</div>
 )}
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="flex items-center justify-between gap-3">
 <div className="ys-section-title">
 {t("app.procurement.details.movements")}
 </div>
 </div>
 <div className="mt-3 space-y-2 text-sm">
 {detailsMovements.map((m) => (
 <div
 key={m.id}
 className="flex items-center justify-between gap-3 border border-border bg-card rounded-xl px-3 py-2"
 >
 <div>
 <div className="font-medium">{m.type || "—"}</div>
 <div className="text-xs text-muted-foreground">{formatDate(m.date || m.validatedAt)}</div>
 </div>
 <div className="text-xs text-muted-foreground">{m.reference || "—"}</div>
 </div>
 ))}
 {!detailsMovements.length && (
 <div className="text-sm text-muted-foreground">{t("app.procurement.details.movementsEmpty")}</div>
 )}
 </div>
 </div>
 </div>
 )}
 </Drawer>

 <Modal
 open={quotationOpen}
 title={t("app.procurement.quotation.modal.title")}
 onClose={() => setQuotationOpen(false)}
 >
 <div className="space-y-4">
 <div className="ys-card p-4">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.supplier")}
 <select
 className="ys-filter-control"
 value={quotationDraft.supplierId}
 onChange={(e) => onQuotationSupplierChange(e.target.value)}
 >
 <option value="">{t("app.procurement.quotation.form.supplierPlaceholder")}</option>
 {suppliers.map((supplier) => (
 <option key={supplier.id} value={supplier.id}>
 {supplier.name || supplier.id}
 </option>
 ))}
 </select>
 </label>

 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.address")}
 <input
 className="ys-filter-control"
 value={quotationDraft.supplierAddress}
 onChange={(e) => updateQuotationDraft({ supplierAddress: e.target.value })}
 />
 </label>

 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.number")}
 <input className="ys-filter-control" value={quotationDraft.quotationNumber} readOnly />
 </label>
 </div>

 <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.nosRef")}
 <input
 className="ys-filter-control"
 value={quotationDraft.nosRef}
 onChange={(e) => updateQuotationDraft({ nosRef: e.target.value })}
 />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.vosRef")}
 <input
 className="ys-filter-control"
 value={quotationDraft.vosRef}
 onChange={(e) => updateQuotationDraft({ vosRef: e.target.value })}
 />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.paymentMethod")}
 <select
 className="ys-filter-control"
 value={quotationDraft.paymentMethod}
 onChange={(e) => updateQuotationDraft({ paymentMethod: e.target.value })}
 >
 <option value="VIREMENT">{t("app.procurement.quotation.payment.VIREMENT")}</option>
 <option value="CHEQUE">{t("app.procurement.quotation.payment.CHEQUE")}</option>
 <option value="ESPECES">{t("app.procurement.quotation.payment.ESPECES")}</option>
 <option value="MOBILE_MONEY">{t("app.procurement.quotation.payment.MOBILE_MONEY")}</option>
 </select>
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.discount")}
 <input
 className="ys-filter-control"
 type="number"
 min={0}
 max={100}
 value={quotationDraft.globalDiscountPct}
 onChange={(e) => updateQuotationDraft({ globalDiscountPct: Math.max(0, Number(e.target.value || 0)) })}
 />
 </label>
 </div>

 <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.issueDate")}
 <input
 className="ys-filter-control"
 type="date"
 value={quotationDraft.issueDate}
 onChange={(e) => updateQuotationDraft({ issueDate: e.target.value })}
 />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.validUntil")}
 <input
 className="ys-filter-control"
 type="date"
 value={quotationDraft.validUntil}
 onChange={(e) => updateQuotationDraft({ validUntil: e.target.value })}
 />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.systemDate")}
 <input className="ys-filter-control" type="date" value={quotationDraft.systemDate} readOnly />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.form.installments")}
 <input
 className="ys-filter-control"
 type="number"
 min={1}
 value={quotationDraft.installments}
 onChange={(e) => updateQuotationDraft({ installments: Math.max(1, Number(e.target.value || 1)) })}
 />
 </label>
 </div>

 <div className="mt-3 flex flex-wrap items-center gap-3">
 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 checked={quotationDraft.applyVat}
 onChange={(e) => updateQuotationDraft({ applyVat: e.target.checked })}
 />
 <span>{t("app.procurement.quotation.form.applyVat")}</span>
 </label>
 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 checked={quotationDraft.applyRetenue ?? true}
 onChange={(e) => updateQuotationDraft({ applyRetenue: e.target.checked })}
 />
 <span>{t("app.procurement.quotation.form.applyRetenue")}</span>
 </label>
 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 checked={quotationDraft.referralPartner}
 onChange={(e) => updateQuotationDraft({ referralPartner: e.target.checked })}
 />
 <span>{t("app.procurement.quotation.form.referralPartner")}</span>
 </label>
 <label className="inline-flex items-center gap-2 text-sm text-foreground">
 <input
 type="checkbox"
 checked={quotationDraft.inStockOnly}
 onChange={(e) => updateQuotationDraft({ inStockOnly: e.target.checked })}
 />
 <span>{t("app.procurement.quotation.form.inStockOnly")}</span>
 </label>
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="ys-section-title">{t("app.procurement.quotation.lines.title")}</div>
 <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[2fr_100px_140px_140px_80px]">
 <label className="ys-filter-label">
 {t("app.procurement.quotation.lines.product")}
 <select
 className="ys-filter-control"
 value={quotationLineProductId}
 onChange={(e) => onQuotationLineProductChange(e.target.value)}
 >
 <option value="">{t("app.procurement.quotation.lines.productPlaceholder")}</option>
 {products.map((product) => (
 <option key={product.id} value={product.id}>
 {(product.sku || "—") + " • " + (product.name || product.description || t("app.procurement.unnamed"))}
 </option>
 ))}
 </select>
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.lines.qty")}
 <input
 className="ys-filter-control"
 type="number"
 min={1}
 value={quotationLineQty}
 onChange={(e) => setQuotationLineQty(Math.max(1, Number(e.target.value || 1)))}
 />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.lines.unitPrice")}
 <input
 className="ys-filter-control"
 type="number"
 min={0}
 value={quotationLineUnitPrice}
 onChange={(e) => setQuotationLineUnitPrice(e.target.value)}
 />
 </label>
 <label className="ys-filter-label">
 {t("app.procurement.quotation.lines.stock")}
 <input
 className="ys-filter-control"
 readOnly
 value={quotationLineProductId ? String(qtyByProduct.get(quotationLineProductId) || 0) : "—"}
 />
 </label>
 <div className="flex items-end">
 <button type="button" className="ys-btn-primary h-10 w-full px-0" onClick={addQuotationLine}>
 +
 </button>
 </div>
 </div>

 {quotationError ? <div className="ys-alert-error mt-3">{quotationError}</div> : null}

 <div className="ys-table-wrap mt-4">
 <table className="ys-table min-w-[860px]">
 <thead className="ys-table-head bg-muted/30">
 <tr>
 <th className="ys-table-cell pl-4">{t("app.procurement.quotation.lines.table.product")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.qty")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.unitPrice")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.subtotal")}</th>
 <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card text-foreground">
 {quotationDraft.lines.map((line) => (
 <tr key={line.id}>
 <td className="ys-table-cell pl-4">
 <div className="font-medium">{line.productName}</div>
 <div className="text-xs font-mono text-muted-foreground">{line.sku}</div>
 </td>
 <td className="ys-table-cell">
 <input
 className="ys-input h-9 w-24"
 type="number"
 min={1}
 value={line.qty}
 onChange={(e) => updateQuotationLineQty(line.id, Number(e.target.value || 1))}
 />
 </td>
 <td className="ys-table-cell">
 <input
 className="ys-input h-9 w-32"
 type="number"
 min={0}
 value={line.unitPrice}
 onChange={(e) => updateQuotationLinePrice(line.id, Number(e.target.value || 0))}
 />
 </td>
 <td className="ys-table-cell font-semibold">{formatMoney(line.qty * line.unitPrice)}</td>
 <td className="ys-table-cell">
 <button
 type="button"
 className="ys-icon-btn-delete"
 onClick={() => removeQuotationLine(line.id)}
 aria-label={t("app.procurement.quotation.lines.remove")}
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
 </svg>
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {!quotationDraft.lines.length ? (
 <div className="mt-3 text-sm text-muted-foreground">{t("app.procurement.quotation.lines.empty")}</div>
 ) : null}

 <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-7">
 <div className="ys-card p-3">
 <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.ht")}</div>
 <div className="mt-1 text-lg font-semibold">{formatMoney(quotationDraftTotals.ht)}</div>
 </div>
 <div className="ys-card p-3">
 <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.vat")}</div>
 <div className="mt-1 text-lg font-semibold">{formatMoney(quotationDraftTotals.vat)}</div>
 </div>
 <div className="ys-card p-3">
 <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.ttc")}</div>
 <div className="mt-1 text-lg font-semibold">{formatMoney(quotationDraftTotals.ttc)}</div>
 </div>
 <div className="ys-card p-3">
 <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.discount")}</div>
 <div className="mt-1 text-lg font-semibold">{formatMoney(quotationDraftTotals.discount)}</div>
 </div>
 {(quotationDraft.applyRetenue ?? true) && (
 <>
 <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
 <div className="text-[11px] uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">{t("app.procurement.quotation.total.air")}</div>
 <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">- {formatMoney(quotationDraftTotals.air ?? 0)}</div>
 </div>
 <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
 <div className="text-[11px] uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">{t("app.procurement.quotation.total.ir")}</div>
 <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">- {formatMoney(quotationDraftTotals.ir ?? 0)}</div>
 </div>
 </>
 )}
 <div className="ys-card border-primary/20 bg-primary/5 p-3">
 <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.final")}</div>
 <div className="mt-1 text-lg font-semibold text-primary">{formatMoney(payableTotal(quotationDraftTotals))}</div>
 </div>
 </div>

 <div className="mt-4 flex items-center justify-end gap-2">
 <button type="button" className="ys-btn-secondary text-xs" onClick={() => setQuotationOpen(false)}>
 {t("app.procurement.quotation.action.discard")}
 </button>
 <button type="button" className="ys-btn-primary text-xs" onClick={saveQuotation}>
 {t("app.procurement.quotation.action.save")}
 </button>
 </div>
 </div>
 </div>
 </Modal>

 <Modal
 open={requisitionOpen}
 title={t("app.procurement.requisition.title")}
 onClose={() => setRequisitionOpen(false)}
 >
 <div className="space-y-3">
 <p className="text-sm text-muted-foreground">{t("app.procurement.requisition.subtitle")}</p>
 <textarea
 className="ys-input"
 rows={2}
 value={requisitionNote}
 onChange={(e) => setRequisitionNote(e.target.value)}
 placeholder={t("app.procurement.requisition.notePlaceholder")}
 />

 <div className="ys-table-wrap">
 <table className="ys-table min-w-[760px]">
 <thead className="ys-table-head bg-muted/30">
 <tr>
 <th className="ys-table-cell pl-4">{t("app.procurement.requisition.table.part")}</th>
 <th className="ys-table-cell">{t("app.procurement.requisition.table.qty")}</th>
 <th className="ys-table-cell">{t("app.procurement.requisition.table.action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card text-foreground">
 {requisitionItems.map((it) => (
 <tr key={it.productId}>
 <td className="ys-table-cell pl-4">
 <div className="font-mono text-xs text-muted-foreground">{it.sku}</div>
 <div className="font-medium">{it.name}</div>
 </td>
 <td className="ys-table-cell">
 <input
 type="number"
 min={1}
 value={it.qty}
 onChange={(e) =>
 setRequisitionItems((prev) =>
 prev.map((p) =>
 p.productId === it.productId ? { ...p, qty: Math.max(1, Number(e.target.value || 1)) } : p
 )
 )
 }
 className="w-28 ys-input"
 />
 </td>
 <td className="ys-table-cell">
 <button
 type="button"
 onClick={() => setRequisitionItems((prev) => prev.filter((p) => p.productId !== it.productId))}
 className="ys-btn-danger gap-2"
 >
 <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
 </svg>
 {t("app.procurement.requisition.remove")}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {!requisitionItems.length && (
 <div className="text-sm text-muted-foreground">{t("app.procurement.requisition.empty")}</div>
 )}

 <div className="flex flex-wrap items-center justify-between gap-3">
 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportRequisition("csv")}
 onPdf={() => exportRequisition("pdf")}
 />
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 setRequisitionItems([]);
 setRequisitionNote("");
 showToast("success", t("app.procurement.requisition.cleared"));
 }}
 className="ys-btn-secondary text-xs"
 >
 {t("app.procurement.requisition.clear")}
 </button>
 <button
 type="button"
 onClick={() => setRequisitionOpen(false)}
 className="ys-btn-primary text-xs"
 >
 {t("app.procurement.requisition.close")}
 </button>
 </div>
 </div>
 </div>
 </Modal>
 </main>
 );
}
