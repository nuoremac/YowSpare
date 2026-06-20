"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { AgenciesService } from "@/lib";
import type { Agency } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type { Product, StockLevel, StockMovement } from "@/lib-stock";
import { WarehousesService } from "@/lib-spare/appServices";
import type { ProductLocation } from "@/lib-spare/appServices";
import { useT } from "@/components/i18n/useT";
import { getWarehouseBinPosition, WAREHOUSE_BINS } from "@/lib/warehouseLayout";

function formatDate(value?: string) {
 if (!value) return "—";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function PartDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { tenant, activeAgencyId, logout } = useSession();
 const { t } = useT();
 const [product, setProduct] = useState<Product | null>(null);
 const [levels, setLevels] = useState<StockLevel[]>([]);
 const [movements, setMovements] = useState<StockMovement[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);
 const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);
 const [qtyOut, setQtyOut] = useState(1);
 const [actionAgencyId, setActionAgencyId] = useState<string>("");
 const [allocationAgencyId, setAllocationAgencyId] = useState<string>("");
 const [allocationBinCode, setAllocationBinCode] = useState<string>(WAREHOUSE_BINS[0] || "B2");
 const [allocationQty, setAllocationQty] = useState(1);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState("");
 const [mutating, setMutating] = useState(false);
 const [savingAllocation, setSavingAllocation] = useState(false);
 const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

 const toastTimeoutRef = useRef<number | null>(null);
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
 const [p, s] = await Promise.all([
 ProductCatalogService.getProduct(id),
 StockLevelsService.getStockLevels(),
 ]);
 if (!mounted) return;
 setProduct(p ?? null);
 setLevels(s || []);

 // Optional enrichments; don't fail the whole page if one service is down.
 const [mRes, aRes, locsRes] = await Promise.allSettled([
 StockMovementsService.getAllMovements(),
 AgenciesService.getAgencies(),
 WarehousesService.listLocationsForProduct(id),
 ]);
 if (!mounted) return;
 setMovements(mRes.status === "fulfilled" ? mRes.value || [] : []);
 setAgencies(aRes.status === "fulfilled" ? aRes.value || [] : []);
 setProductLocations(locsRes.status === "fulfilled" ? locsRes.value || [] : []);
 } catch (err: any) {
 if (!mounted) return;
 if (err?.status === 401) {
 logout();
 router.replace("/");
 return;
 }
 console.error(err);
 setLoadError(t("app.part.error.load"));
 } finally {
 if (mounted) setLoading(false);
 }
 })();
 return () => {
 mounted = false;
 };
 }, [id, logout, router, t, tenant]);

 const stockForPart = useMemo(() => levels.filter((s) => s.productId === id), [levels, id]);

 useEffect(() => {
 if (!activeAgencyId) return;
 setActionAgencyId(activeAgencyId);
 setAllocationAgencyId(activeAgencyId);
 }, [activeAgencyId]);

 useEffect(() => {
 if (activeAgencyId) return;
 const first = stockForPart.find((s) => !!s.agencyId)?.agencyId || "";
 if (!first) return;
 if (!actionAgencyId) setActionAgencyId(first);
 if (!allocationAgencyId) setAllocationAgencyId(first);
 }, [actionAgencyId, activeAgencyId, allocationAgencyId, stockForPart]);

 const totalQty = useMemo(() => stockForPart.reduce((a, s) => a + (s.quantity || 0), 0), [stockForPart]);

 const agencyById = useMemo(() => {
 const map = new Map<string, Agency>();
 agencies.forEach((a) => {
 if (a.id) map.set(a.id, a);
 });
 return map;
 }, [agencies]);

 const locationsByAgencyId = useMemo(() => {
 const map = new Map<string, ProductLocation[]>();
 productLocations.forEach((l) => {
 if (!l.agencyId) return;
 const rows = map.get(l.agencyId) || [];
 rows.push(l);
 map.set(l.agencyId, rows);
 });
 map.forEach((rows) => {
 rows.sort((a, b) => String(a.binCode || "").localeCompare(String(b.binCode || "")));
 });
 return map;
 }, [productLocations]);

 const allocationRows = useMemo(() => {
 if (!allocationAgencyId) return [];
 return locationsByAgencyId.get(allocationAgencyId) || [];
 }, [allocationAgencyId, locationsByAgencyId]);

 const selectedAgencyStock = useMemo(() => {
 if (!allocationAgencyId) return 0;
 return stockForPart.find((s) => s.agencyId === allocationAgencyId)?.quantity || 0;
 }, [allocationAgencyId, stockForPart]);

 const assignedQty = useMemo(
 () => allocationRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
 [allocationRows],
 );

 const remainingQty = Math.max(0, selectedAgencyStock - assignedQty);

 const movementsForPart = useMemo(() => {
 if (!id) return [];
 const matched = (movements || []).filter((m) => (m.items || []).some((it) => it.productId === id));
 return matched
 .slice()
 .sort((a, b) => new Date(b.date || b.validatedAt || 0).getTime() - new Date(a.date || a.validatedAt || 0).getTime())
 .slice(0, 12);
 }, [id, movements]);

 async function removeFromStock() {
 if (!tenant || !product || !actionAgencyId) return;
 const source = stockForPart.find((s) => s.agencyId === actionAgencyId);
 const currentQty = source?.quantity || 0;
 if (currentQty <= 0) {
 showToast("error", t("app.inventory.toast.error"));
 return;
 }
 const remove = Math.min(qtyOut, currentQty);
 setMutating(true);
 try {
 const draft = await StockMovementsService.createDraft({
 type: "OUT",
 sourceAgencyId: actionAgencyId,
 items: [{ productId: product.id, quantity: remove }],
 notes: t("app.part.manualRemoval"),
 });
 if (draft?.id) {
 await StockMovementsService.validateMovement(draft.id);
 }

 const refreshedLevels = await StockLevelsService.getStockLevels();
 setLevels(refreshedLevels || []);

 try {
 const refreshedMovements = await StockMovementsService.getAllMovements();
 setMovements(refreshedMovements || []);
 } catch {
 // Optional
 }

 try {
 const refreshedLocations = await WarehousesService.listLocationsForProduct(product.id || id);
 setProductLocations(refreshedLocations || []);
 } catch {
 // Optional
 }

 showToast("success", t("app.inventory.toast.removed"));
 } catch (err) {
 console.error(err);
 showToast("error", t("app.inventory.toast.error"));
 } finally {
 setMutating(false);
 }
 }

 async function saveBinAllocation() {
 if (!tenant || !product?.id || !allocationAgencyId || !allocationBinCode) return;
 const existing = allocationRows.find((row) => row.binCode?.toLowerCase() === allocationBinCode.toLowerCase());
 const currentBinQty = Number(existing?.quantity || 0);
 const maxAssignable = selectedAgencyStock - assignedQty + currentBinQty;
 const nextQty = Math.max(0, Number(allocationQty || 0));
 if (nextQty > maxAssignable) {
 showToast("error", t("app.part.binAllocation.error.exceeds"));
 return;
 }

 setSavingAllocation(true);
 try {
 await WarehousesService.upsertProductLocation(allocationAgencyId, product.id, {
 binCode: allocationBinCode,
 quantity: nextQty,
 note: t("app.part.binAllocation.note"),
 });
 const refreshedLocations = await WarehousesService.listLocationsForProduct(product.id || id);
 setProductLocations(refreshedLocations || []);
 setAllocationQty(Math.max(1, Math.min(Math.max(1, remainingQty), maxAssignable || 1)));
 showToast("success", t("app.part.binAllocation.saved"));
 } catch (err) {
 console.error(err);
 showToast("error", t("app.part.binAllocation.error.save"));
 } finally {
 setSavingAllocation(false);
 }
 }

 if (loading) {
 return <div className="p-6 text-sm text-gray-600 dark:text-muted-foreground">{t("app.common.loading")}</div>;
 }

 if (!product) {
 return (
 <main className="p-6 space-y-4">
 <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
 <div className="flex items-center justify-between gap-4">
 <div>{loadError || t("app.part.error.load")}</div>
 <button
 type="button"
 onClick={() => router.refresh()}
 className="border border-amber-200 bg-card px-3 py-1.5 text-xs font-semibold text-amber-900 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
 >
 {t("app.part.error.retry")}
 </button>
 </div>
 </div>
 </main>
 );
 }

 const critical = totalQty <= (product.minStockLevel || 0);
 const selectedBinPosition = getWarehouseBinPosition(allocationBinCode);

 return (
 <main className="p-6 space-y-4">
 <header className="ys-header-card p-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex items-start gap-3">
 <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground ">
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M7 7h10v10H7z" strokeLinecap="round" />
 <path d="M4 10h3M17 10h3M10 4v3M10 17v3" strokeLinecap="round" />
 </svg>
 </span>
 <div>
 <div className="ys-section-title">
 {t("app.inventory.details.title")}
 </div>
 <h2 className="mt-1 text-xl font-semibold text-foreground ">
 {product.name || product.description || "—"}
 </h2>
 <div className="mt-1 text-sm text-muted-foreground ">
 <span className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">{product.sku || "—"}</span>
 {product.categoryName ? <span> · {product.categoryName}</span> : null}
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <Link
 href="/app/inventory"
 className="inline-flex items-center gap-2 border border-border bg-card rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M15 6l-6 6 6 6" strokeLinecap="round" />
 </svg>
 {t("app.inventory.title")}
 </Link>
 <Link
 href="/app/warehouse"
 className="inline-flex items-center gap-2 bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M3 10l9-5 9 5v10H3V10z" strokeLinecap="round" />
 <path d="M9 20v-7h6v7" strokeLinecap="round" />
 </svg>
 {t("app.warehouse.title")}
 </Link>

 <span
 className={[
 "inline-flex items-center border px-2 py-1 text-xs font-semibold",
 critical
 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
 : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
 ].join(" ")}
 >
 {critical ? t("app.part.status.critical") : t("app.part.status.ok")}
 </span>
 </div>
 </div>

 <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
 <div className="border border-border bg-card rounded-xl px-4 py-3 ">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.part.totalQty")}</div>
 <div className="mt-1 text-2xl font-semibold text-foreground ">{totalQty}</div>
 </div>
 <div className="border border-border bg-card rounded-xl px-4 py-3 ">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.part.min")}</div>
 <div className="mt-1 text-2xl font-semibold text-foreground ">{product.minStockLevel ?? "—"}</div>
 </div>
 <div className="border border-border bg-card rounded-xl px-4 py-3 ">
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.part.rop")}</div>
 <div className="mt-1 text-2xl font-semibold text-foreground ">{product.maxStockLevel ?? "—"}</div>
 </div>
 </div>
 </header>

 {loadError ? (
 <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
 <div className="flex items-center justify-between gap-4">
 <div>{loadError}</div>
 <button
 type="button"
 onClick={() => router.refresh()}
 className="border border-amber-200 bg-card px-3 py-1.5 text-xs font-semibold text-amber-900 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
 >
 {t("app.part.error.retry")}
 </button>
 </div>
 </div>
 ) : null}

 <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-4">
 <div className="ys-card p-5">
 <div className="flex items-center justify-between gap-4">
 <div className="ys-section-title">
 {t("app.part.stockByAgency")}
 </div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.inventory.bin")}</div>
 </div>

 <div className="mt-3 space-y-2">
 {stockForPart
 .slice()
 .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
 .map((s) => {
 const agencyId = s.agencyId || "";
 const agencyName = agencyId ? agencyById.get(agencyId)?.name || agencyId : "—";
 const locations = agencyId ? locationsByAgencyId.get(agencyId) || [] : [];
 return (
 <div
 key={s.id}
 className="rounded-xl border border-border bg-card px-3 py-3 text-sm"
 >
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0">
 <div className="font-medium text-foreground ">{agencyName}</div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">
 {t("app.inventory.details.lastUpdated")} {formatDate(s.lastUpdated)}
 </div>
 </div>
 <div className="text-right">
 <div className="text-lg font-semibold text-foreground">{s.quantity ?? 0}</div>
 <div className="text-[11px] text-muted-foreground">{t("app.part.onHand")}</div>
 </div>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {locations.length ? locations.map((location) => (
 <span
 key={`${location.agencyId}:${location.binCode}`}
 className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground"
 title={location.note || undefined}
 >
 <span>{location.binCode}</span>
 <span className="text-muted-foreground">×</span>
 <span>{Number(location.quantity || 0)}</span>
 </span>
 )) : (
 <span className="text-xs text-muted-foreground">{t("app.part.binAllocation.unassigned")}</span>
 )}
 </div>
 </div>
 );
 })}

 {!stockForPart.length ? (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.inventory.details.noStock")}</div>
 ) : null}
 </div>
 </div>

 <div className="ys-card p-5">
 <div className="ys-section-title">
 {t("app.inventory.details.recentMovements")}
 </div>
 <div className="mt-3 space-y-2">
 {movementsForPart.map((m) => (
 <div key={m.id} className="border border-border rounded-xl px-3 py-2 text-sm ">
 <div className="flex items-center justify-between gap-4">
 <div className="font-medium text-foreground ">{m.type || "—"}</div>
 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{formatDate(m.date || m.validatedAt)}</div>
 </div>
 <div className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
 {(m.items || [])
 .filter((it) => it.productId === id)
 .map((it) => `${t("app.common.qty")}: ${it.quantity ?? 0}`)
 .join(" · ")}
 </div>
 </div>
 ))}
 {!movementsForPart.length ? (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">{t("app.inventory.details.noMovements")}</div>
 ) : null}
 </div>
 </div>
 </div>

 <aside className="space-y-4">
 <div className="ys-card p-5">
 <div className="flex items-start justify-between gap-3">
 <div>
 <div className="ys-section-title">{t("app.part.binAllocation.title")}</div>
 <div className="mt-1 text-sm text-muted-foreground">{t("app.part.binAllocation.subtitle")}</div>
 </div>
 <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground">
 {assignedQty}/{selectedAgencyStock}
 </span>
 </div>

 <div className="mt-4 grid grid-cols-3 gap-2">
 <div className="rounded-md border border-border bg-muted/30 p-3">
 <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.part.binAllocation.onHand")}</div>
 <div className="mt-1 text-lg font-semibold">{selectedAgencyStock}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/30 p-3">
 <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.part.binAllocation.assigned")}</div>
 <div className="mt-1 text-lg font-semibold">{assignedQty}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/30 p-3">
 <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t("app.part.binAllocation.remaining")}</div>
 <div className={`mt-1 text-lg font-semibold ${remainingQty === 0 ? "text-emerald-600" : "text-amber-600"}`}>{remainingQty}</div>
 </div>
 </div>

 <div className="mt-4 grid grid-cols-1 gap-3">
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.part.agency")}
 <select
 value={allocationAgencyId || ""}
 onChange={(e) => setAllocationAgencyId(e.target.value)}
 className="ys-input mt-1"
 >
 <option value="">{t("app.inventory.filter.all")}</option>
 {stockForPart
 .map((s) => s.agencyId)
 .filter((x): x is string => typeof x === "string" && x.length > 0)
 .map((aid) => (
 <option key={aid} value={aid}>
 {agencyById.get(aid)?.name || aid}
 </option>
 ))}
 </select>
 </label>

 <div className="grid grid-cols-[1fr_0.7fr] gap-2">
 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.warehouse.stock.table.bin")}
 <select
 value={allocationBinCode}
 onChange={(e) => {
 const bin = e.target.value;
 const existing = allocationRows.find((row) => row.binCode?.toLowerCase() === bin.toLowerCase());
 setAllocationBinCode(bin);
 setAllocationQty(Math.max(0, Number(existing?.quantity ?? Math.max(1, remainingQty))));
 }}
 className="ys-input mt-1"
 >
 {WAREHOUSE_BINS.map((bin) => (
 <option key={bin} value={bin}>
 {bin}
 </option>
 ))}
 </select>
 </label>

 <label className="text-xs font-semibold text-muted-foreground">
 {t("app.common.qty")}
 <input
 type="number"
 min={0}
 value={allocationQty}
 onChange={(e) => setAllocationQty(Math.max(0, Number(e.target.value || 0)))}
 className="ys-input mt-1"
 />
 </label>
 </div>

 {selectedBinPosition && (
 <div className="grid grid-cols-4 gap-2 text-xs">
 <div className="rounded-md border border-border bg-muted/30 p-2">
 <div className="text-[10px] uppercase text-muted-foreground">{t("app.warehouse.map.position.aisle")}</div>
 <div className="font-semibold">{selectedBinPosition.aisle}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/30 p-2">
 <div className="text-[10px] uppercase text-muted-foreground">{t("app.warehouse.map.position.rack")}</div>
 <div className="font-semibold">{selectedBinPosition.rack}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/30 p-2">
 <div className="text-[10px] uppercase text-muted-foreground">{t("app.warehouse.map.position.bay")}</div>
 <div className="font-semibold">{String(selectedBinPosition.bay).padStart(2, "0")}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/30 p-2">
 <div className="text-[10px] uppercase text-muted-foreground">{t("app.warehouse.map.position.level")}</div>
 <div className="font-semibold">{selectedBinPosition.level}</div>
 </div>
 </div>
 )}

 <button
 type="button"
 onClick={saveBinAllocation}
 disabled={savingAllocation || !allocationAgencyId || selectedAgencyStock <= 0}
 className="ys-btn-primary justify-center px-3 py-2 text-sm disabled:opacity-50"
 >
 {savingAllocation ? t("app.part.update") : t("app.part.binAllocation.save")}
 </button>
 </div>

 <div className="mt-4 space-y-2">
 {allocationRows.length ? allocationRows.map((row) => (
 <button
 key={`${row.agencyId}:${row.binCode}`}
 type="button"
 onClick={() => {
 setAllocationBinCode(row.binCode);
 setAllocationQty(Number(row.quantity || 0));
 }}
 className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left text-sm hover:bg-muted/40"
 >
 <div>
 <div className="font-semibold text-foreground">{row.binCode}</div>
 <div className="text-xs text-muted-foreground">{row.note || t("app.part.binAllocation.savedBin")}</div>
 </div>
 <div className="text-lg font-semibold text-foreground">{Number(row.quantity || 0)}</div>
 </button>
 )) : (
 <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
 {t("app.part.binAllocation.empty")}
 </div>
 )}
 </div>
 </div>

 <div className="ys-card p-5">
 <div className="flex items-center justify-between gap-3">
 <div className="ys-section-title">
 {t("app.part.remove")}
 </div>
 </div>

 <div className="mt-3 grid grid-cols-1 gap-3">
 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.part.agency")}
 <select
 value={actionAgencyId || ""}
 onChange={(e) => setActionAgencyId(e.target.value)}
 className="mt-1 w-full border border-border bg-card rounded-xl px-3 py-2 text-sm "
 >
 <option value="">{t("app.inventory.filter.all")}</option>
 {stockForPart
 .map((s) => s.agencyId)
 .filter((x): x is string => typeof x === "string" && x.length > 0)
 .map((aid) => (
 <option key={aid} value={aid}>
 {agencyById.get(aid)?.name || aid}
 </option>
 ))}
 </select>
 </label>

 <label className="text-xs font-semibold text-muted-foreground ">
 {t("app.common.qty")}
 <input
 type="number"
 min={1}
 value={qtyOut}
 onChange={(e) => setQtyOut(Math.max(1, Number(e.target.value || 1)))}
 className="mt-1 w-full border border-border bg-card rounded-xl px-3 py-2 text-sm "
 />
 </label>

 <button
 type="button"
 onClick={removeFromStock}
 disabled={mutating || !actionAgencyId}
 className="inline-flex items-center justify-center gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-300 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
 <path d="M4 7h16" strokeLinecap="round" />
 <path d="M10 11v6M14 11v6" strokeLinecap="round" />
 <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
 </svg>
 {mutating ? t("app.part.update") : t("app.part.remove")}
 </button>

 <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t("app.part.note")}</div>
 </div>
 </div>
 </aside>
 </section>

 {toast ? (
 <div
 className={[
 "fixed bottom-4 right-4 z-50 border px-4 py-3 text-sm shadow-lg",
 toast.tone === "success"
 ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100"
 : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100",
 ].join(" ")}
 >
 {toast.message}
 </div>
 ) : null}
 </main>
 );
}
