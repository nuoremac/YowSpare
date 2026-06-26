"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { AgenciesService, EmployeesRolesService } from "@/lib";
import type { Agency, OrganizationMember } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type { Product, ProductCategory, StockLevel, StockMovement } from "@/lib-stock";
import { AnalyticsService } from "@/lib-spare/appServices";
import type { AnalyticsRecommendation } from "@/lib-spare/appServices";
import { usePageSearch } from "@/components/PageSearchContext";
import { hasOrganizationAccess } from "@/lib/accessControl";
import { useT } from "@/components/i18n/useT";
import MovableModal from "@/components/MovableModal";
import ExportMenu from "@/components/ExportMenu";
import { downloadCsv, printTablePdf } from "@/lib/exportFiles";

type StockStatus = "OK" | "LOW" | "OUT";
type Priority = "CRITICAL" | "HIGH" | "NORMAL";
type ViewTab = "REPLENISHMENT" | "CYCLE" | "MAINTENANCE";
type SortKey = "priority" | "suggested" | "cover" | "usage" | "onHand" | "sku" | "lastMove";
type SortDir = "asc" | "desc";
type LocationFilter = "ALL" | { agencyId: string };

const CYCLE_KEY = "yowspare-cyclecount-v1";

function formatDate(value?: string) {
 if (!value) return "—";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function fmtNumber(value: number) {
 if (!Number.isFinite(value)) return "—";
 if (Math.abs(value) >= 100) return String(Math.round(value));
 return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function toMaybeNumber(value: unknown) {
 if (typeof value === "number") return Number.isFinite(value) ? value : null;
 if (typeof value === "string") {
 const n = Number.parseFloat(value);
 return Number.isFinite(n) ? n : null;
 }
 return null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
 if (!value || typeof value !== "object" || Array.isArray(value)) return false;
 return Object.values(value).every((entry) => typeof entry === "string");
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
 <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-card p-5 shadow-xl ">
 <div className="flex items-start justify-between gap-4">
 <div className="ys-section-title">
 {title}
 </div>
 <button
 type="button"
 onClick={onClose}
 className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-slate-300"
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

export default function PlannerPage() {
 const { t } = useT();
 const { query } = usePageSearch();
 const router = useRouter();
 const { tenant, user, logout, activeAgencyId, roles: sessionRoles } = useSession();

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

 const [recommendations, setRecommendations] = useState<AnalyticsRecommendation[]>([]);
 const [recommendationsLoading, setRecommendationsLoading] = useState(false);

 const [tab, setTab] = useState<ViewTab>("REPLENISHMENT");
 const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
 const [location, setLocation] = useState<LocationFilter>("ALL");
 const [statusFilter, setStatusFilter] = useState<"ALL" | StockStatus>("ALL");
 const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
 const [criticalOnly, setCriticalOnly] = useState(false);
 const [sortKey, setSortKey] = useState<SortKey>("priority");
 const [sortDir, setSortDir] = useState<SortDir>("desc");
 const [page, setPage] = useState(1);
 const pageSize = 12;

 const [detailsId, setDetailsId] = useState<string | null>(null);
 const [detailsOpen, setDetailsOpen] = useState(false);

 const [batchOpen, setBatchOpen] = useState(false);
 const [batchNote, setBatchNote] = useState("");
 const [batchItems, setBatchItems] = useState<Array<{ productId: string; sku: string; name: string; qty: number }>>(
 []
 );

 const [cycleMap, setCycleMap] = useState<Record<string, string>>({});

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
 const raw = localStorage.getItem(CYCLE_KEY);
 const parsed = raw ? JSON.parse(raw) : {};
 setCycleMap(isStringRecord(parsed) ? parsed : {});
 } catch {
 setCycleMap({});
 }
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
 setLoadError(t("app.planner.error.load"));
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
 const agencyId = location === "ALL" ? null : location.agencyId;
 if (!tenant || !agencyId) {
 setRecommendations([]);
 return;
 }
 setRecommendationsLoading(true);
 try {
 let recs = await AnalyticsService.listReorderRecommendations(agencyId);
 if (!mounted) return;
 if (!recs?.length || rangeDays !== 30) {
 recs = await AnalyticsService.recomputeReorderRecommendations(agencyId, rangeDays);
 if (!mounted) return;
 }
 setRecommendations(recs || []);
 } catch (err: unknown) {
 if (!mounted) return;
 console.error(err);
 setRecommendations([]);
 } finally {
 if (mounted) setRecommendationsLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [location, logout, rangeDays, reloadSeq, router, tenant]);

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
 }, [tab, rangeDays, location, statusFilter, categoryFilter, criticalOnly, sortKey, sortDir, query]);

 const canPlan = hasOrganizationAccess(
 {
 authorities: sessionRoles,
 memberRole: orgMember?.roleName,
 organization: tenant,
 user,
 },
 ["procurement:write"],
 );

 const agencyById = useMemo(() => {
 const map = new Map<string, Agency>();
 for (const a of agencies) if (a.id) map.set(a.id, a);
 return map;
 }, [agencies]);

 const categoryNameById = useMemo(() => {
 const map = new Map<string, string>();
 for (const c of categories) if (c.id) map.set(c.id, c.name || "—");
 return map;
 }, [categories]);

 const selectedAgencyId = useMemo(() => {
 if (location === "ALL") return null;
 return location.agencyId;
 }, [location]);

 const recommendationByProduct = useMemo(() => {
 const map = new Map<string, AnalyticsRecommendation>();
 for (const r of recommendations || []) {
 if (r?.productId) map.set(r.productId, r);
 }
 return map;
 }, [recommendations]);

 const qtyByProduct = useMemo(() => {
 const map = new Map<string, number>();
 for (const s of levels) {
 const pid = s.productId;
 if (!pid) continue;
 if (selectedAgencyId && s.agencyId !== selectedAgencyId) continue;
 map.set(pid, (map.get(pid) || 0) + (s.quantity || 0));
 }
 return map;
 }, [levels, selectedAgencyId]);

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

 const rangeStart = useMemo(() => {
 const d = new Date();
 d.setDate(d.getDate() - rangeDays);
 return d;
 }, [rangeDays]);

 const outUsageByProduct = useMemo(() => {
 const map = new Map<string, number>();
 for (const mv of movements) {
 if (mv.type !== "OUT") continue;
 if (mv.status && mv.status !== "VALIDATED") continue;
 if (selectedAgencyId && mv.sourceAgencyId && mv.sourceAgencyId !== selectedAgencyId) continue;
 const when = mv.date || mv.validatedAt;
 if (!when) continue;
 const ts = new Date(when).getTime();
 if (!Number.isFinite(ts)) continue;
 if (ts < rangeStart.getTime()) continue;
 for (const it of mv.items || []) {
 const pid = it.productId;
 if (!pid) continue;
 map.set(pid, (map.get(pid) || 0) + (it.quantity || 0));
 }
 }
 return map;
 }, [movements, rangeStart, selectedAgencyId]);

 const avgDailyUsageByProduct = useMemo(() => {
 const map = new Map<string, number>();
 for (const [pid, qty] of outUsageByProduct.entries()) {
 map.set(pid, qty / Math.max(1, rangeDays));
 }
 return map;
 }, [outUsageByProduct, rangeDays]);

 const lastMoveByProduct = useMemo(() => {
 const map = new Map<string, string>();
 for (const mv of movements) {
 if (mv.status && mv.status !== "VALIDATED") continue;
 const when = mv.date || mv.validatedAt;
 if (!when) continue;
 if (selectedAgencyId) {
 const affects =
 mv.sourceAgencyId === selectedAgencyId || mv.destinationAgencyId === selectedAgencyId;
 if (!affects) continue;
 }
 for (const it of mv.items || []) {
 const pid = it.productId;
 if (!pid) continue;
 const existing = map.get(pid);
 if (!existing || new Date(when).getTime() > new Date(existing).getTime()) map.set(pid, when);
 }
 }
 return map;
 }, [movements, selectedAgencyId]);

 const rows = useMemo(() => {
 const needle = query.trim().toLowerCase();
 const out: Array<{
 id: string;
 sku: string;
 name: string;
 category: string;
 categoryId: string;
 onHand: number;
 min: number;
 status: StockStatus;
 usage: number;
 cover: number;
 suggested: number;
 priority: Priority;
 lastMove: string;
 }> = [];

 for (const p of products) {
 if (!p.id) continue;
 const sku = p.sku || "—";
 const name = p.name || p.description || t("app.planner.unnamed");
 const catId = p.categoryId || "";
 const catName = p.categoryName || (catId ? categoryNameById.get(catId) || "—" : "—");
 const onHand = qtyByProduct.get(p.id) || 0;
 const min = typeof p.minStockLevel === "number" ? p.minStockLevel : 0;
 const status: StockStatus = onHand <= 0 ? "OUT" : min > 0 && onHand <= min ? "LOW" : "OK";
 const fallbackSuggested = min > 0 ? Math.max(0, min - onHand) : 0;

 const rec = recommendationByProduct.get(p.id);
 const recUsage = toMaybeNumber(rec?.avgDailyUsage);
 const recCover = toMaybeNumber(rec?.daysOfCover);
 const usage = recUsage ?? avgDailyUsageByProduct.get(p.id) ?? 0;
 const cover = recCover ?? (usage > 0 ? onHand / usage : Number.POSITIVE_INFINITY);
 const recSuggested = typeof rec?.suggestedReorderQty === "number" ? rec.suggestedReorderQty : 0;
 const suggested = Math.max(recSuggested, fallbackSuggested);

 let priority: Priority = "NORMAL";
 if (status === "OUT") priority = "CRITICAL";
 else if (status === "LOW") priority = "HIGH";
 else if (Number.isFinite(cover) && cover <= 3) priority = "HIGH";

 if (needle) {
 const hit =
 sku.toLowerCase().includes(needle) ||
 name.toLowerCase().includes(needle) ||
 (catName || "").toLowerCase().includes(needle);
 if (!hit) continue;
 }
 if (categoryFilter !== "ALL" && catId !== categoryFilter) continue;
 if (statusFilter !== "ALL" && status !== statusFilter) continue;
 if (criticalOnly && !(priority === "CRITICAL" || priority === "HIGH")) continue;

 out.push({
 id: p.id,
 sku,
 name,
 category: catName || "—",
 categoryId: catId,
 onHand,
 min,
 status,
 usage,
 cover,
 suggested,
 priority,
 lastMove: lastMoveByProduct.get(p.id) || "",
 });
 }

 const rankPriority = (p: Priority) => (p === "CRITICAL" ? 3 : p === "HIGH" ? 2 : 1);
 const dir = sortDir === "asc" ? 1 : -1;
 const cmp = (x: string | number, y: string | number) => (x > y ? 1 : x < y ? -1 : 0);
 out.sort((a, b) => {
 if (sortKey === "priority") return dir * cmp(rankPriority(a.priority), rankPriority(b.priority));
 if (sortKey === "suggested") return dir * cmp(a.suggested, b.suggested);
 if (sortKey === "cover") return dir * cmp(a.cover, b.cover);
 if (sortKey === "usage") return dir * cmp(a.usage, b.usage);
 if (sortKey === "onHand") return dir * cmp(a.onHand, b.onHand);
 if (sortKey === "sku") return dir * cmp(a.sku, b.sku);
 if (sortKey === "lastMove") return dir * cmp(a.lastMove, b.lastMove);
 return 0;
 });

 return out;
 }, [
 avgDailyUsageByProduct,
 categoryFilter,
 categoryNameById,
 criticalOnly,
 lastMoveByProduct,
 products,
 qtyByProduct,
 query,
 sortDir,
 sortKey,
 statusFilter,
 t,
 recommendationByProduct,
 ]);

 const replenRows = useMemo(() => rows.filter((r) => r.min > 0 && (r.status === "LOW" || r.status === "OUT")), [rows]);

 const kpis = useMemo(() => {
 const candidates = replenRows.length;
 const belowMin = replenRows.length;
 const outCount = replenRows.filter((r) => r.status === "OUT").length;
 const suggestedTotal = replenRows.reduce((acc, r) => acc + (r.suggested || 0), 0);
 const stockoutSoon = rows.filter((r) => Number.isFinite(r.cover) && r.cover <= 7 && r.usage > 0).length;
 return { candidates, belowMin, outCount, suggestedTotal, stockoutSoon };
 }, [replenRows, rows]);

 const tableRows = useMemo(() => (tab === "REPLENISHMENT" ? replenRows : rows), [replenRows, rows, tab]);

 const paged = useMemo(() => {
 const total = tableRows.length;
 const totalPages = Math.max(1, Math.ceil(total / pageSize));
 const safePage = Math.min(page, totalPages);
 const start = (safePage - 1) * pageSize;
 return { total, totalPages, page: safePage, items: tableRows.slice(start, start + pageSize) };
 }, [page, tableRows]);

 const detailsProduct = useMemo(() => {
 if (!detailsId) return null;
 return products.find((p) => p.id === detailsId) || null;
 }, [detailsId, products]);

 const productById = useMemo(() => {
 const map = new Map<string, Product>();
 products.forEach((product) => {
 if (product.id) map.set(product.id, product);
 });
 return map;
 }, [products]);

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
 .sort(
 (a, b) =>
 new Date(b.date || b.validatedAt || 0).getTime() - new Date(a.date || a.validatedAt || 0).getTime()
 );
 return list.slice(0, 12);
 }, [detailsId, movements]);

 const openDetails = (id: string) => {
 setDetailsId(id);
 setDetailsOpen(true);
 };

 const startBatch = () => {
 if (!canPlan) {
 showToast("error", t("app.planner.batch.forbidden"));
 return;
 }
 const items = replenRows
 .filter((r) => (r.suggested || 0) > 0)
 .slice(0, 80)
 .map((r) => ({ productId: r.id, sku: r.sku, name: r.name, qty: Math.max(1, r.suggested || 1) }));
 setBatchItems(items);
 setBatchOpen(true);
 };

 const exportBatch = (format: "csv" | "pdf") => {
 const headers = ["SKU", "Name", "Qty"];
 const rowsOut = batchItems.map((it) => [it.sku, it.name, it.qty]);
 if (format === "csv") {
 downloadCsv(`yowspare-plan-${new Date().toISOString().slice(0, 10)}.csv`, headers, rowsOut);
 showToast("success", t("app.planner.batch.exported"));
 return;
 }
 printTablePdf({
 title: t("app.planner.batch.title"),
 headers,
 rows: rowsOut,
 });
 showToast("success", t("app.planner.batch.exported"));
 };

 const getTableExport = () => {
 const headers = [
 t("app.planner.table.sku"),
 t("app.planner.table.part"),
 t("app.planner.table.onHand"),
 t("app.planner.table.min"),
 t("app.planner.table.usage"),
 t("app.planner.table.cover"),
 t("app.planner.table.suggested"),
 t("app.planner.table.priority"),
 t("app.planner.table.lastMove"),
 ];
 const rowsOut = tableRows.map((r) => [
 r.sku,
 r.name,
 r.onHand,
 r.min,
 fmtNumber(r.usage),
 Number.isFinite(r.cover) ? fmtNumber(r.cover) : "∞",
 r.suggested,
 r.priority,
 r.lastMove ? formatDate(r.lastMove) : "—",
 ]);
 return { headers, rowsOut };
 };

 const exportTable = (format: "csv" | "pdf") => {
 const { headers, rowsOut } = getTableExport();
 if (format === "csv") {
 downloadCsv(`yowspare-planner-${new Date().toISOString().slice(0, 10)}.csv`, headers, rowsOut);
 return;
 }
 printTablePdf({
 title: t("app.planner.title"),
 headers,
 rows: rowsOut,
 });
 };

 const cycleCandidates = useMemo(() => {
 const byQty = Array.from(outUsageByProduct.entries())
 .map(([productId, qty]) => ({ productId, qty }))
 .sort((a, b) => (b.qty || 0) - (a.qty || 0))
 .slice(0, 20);
 const highMoverIds = new Set(byQty.map((x) => x.productId));
 const lowIds = new Set(replenRows.map((r) => r.id));

 const items = products
 .filter((p) => !!p.id)
 .map((p) => {
 const pid = p.id as string;
 const sku = p.sku || "—";
 const name = p.name || p.description || t("app.planner.unnamed");
 const onHand = qtyByProduct.get(pid) || 0;
 const lastCounted = cycleMap[pid] || "";
 const stale =
 !lastCounted || new Date(lastCounted).getTime() < new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).getTime();
 let reason: "LOW" | "MOVER" | "STALE" = "STALE";
 if (lowIds.has(pid)) reason = "LOW";
 else if (highMoverIds.has(pid)) reason = "MOVER";
 else if (stale) reason = "STALE";
 const score = (reason === "LOW" ? 3 : reason === "MOVER" ? 2 : 1) * 1000 + (highMoverIds.has(pid) ? 10 : 0);
 return { productId: pid, sku, name, onHand, lastCounted, reason, score };
 })
 .filter((x) => x.reason === "LOW" || x.reason === "MOVER" || x.reason === "STALE")
 .sort((a, b) => b.score - a.score)
 .slice(0, 40);

 const needle = query.trim().toLowerCase();
 return needle
 ? items.filter(
 (x) => x.sku.toLowerCase().includes(needle) || x.name.toLowerCase().includes(needle)
 )
 : items;
 }, [cycleMap, outUsageByProduct, products, query, qtyByProduct, replenRows, t]);

 const markCounted = (productId: string) => {
 const now = new Date().toISOString();
 setCycleMap((prev) => {
 const next = { ...prev, [productId]: now };
 try {
 localStorage.setItem(CYCLE_KEY, JSON.stringify(next));
 } catch {
 // ignore
 }
 return next;
 });
 showToast("success", t("app.planner.cycle.counted"));
 };

 return (
 <main className="p-6 space-y-4">
 <div className="ys-header-card p-5">
 <div className="flex items-center gap-2">
 <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground ">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M4 12h10" strokeLinecap="round" />
 <path d="M4 17h16" strokeLinecap="round" />
 <path d="M18 9v6" strokeLinecap="round" />
 </svg>
 </span>
 <h2 className="text-lg font-semibold">{t("app.planner.title")}</h2>
 </div>
 <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">{t("app.planner.subtitle")}</p>

 <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground ">
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.planner.context.tenant")}</span>
 <span className="font-semibold">{tenant?.name || tenant?.code || t("app.workspace.fallback")}</span>
 </span>
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.planner.context.location")}</span>
 <span className="font-semibold">
 {location === "ALL"
 ? t("app.planner.location.all")
 : agencyById.get(location.agencyId)?.name || location.agencyId}
 </span>
 </span>
 {lastSyncedAt && (
 <span className="inline-flex items-center gap-2">
 <span className="text-muted-foreground dark:text-muted-foreground">{t("app.planner.synced")}</span>
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
 className="border border-rose-200 bg-card px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-100"
 onClick={() => setReloadSeq((n) => n + 1)}
 >
 {t("app.planner.error.retry")}
 </button>
 </div>
 )}

 <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.kpi.belowMin")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.belowMin}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.kpi.out")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.outCount}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.kpi.suggested")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.suggestedTotal}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.kpi.stockoutSoon")}</div>
 <div className="mt-1 text-2xl font-semibold">{loading ? "—" : kpis.stockoutSoon}</div>
 </div>
 <div className="ys-card p-4">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.kpi.range")}</div>
 <div className="mt-1 text-sm font-semibold">{t("app.planner.range.value", { days: rangeDays })}</div>
 </div>
 </section>

 <section className="ys-card p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setTab("REPLENISHMENT")}
 className={[
 "px-3 py-1.5 text-xs font-semibold transition",
 tab === "REPLENISHMENT"
 ? "bg-[var(--brand)] text-white"
 : "border border-border bg-card rounded-xl text-foreground hover:border-slate-300 ",
 ].join(" ")}
 >
 {t("app.planner.tab.replenishment")}
 </button>
 <button
 type="button"
 onClick={() => setTab("CYCLE")}
 className={[
 "px-3 py-1.5 text-xs font-semibold transition",
 tab === "CYCLE"
 ? "bg-[var(--brand)] text-white"
 : "border border-border bg-card rounded-xl text-foreground hover:border-slate-300 ",
 ].join(" ")}
 >
 {t("app.planner.tab.cycle")}
 </button>
 <button
 type="button"
 onClick={() => setTab("MAINTENANCE")}
 className={[
 "px-3 py-1.5 text-xs font-semibold transition",
 tab === "MAINTENANCE"
 ? "bg-[var(--brand)] text-white"
 : "border border-border rounded-xl bg-slate-100 text-muted-foreground dark:bg-slate-800/40 dark:text-muted-foreground",
 ].join(" ")}
 disabled
 >
 {t("app.planner.tab.maintenance")}
 </button>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <div className="text-xs font-semibold text-muted-foreground ">{t("app.planner.range.label")}</div>
 {[7, 30, 90].map((d) => (
 <button
 key={d}
 type="button"
 onClick={() => setRangeDays(d as 7 | 30 | 90)}
 className={[
 "px-3 py-1.5 text-xs font-semibold transition",
 rangeDays === d
 ? "bg-[var(--brand)] text-white"
 : "border border-border bg-card rounded-xl text-foreground hover:border-slate-300 ",
 ].join(" ")}
 >
 {t(`app.planner.range.${d as 7 | 30 | 90}`)}
 </button>
 ))}
 </div>
 </div>

 <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.planner.filters.location")}
 <select
 className="mt-1 w-full border border-border bg-card rounded-xl px-2 py-2 text-sm text-foreground "
 value={location === "ALL" ? "ALL" : location.agencyId}
 onChange={(e) => {
 const v = e.target.value;
 setLocation(v === "ALL" ? "ALL" : { agencyId: v });
 }}
 >
 <option value="ALL">{t("app.planner.location.all")}</option>
 {agencies.map((a) => (
 <option key={a.id} value={a.id || ""}>
 {a.name || a.shortName || a.code || a.id}
 </option>
 ))}
 </select>
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.planner.filters.status")}
 <select
 className="mt-1 w-full border border-border bg-card rounded-xl px-2 py-2 text-sm text-foreground "
 value={statusFilter}
 onChange={(e) => {
 const value = e.target.value;
 setStatusFilter(value === "OK" || value === "LOW" || value === "OUT" ? value : "ALL");
 }}
 >
 <option value="ALL">{t("app.planner.filter.all")}</option>
 <option value="OK">{t("app.planner.status.ok")}</option>
 <option value="LOW">{t("app.planner.status.low")}</option>
 <option value="OUT">{t("app.planner.status.out")}</option>
 </select>
 </label>

 <label className="block text-xs font-semibold text-muted-foreground ">
 {t("app.planner.filters.category")}
 <select
 className="mt-1 w-full border border-border bg-card rounded-xl px-2 py-2 text-sm text-foreground "
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 >
 <option value="ALL">{t("app.planner.filter.all")}</option>
 {categories.map((c) => (
 <option key={c.id} value={c.id || ""}>
 {c.name || c.id}
 </option>
 ))}
 </select>
 </label>

 <label className="flex items-center gap-2 pt-6 text-xs font-semibold text-muted-foreground ">
 <input
 type="checkbox"
 checked={criticalOnly}
 onChange={(e) => setCriticalOnly(e.target.checked)}
 className="h-4 w-4 accent-[var(--brand)]"
 />
 {t("app.planner.filters.critical")}
 </label>

 <div className="flex flex-wrap items-end justify-end gap-2 pt-4 md:pt-0">
 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportTable("csv")}
 onPdf={() => exportTable("pdf")}
 className="inline-flex items-center gap-2 border border-border bg-card rounded-xl px-3 py-2 text-xs font-semibold text-foreground transition hover:border-slate-300"
 />
 <button
 type="button"
 onClick={startBatch}
 className={[
 "inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition",
 canPlan
 ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
 : "border border-border rounded-xl bg-slate-100 text-muted-foreground dark:bg-slate-800/40 dark:text-muted-foreground",
 ].join(" ")}
 aria-disabled={!canPlan}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M4 12h10" strokeLinecap="round" />
 <path d="M4 17h16" strokeLinecap="round" />
 <path d="M17 10v6" strokeLinecap="round" />
 </svg>
 {t("app.planner.action.batch")}
 </button>
 </div>
 </div>

 {tab === "CYCLE" ? (
 <div className="mt-4 overflow-x-auto border border-border rounded-xl ">
 <table className="min-w-[900px] w-full border-collapse text-left text-sm">
 <thead className="bg-slate-50 text-xs text-muted-foreground dark:text-muted-foreground">
 <tr>
 <th className="px-3 py-2">{t("app.planner.cycle.table.sku")}</th>
 <th className="px-3 py-2">{t("app.planner.cycle.table.part")}</th>
 <th className="px-3 py-2">{t("app.planner.cycle.table.onHand")}</th>
 <th className="px-3 py-2">{t("app.planner.cycle.table.reason")}</th>
 <th className="px-3 py-2">{t("app.planner.cycle.table.lastCounted")}</th>
 <th className="px-3 py-2">{t("app.planner.cycle.table.action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 bg-card text-foreground dark:divide-slate-800 ">
 {cycleCandidates.map((c) => {
 const product = productById.get(c.productId);
 return (
 <tr key={c.productId}>
 <td className="px-3 py-2 font-mono text-xs">{c.sku}</td>
 <td className="px-3 py-2">
 <div className="flex min-w-0 items-center gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={product}
 productId={c.productId}
 alt={c.name || c.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback />}
 />
 </div>
 <div className="truncate font-medium">{c.name}</div>
 </div>
 </td>
 <td className="px-3 py-2 font-semibold">{c.onHand}</td>
 <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">
 {c.reason === "LOW"
 ? t("app.planner.cycle.reason.low")
 : c.reason === "MOVER"
 ? t("app.planner.cycle.reason.mover")
 : t("app.planner.cycle.reason.stale")}
 </td>
 <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">
 {c.lastCounted ? formatDate(c.lastCounted) : "—"}
 </td>
 <td className="px-3 py-2">
 <button
 type="button"
 onClick={() => markCounted(c.productId)}
 className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M5 12l4 4L19 6" strokeLinecap="round" />
 </svg>
 {t("app.planner.cycle.count")}
 </button>
 </td>
 </tr>
 );
 })}
 {!cycleCandidates.length && (
 <tr>
 <td className="px-3 py-3 text-muted-foreground dark:text-muted-foreground" colSpan={6}>
 {t("app.planner.cycle.empty")}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="mt-4 overflow-x-auto border border-border rounded-xl ">
 <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
 <thead className="bg-slate-50 text-xs text-muted-foreground dark:text-muted-foreground">
 <tr>
 <th className="px-3 py-2">{t("app.planner.table.sku")}</th>
 <th className="px-3 py-2">{t("app.planner.table.part")}</th>
 <th className="px-3 py-2">{t("app.planner.table.onHand")}</th>
 <th className="px-3 py-2">{t("app.planner.table.min")}</th>
 <th className="px-3 py-2">{t("app.planner.table.usage")}</th>
 <th className="px-3 py-2">{t("app.planner.table.cover")}</th>
 <th className="px-3 py-2">{t("app.planner.table.suggested")}</th>
 <th className="px-3 py-2">{t("app.planner.table.priority")}</th>
 <th className="px-3 py-2">{t("app.planner.table.lastMove")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 bg-card text-foreground dark:divide-slate-800 ">
 {paged.items.map((r) => {
 const product = productById.get(r.id);
 return (
 <tr
 key={r.id}
 className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-950"
 onClick={() => openDetails(r.id)}
 >
 <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
 <td className="px-3 py-2">
 <div className="flex min-w-0 items-center gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={product}
 productId={r.id}
 alt={r.name || r.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback />}
 />
 </div>
 <div className="min-w-0">
 <div className="font-medium">{r.name}</div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{r.category}</div>
 </div>
 </div>
 </td>
 <td className="px-3 py-2 font-semibold">{r.onHand}</td>
 <td className="px-3 py-2">{r.min || "—"}</td>
 <td className="px-3 py-2">{r.usage ? fmtNumber(r.usage) : "—"}</td>
 <td className="px-3 py-2">{Number.isFinite(r.cover) ? fmtNumber(r.cover) : "∞"}</td>
 <td className="px-3 py-2 font-semibold">{r.suggested || "—"}</td>
 <td className="px-3 py-2">
 <span
 className={[
 "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold",
 r.priority === "CRITICAL"
 ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
 : r.priority === "HIGH"
 ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
 : "border-border bg-slate-50 text-foreground ",
 ].join(" ")}
 >
 {r.priority === "CRITICAL"
 ? t("app.planner.priority.critical")
 : r.priority === "HIGH"
 ? t("app.planner.priority.high")
 : t("app.planner.priority.normal")}
 </span>
 </td>
 <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">
 {r.lastMove ? formatDate(r.lastMove) : "—"}
 </td>
 </tr>
 );
 })}
 {!paged.items.length && (
 <tr>
 <td className="px-3 py-3 text-muted-foreground dark:text-muted-foreground" colSpan={9}>
 {t("app.planner.table.empty")}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 )}

 {tab !== "CYCLE" && tableRows.length > 0 && (
 <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground ">
 <div>
 {t("app.planner.pagination.showing")}{" "}
 <span className="font-semibold">{(paged.page - 1) * pageSize + 1}</span>–
 <span className="font-semibold">{Math.min(paged.total, paged.page * pageSize)}</span>{" "}
 {t("app.planner.pagination.of")} <span className="font-semibold">{paged.total}</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 className="border border-border bg-card rounded-xl px-3 py-1.5 font-semibold text-foreground transition hover:border-slate-300 disabled:opacity-50 "
 disabled={paged.page <= 1}
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 >
 {t("app.planner.pagination.prev")}
 </button>
 <div className="font-semibold">
 {paged.page} / {paged.totalPages}
 </div>
 <button
 type="button"
 className="border border-border bg-card rounded-xl px-3 py-1.5 font-semibold text-foreground transition hover:border-slate-300 disabled:opacity-50 "
 disabled={paged.page >= paged.totalPages}
 onClick={() => setPage((p) => Math.min(paged.totalPages, p + 1))}
 >
 {t("app.planner.pagination.next")}
 </button>
 </div>
 </div>
 )}
 </section>

 <Drawer
 open={detailsOpen}
 title={t("app.planner.details.label")}
 onClose={() => {
 setDetailsOpen(false);
 setDetailsId(null);
 }}
 >
 {!detailsProduct ? (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.common.loading")}</div>
 ) : (
 <div className="space-y-4">
 <div className="ys-card p-4">
 <div className="mb-3 grid h-24 w-24 place-items-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={detailsProduct}
 alt={detailsProduct.name || detailsProduct.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback className="h-7 w-7" />}
 />
 </div>
 <div className="ys-section-title">
 {detailsProduct.sku || "—"}
 </div>
 <div className="mt-1 text-lg font-semibold text-foreground ">
 {detailsProduct.name || detailsProduct.description || t("app.planner.unnamed")}
 </div>
 <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-foreground ">
 <div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.category")}</div>
 <div className="font-medium">
 {detailsProduct.categoryName ||
 (detailsProduct.categoryId ? categoryNameById.get(detailsProduct.categoryId) : "") ||
 "—"}
 </div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.min")}</div>
 <div className="font-medium">{detailsProduct.minStockLevel ?? "—"}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.onHand")}</div>
 <div className="font-medium">{qtyByProduct.get(detailsProduct.id || "") || 0}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.usage")}</div>
 <div className="font-medium">
 {avgDailyUsageByProduct.get(detailsProduct.id || "")
 ? fmtNumber(avgDailyUsageByProduct.get(detailsProduct.id || "") || 0)
 : "—"}
 </div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.cover")}</div>
 <div className="font-medium">
 {(() => {
 const usage = avgDailyUsageByProduct.get(detailsProduct.id || "") || 0;
 const onHand = qtyByProduct.get(detailsProduct.id || "") || 0;
 const cover = usage > 0 ? onHand / usage : Number.POSITIVE_INFINITY;
 return Number.isFinite(cover) ? fmtNumber(cover) : "∞";
 })()}
 </div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.lastMove")}</div>
 <div className="font-medium">
 {lastMoveByProduct.get(detailsProduct.id || "")
 ? formatDate(lastMoveByProduct.get(detailsProduct.id || ""))
 : "—"}
 </div>
 </div>
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="ys-section-title">
 {t("app.planner.details.stockByLocation")}
 </div>
 <div className="mt-3 space-y-2 text-sm">
 {detailsLevels.map((l) => (
 <div
 key={l.agencyId}
 className="flex items-center justify-between gap-3 border-b border-border pb-2 "
 >
 <div>
 <div className="font-medium">{l.agencyName}</div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{l.agencyType || "—"}</div>
 </div>
 <div className="font-semibold">{l.qty}</div>
 </div>
 ))}
 {!detailsLevels.length && (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.stockEmpty")}</div>
 )}
 </div>
 </div>

 <div className="ys-card p-4">
 <div className="ys-section-title">
 {t("app.planner.details.movements")}
 </div>
 <div className="mt-3 space-y-2 text-sm">
 {detailsMovements.map((m) => (
 <div
 key={m.id}
 className="flex items-center justify-between gap-3 border border-border bg-card rounded-xl px-3 py-2 "
 >
 <div>
 <div className="font-medium">{m.type || "—"}</div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{formatDate(m.date || m.validatedAt)}</div>
 </div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{m.reference || "—"}</div>
 </div>
 ))}
 {!detailsMovements.length && (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.planner.details.movementsEmpty")}</div>
 )}
 </div>
 </div>
 </div>
 )}
 </Drawer>

 <Modal open={batchOpen} title={t("app.planner.batch.title")} onClose={() => setBatchOpen(false)}>
 <div className="space-y-3">
 <p className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.planner.batch.subtitle")}</p>
 <textarea
 className="w-full border border-border bg-card rounded-xl px-3 py-2 text-sm text-foreground "
 rows={2}
 value={batchNote}
 onChange={(e) => setBatchNote(e.target.value)}
 placeholder={t("app.planner.batch.notePlaceholder")}
 />

 <div className="overflow-x-auto border border-border rounded-xl ">
 <table className="min-w-[760px] w-full border-collapse text-left text-sm">
 <thead className="bg-slate-50 text-xs text-muted-foreground dark:text-muted-foreground">
 <tr>
 <th className="px-3 py-2">{t("app.planner.batch.table.part")}</th>
 <th className="px-3 py-2">{t("app.planner.batch.table.qty")}</th>
 <th className="px-3 py-2">{t("app.planner.batch.table.action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 bg-card text-foreground dark:divide-slate-800 ">
 {batchItems.map((it) => {
 const product = productById.get(it.productId);
 return (
 <tr key={it.productId}>
 <td className="px-3 py-2">
 <div className="flex min-w-0 items-center gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
 <ProductImage
 product={product}
 productId={it.productId}
 alt={it.name || it.sku || t("app.catalog.image.alt")}
 className="h-full w-full object-cover"
 fallback={<ProductImageFallback />}
 />
 </div>
 <div className="min-w-0">
 <div className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">{it.sku}</div>
 <div className="font-medium">{it.name}</div>
 </div>
 </div>
 </td>
 <td className="px-3 py-2">
 <input
 type="number"
 min={1}
 value={it.qty}
 onChange={(e) =>
 setBatchItems((prev) =>
 prev.map((p) =>
 p.productId === it.productId ? { ...p, qty: Math.max(1, Number(e.target.value || 1)) } : p
 )
 )
 }
 className="w-28 border border-border bg-card rounded-xl px-2 py-1.5 text-sm text-foreground "
 />
 </td>
 <td className="px-3 py-2">
 <button
 type="button"
 onClick={() => setBatchItems((prev) => prev.filter((p) => p.productId !== it.productId))}
 className="inline-flex items-center gap-2 border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
 </svg>
 {t("app.planner.batch.remove")}
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {!batchItems.length && (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.planner.batch.empty")}</div>
 )}

 <div className="flex flex-wrap items-center justify-between gap-3">
 <ExportMenu
 label={t("app.common.export")}
 csvLabel={t("app.common.export.csv")}
 pdfLabel={t("app.common.export.pdf")}
 onCsv={() => exportBatch("csv")}
 onPdf={() => exportBatch("pdf")}
 className="inline-flex items-center gap-2 border border-border bg-card rounded-xl px-3 py-2 text-xs font-semibold text-foreground transition hover:border-slate-300"
 />
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 setBatchItems([]);
 setBatchNote("");
 showToast("success", t("app.planner.batch.cleared"));
 }}
 className="border border-border bg-card rounded-xl px-3 py-2 text-xs font-semibold text-foreground transition hover:border-slate-300 "
 >
 {t("app.planner.batch.clear")}
 </button>
 <button
 type="button"
 onClick={() => setBatchOpen(false)}
 className="bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
 >
 {t("app.planner.batch.close")}
 </button>
 </div>
 </div>
 </div>
 </Modal>
 </main>
 );
}
