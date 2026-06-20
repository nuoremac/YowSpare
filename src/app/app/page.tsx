"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { useT } from "@/components/i18n/useT";
import { usePageSearch } from "@/components/PageSearchContext";
import { getPersonDisplayName } from "@/lib/personName";
import {
 AgenciesService,
 EmployeesRolesService,
 SystemAuditsService,
} from "@/lib";
import { OrganizationsService } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type { Agency, Organization, OrganizationMember, SystemAudit } from "@/lib";
import type { Product, StockLevel, StockMovement } from "@/lib-stock";
import {
 Chart as ChartJS,
 CategoryScale,
 LinearScale,
 PointElement,
 LineElement,
 ArcElement,
 BarElement,
 Tooltip,
 Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
 CategoryScale,
 LinearScale,
 PointElement,
 LineElement,
 ArcElement,
 BarElement,
 Tooltip,
 Legend
);

export default function AppHomePage() {
 const router = useRouter();
 const { tenant, user, logout, activeAgencyId } = useSession();
 const { t } = useT();
 const { query } = usePageSearch();
 const [orgs, setOrgs] = useState<Organization[]>([]);
 const [agencies, setAgencies] = useState<Agency[]>([]);
 const [employees, setEmployees] = useState<OrganizationMember[]>([]);
 const [products, setProducts] = useState<Product[]>([]);
 const [levels, setLevels] = useState<StockLevel[]>([]);
 const [movements, setMovements] = useState<StockMovement[]>([]);
 const [audits, setAudits] = useState<SystemAudit[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState("");
 const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
 const [reloadSeq, setReloadSeq] = useState(0);
 const hasLoadedRef = useRef(false);
 const userIdRef = useRef<string | undefined>(undefined);
 const displayName = getPersonDisplayName(user);

 useEffect(() => {
 if (!user) return;
 if (userIdRef.current !== user.id) {
 userIdRef.current = user.id;
 hasLoadedRef.current = false;
 }
 if (hasLoadedRef.current) return;
 hasLoadedRef.current = true;
 (async () => {
 setLoading(true);
 setLoadError("");
 try {
 const results = await Promise.allSettled([
 tenant?.id ? OrganizationsService.getOrganizationById(tenant.id) : Promise.resolve(null),
 AgenciesService.getAgencies(),
 // Optional: many roles aren't allowed to list employees.
 EmployeesRolesService.getEmployees(),
 ProductCatalogService.getProducts(),
 StockLevelsService.getStockLevels(),
 StockMovementsService.getAllMovements(),
 // Optional: audit stream may be disabled / restricted by role.
 SystemAuditsService.getOrganizationActivity(6),
 ]);

 const orgRes = results[0] as PromiseSettledResult<Organization | null>;
 const agenciesRes = results[1] as PromiseSettledResult<Agency[]>;
 const employeesRes = results[2] as PromiseSettledResult<OrganizationMember[]>;
 const productsRes = results[3] as PromiseSettledResult<Product[]>;
 const levelsRes = results[4] as PromiseSettledResult<StockLevel[]>;
 const movementsRes = results[5] as PromiseSettledResult<StockMovement[]>;
 const auditsRes = results[6] as PromiseSettledResult<SystemAudit[]>;

 const is401 = (r: PromiseSettledResult<any>) => r.status === "rejected" && (r.reason as any)?.status === 401;
 const critical401 = [agenciesRes, productsRes, levelsRes, movementsRes].some(is401);
 if (critical401) {
 logout();
 router.replace("/");
 return;
 }

 if (orgRes.status === "fulfilled") {
 const org = orgRes.value || null;
 setOrgs(org ? [org] : tenant ? [tenant] : []);
 } else {
 setOrgs(tenant ? [tenant] : []);
 }

 setAgencies(agenciesRes.status === "fulfilled" ? agenciesRes.value || [] : []);
 setEmployees(employeesRes.status === "fulfilled" ? employeesRes.value || [] : []);
 setProducts(productsRes.status === "fulfilled" ? productsRes.value || [] : []);
 setLevels(levelsRes.status === "fulfilled" ? levelsRes.value || [] : []);
 setMovements(movementsRes.status === "fulfilled" ? movementsRes.value || [] : []);
 setAudits(auditsRes.status === "fulfilled" ? auditsRes.value || [] : []);
 } catch (err: any) {
 if (err?.status === 401) {
 logout();
 router.replace("/");
 return;
 }
 setLoadError(t("app.dashboard.error.load"));
 console.error(err);
 } finally {
 setLoading(false);
 }
 })();
 }, [logout, reloadSeq, router, t, user]);

 const retryLoad = () => {
 hasLoadedRef.current = false;
 setReloadSeq((n) => n + 1);
 };

 const needle = useMemo(() => query.trim().toLowerCase(), [query]);

 const visibleProducts = useMemo(() => {
 if (!needle) return products;
 return products.filter((p) => {
 const hay = `${p.sku || ""} ${p.name || ""} ${p.description || ""}`.toLowerCase();
 return hay.includes(needle);
 });
 }, [needle, products]);

 const visibleMovements = useMemo(() => {
 if (!needle) return movements;
 return movements.filter((m) => {
 const itemsHay = (m.items || [])
 .map((it) => `${it.productName || ""} ${it.productCode || ""}`)
 .join(" ");
 const hay = `${m.reference || ""} ${m.id || ""} ${m.type || ""} ${m.status || ""} ${m.notes || ""} ${itemsHay}`.toLowerCase();
 return hay.includes(needle);
 });
 }, [movements, needle]);

 const visibleAudits = useMemo(() => {
 if (!needle) return audits;
 return audits.filter((a) => {
 const hay = `${a.user || ""} ${a.action || ""} ${a.remarks || ""} ${a.date || ""}`.toLowerCase();
 return hay.includes(needle);
 });
 }, [audits, needle]);

 const lowStockCount = useMemo(() => {
 const byProduct = new Map<string, number>();
 levels.forEach((l) => {
 const current = byProduct.get(l.productId || "") || 0;
 byProduct.set(l.productId || "", current + (l.quantity || 0));
 });
 return products.filter((p) => {
 const qty = byProduct.get(p.id || "") || 0;
 return typeof p.minStockLevel === "number" ? qty <= p.minStockLevel : false;
 }).length;
 }, [levels, products]);

 const recentMovements = useMemo(() => visibleMovements.slice(0, 5), [visibleMovements]);

 const lowStockItems = useMemo(() => {
 const byProduct = new Map<string, number>();
 levels.forEach((l) => {
 const current = byProduct.get(l.productId || "") || 0;
 byProduct.set(l.productId || "", current + (l.quantity || 0));
 });
 return visibleProducts
 .map((p) => ({
 product: p,
 qty: byProduct.get(p.id || "") || 0,
 min: p.minStockLevel ?? 0,
 }))
 .filter((row) => typeof row.min === "number" && row.qty <= row.min)
 .sort((a, b) => a.qty - b.qty)
 .slice(0, 5);
 }, [levels, visibleProducts]);

 const activeAgency = useMemo(() => {
 if (!activeAgencyId) return null;
 return agencies.find((a) => a.id === activeAgencyId) || null;
 }, [activeAgencyId, agencies]);

 const movementsInRange = useMemo(() => {
 const now = new Date();
 return visibleMovements.filter((m) => {
 const raw = m.date || m.validatedAt;
 if (!raw) return false;
 const d = new Date(raw);
 if (Number.isNaN(d.getTime())) return false;
 const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
 return diff >= 0 && diff < rangeDays;
 });
 }, [rangeDays, visibleMovements]);

 const stockTrend = useMemo(() => {
 const days = rangeDays;
 const now = new Date();
 const buckets = new Array(days).fill(0);
 movementsInRange.forEach((m) => {
 const raw = m.date || m.validatedAt;
 if (!raw) return;
 const d = new Date(raw);
 if (Number.isNaN(d.getTime())) return;
 const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
 if (diff < 0 || diff >= days) return;
 buckets[days - diff - 1] += 1;
 });
 return buckets;
 }, [movementsInRange, rangeDays]);

 const lowStockDistribution = useMemo(() => {
 return lowStockItems.map((row) => {
 const denom = row.min || 1;
 const ratio = Math.min(1, Math.max(0, row.qty / denom));
 return {
 label: row.product.sku || row.product.name || "—",
 qty: row.qty,
 min: row.min,
 ratio,
 };
 });
 }, [lowStockItems]);

 const movementBreakdown = useMemo(() => {
 const counts: Record<string, number> = {};
 movementsInRange.forEach((m) => {
 const key = (m.type || "UNKNOWN").toUpperCase();
 counts[key] = (counts[key] || 0) + 1;
 });
 const entries = Object.entries(counts);
 const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
 return {
 total,
 entries,
 };
 }, [movementsInRange]);

 const stockTrendData = useMemo(() => {
 const now = new Date();
 const labels = stockTrend.map((_, i) => {
 const d = new Date(now);
 d.setDate(now.getDate() - (stockTrend.length - 1 - i));
 return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
 });
 return {
 labels,
 datasets: [
 {
 label: t("app.dashboard.chart.movements"),
 data: stockTrend,
 borderColor: "#2563eb",
 backgroundColor: "rgba(37, 99, 235, 0.2)",
 tension: 0.3,
 pointRadius: 0,
 },
 ],
 };
 }, [stockTrend, t]);

 const lowStockBarData = useMemo(() => {
 return {
 labels: lowStockDistribution.map((row) => row.label),
 datasets: [
 {
 label: t("app.common.qty"),
 data: lowStockDistribution.map((row) => row.qty),
 backgroundColor: "#f59e0b",
 borderColor: "#d97706",
 borderWidth: 1,
 borderRadius: 3,
 },
 {
 label: t("app.common.min"),
 data: lowStockDistribution.map((row) => row.min),
 backgroundColor: "#ef4444",
 borderColor: "#dc2626",
 borderWidth: 1,
 borderRadius: 3,
 },
 ],
 };
 }, [lowStockDistribution, t]);

 const movementDonutData = useMemo(() => {
 const labels = movementBreakdown.entries.map(([label]) => label);
 const values = movementBreakdown.entries.map(([, value]) => value);
 return {
 labels,
 datasets: [
 {
 data: values,
 backgroundColor: ["#2563eb", "#f59e0b", "#10b981", "#8b5cf6"],
 borderWidth: 0,
 },
 ],
 };
 }, [movementBreakdown]);

 return (
 <main className="ys-page">
 <section className="ys-page-header px-8 py-10 text-center">
 <h1 className="mt-1 text-4xl font-semibold text-foreground">
 {t("app.dashboard.welcome", { name: displayName || "—" })}
 </h1>
 </section>

 {loading ? (
 <div className="text-sm text-muted-foreground">
 {t("app.dashboard.loading")}
 </div>
 ) : (
 <>
 <section className="ys-card p-4">
 <div className="ys-section-title">
 {t("app.dashboard.context.title")}
 </div>
 <ul className="mt-3 divide-y divide-border text-sm text-foreground">
 <li className="flex items-center justify-between gap-4 py-2">
 <span className="text-muted-foreground">{t("app.dashboard.context.workspace")}</span>
 <span className="font-medium">{tenant?.name || orgs?.[0]?.name || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-4 py-2">
 <span className="text-muted-foreground">{t("app.dashboard.context.agency")}</span>
 <span className="font-medium">
 {activeAgency ? activeAgency.name : t("app.dashboard.context.agency.all")}
 </span>
 </li>
 </ul>
 </section>

 {loadError && (
 <section className="ys-alert-warning">
 <div className="flex items-center justify-between gap-4">
 <div>{loadError}</div>
 <button
 type="button"
 onClick={retryLoad}
 className="ys-btn-secondary text-xs text-amber-900 dark:text-amber-100"
 >
 {t("app.dashboard.error.retry")}
 </button>
 </div>
 </section>
 )}

 <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
 <Link
 href="/app/admin"
 className="ys-card border-blue-200 bg-blue-50/60 p-4 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
 >
 <div className="font-semibold text-blue-900 dark:text-blue-100">
 {t("app.dashboard.kpi.agencies")}
 </div>
 <div className="mt-2 text-2xl font-semibold text-blue-700 dark:text-blue-200">{agencies.length}</div>
 {!agencies.length && (
 <div className="mt-1 text-xs text-blue-700/80 dark:text-blue-200/80">
 {t("app.dashboard.kpi.agencies.emptyHint")}
 </div>
 )}
 </Link>
 <Link
 href="/app/users"
 className="ys-card border-emerald-200 bg-emerald-50/60 p-4 text-center transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
 >
 <div className="font-semibold text-emerald-900 dark:text-emerald-100">
 {t("app.dashboard.kpi.employees")}
 </div>
 <div className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-200">{employees.length}</div>
 {employees.length <= 1 && (
 <div className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">
 {t("app.dashboard.kpi.employees.emptyHint")}
 </div>
 )}
 </Link>
 <Link
 href="/app/inventory"
 className="ys-card border-amber-200 bg-amber-50/70 p-4 text-center transition hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
 >
 <div className="font-semibold text-amber-900 dark:text-amber-100">
 {t("app.dashboard.kpi.lowStock")}
 </div>
 <div className="mt-2 text-2xl font-semibold text-amber-700 dark:text-amber-200">{lowStockCount}</div>
 {!products.length && (
 <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80">
 {t("app.dashboard.kpi.lowStock.noCatalogHint")}
 </div>
 )}
 </Link>
 <Link
 href="/app/warehouse"
 className="ys-card border-violet-200 bg-violet-50/60 p-4 text-center transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40"
 >
 <div className="font-semibold text-violet-900 dark:text-violet-100">
 {t("app.dashboard.kpi.movements")}
 </div>
 <div className="mt-2 text-2xl font-semibold text-violet-700 dark:text-violet-200">{movements.length}</div>
 {!movements.length && (
 <div className="mt-1 text-xs text-violet-700/80 dark:text-violet-200/80">
 {t("app.dashboard.kpi.movements.emptyHint")}
 </div>
 )}
 </Link>
 </section>

 <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
 <div className="ys-card p-5">
 <div className="flex items-center justify-between">
 <h3 className="font-semibold">{t("app.dashboard.inventory.title")}</h3>
 <Link href="/app/inventory" className="text-xs text-blue-600 dark:text-blue-300">
 {t("app.dashboard.inventory.view")}
 </Link>
 </div>
 <div className="mt-3 space-y-2">
 {lowStockItems.map((row) => (
 <div key={row.product.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm">
 <div>
 <div className="font-medium">{row.product.name || row.product.sku || "—"}</div>
 <div className="text-xs text-muted-foreground">{row.product.sku || "—"}</div>
 </div>
 <div className="text-xs text-muted-foreground">
 {row.qty} / {row.min}
 </div>
 </div>
 ))}
 {!lowStockItems.length && (
 <div className="text-sm text-muted-foreground">
 {t("app.dashboard.inventory.empty")}{" "}
 <Link href="/app/inventory" className="text-blue-600 dark:text-blue-300 underline underline-offset-4">
 {t("app.dashboard.empty.action.inventory")}
 </Link>
 </div>
 )}
 </div>
 </div>

 <div className="ys-card p-5">
 <div className="flex items-center justify-between">
 <h3 className="font-semibold">{t("app.dashboard.movements.title")}</h3>
 <Link href="/app/warehouse" className="text-xs text-blue-600 dark:text-blue-300">
 {t("app.dashboard.movements.view")}
 </Link>
 </div>
 <div className="mt-2 divide-y divide-border">
 {recentMovements.map((m) => {
 const raw = m.date || m.validatedAt;
 const fmtDate = raw
 ? new Date(raw).toLocaleDateString(undefined, { month: "short", day: "2-digit" })
 : "—";
 const fmtTime = raw
 ? new Date(raw).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
 : "";
 const label = m.notes?.trim() || m.reference?.trim() || (m.id ? m.id.slice(-8) : "—");
 const typeColor =
 m.type === "IN" ? "text-emerald-600 dark:text-emerald-400" :
 m.type === "OUT" ? "text-rose-600 dark:text-rose-400" :
 "text-blue-600 dark:text-blue-400";
 return (
 <div key={m.id} className="flex items-center gap-3 px-1 py-2.5 text-sm hover:bg-muted/40 transition-colors cursor-default">
 <span className={`shrink-0 w-8 text-center text-[11px] font-bold uppercase ${typeColor}`}>{m.type}</span>
 <div className="min-w-0 flex-1">
 <div className="truncate font-medium leading-tight">{label}</div>
 <div className="text-[11px] text-muted-foreground mt-0.5">{m.status}</div>
 </div>
 <div className="shrink-0 text-right text-[11px] text-muted-foreground leading-tight">
 <div>{fmtDate}</div>
 {fmtTime && <div className="opacity-60">{fmtTime}</div>}
 </div>
 </div>
 );
 })}
 {!recentMovements.length && (
 <div className="py-3 text-sm text-muted-foreground">
 {t("app.dashboard.movements.empty")}{" "}
 <Link href="/app/warehouse" className="text-blue-600 dark:text-blue-300 underline underline-offset-4">
 {t("app.dashboard.empty.action.receive")}
 </Link>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-4">

 <div className="ys-card p-5">
 <h3 className="font-semibold">{t("app.dashboard.snapshot.title")}</h3>
 <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
 <li className="flex items-center justify-between gap-3 border-b border-border pb-2">
 <span className="font-medium text-foreground">
 {t("app.dashboard.snapshot.tenant")}
 </span>
 <span>{tenant?.name || orgs?.[0]?.name || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-3 border-b border-border pb-2">
 <span className="font-medium text-foreground">
 {t("app.dashboard.snapshot.plan")}
 </span>
 <span>{user?.plan || "—"}</span>
 </li>
 <li className="flex items-center justify-between gap-3">
 <span className="font-medium text-foreground">
 {t("app.dashboard.snapshot.products")}
 </span>
 <span>{products.length}</span>
 </li>
 </ul>
 </div>
 </div>
 </section>

 <section className="space-y-4">
 <div className="ys-card flex items-center justify-between px-4 py-3">
 <div>
 <div className="ys-section-title">
 {t("app.dashboard.analytics.title")}
 </div>
 <div className="mt-1 text-sm text-muted-foreground">
 {t("app.dashboard.analytics.subtitle", { days: rangeDays })}
 </div>
 </div>
 <label className="flex items-center gap-2 text-xs text-muted-foreground">
 <span className="text-muted-foreground">{t("app.dashboard.range.label")}</span>
 <select
 value={rangeDays}
 onChange={(e) => setRangeDays(Number(e.target.value) as 7 | 30 | 90)}
 className="ys-filter-control h-10 w-[110px] text-xs font-semibold"
 >
 <option value={7}>{t("app.dashboard.range.7")}</option>
 <option value={30}>{t("app.dashboard.range.30")}</option>
 <option value={90}>{t("app.dashboard.range.90")}</option>
 </select>
 </label>
 </div>

 <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
 <div className="ys-card p-5">
 <h3 className="font-semibold">{t("app.dashboard.stockTrend.title")}</h3>
 <p className="mt-1 text-xs text-muted-foreground">{t("app.dashboard.stockTrend.subtitle", { days: rangeDays })}</p>
 <div className="mt-3 h-36 w-full">
 <Line
 data={stockTrendData}
 options={{
 responsive: true,
 maintainAspectRatio: false,
 plugins: {
 legend: { display: false },
 tooltip: { intersect: false, mode: "index" },
 },
 scales: {
 x: {
 grid: { display: false },
 ticks: { maxTicksLimit: 6, color: "#64748b", font: { size: 10 } },
 },
 y: {
 beginAtZero: true,
 grid: { color: "rgba(148, 163, 184, 0.25)" },
 ticks: { color: "#64748b", font: { size: 10 }, precision: 0 },
 title: { display: true, text: t("app.dashboard.chart.movements"), color: "#64748b", font: { size: 10, weight: 600 } },
 },
 },
 }}
 />
 </div>
 </div>

 <div className="ys-card p-5">
 <h3 className="font-semibold">{t("app.dashboard.lowStock.title")}</h3>
 <p className="mt-1 text-xs text-muted-foreground">{t("app.dashboard.lowStock.subtitle")}</p>
 <div className="mt-3 h-36 w-full">
 {lowStockDistribution.length ? (
 <Bar
 data={lowStockBarData}
 options={{
 responsive: true,
 maintainAspectRatio: false,
 plugins: {
 legend: { display: false },
 tooltip: { intersect: false, mode: "index" },
 },
 scales: {
 x: {
 grid: { display: false },
 ticks: { color: "#64748b", font: { size: 10 }, maxRotation: 0, autoSkip: true },
 },
 y: {
 beginAtZero: true,
 grid: { color: "rgba(148, 163, 184, 0.25)" },
 ticks: { color: "#64748b", font: { size: 10 }, precision: 0 },
 title: { display: true, text: t("app.common.qty"), color: "#64748b", font: { size: 10, weight: 600 } },
 },
 },
 }}
 />
 ) : (
 <div className="text-sm text-muted-foreground">{t("app.dashboard.inventory.empty")}</div>
 )}
 </div>
 </div>

 <div className="ys-card p-5">
 <h3 className="font-semibold">{t("app.dashboard.movement.title")}</h3>
 <p className="mt-1 text-xs text-muted-foreground">{t("app.dashboard.movement.subtitle")}</p>
 <div className="mt-4 flex items-center gap-4">
 <div className="h-24 w-24">
 {movementBreakdown.entries.length ? (
 <Doughnut
 data={movementDonutData}
 options={{
 responsive: true,
 maintainAspectRatio: false,
 plugins: {
 legend: { display: false },
 tooltip: {
 callbacks: {
 label: (ctx) => {
 const v = Number(ctx.parsed) || 0;
 const pct = Math.round((v / movementBreakdown.total) * 100);
 return `${ctx.label}: ${v} (${pct}%)`;
 },
 },
 },
 },
 cutout: "60%",
 }}
 />
 ) : (
 <div className="text-sm text-muted-foreground">{t("app.dashboard.movements.empty")}</div>
 )}
 </div>
 <div className="space-y-2 text-sm text-muted-foreground">
 {movementBreakdown.entries.length ? (
 movementBreakdown.entries.map(([label, value]) => (
 <div key={label} className="flex items-center justify-between gap-6">
 <span>{label}</span>
 <span className="font-semibold">
 {value}{" "}
 <span className="text-xs text-muted-foreground">
 ({Math.round((value / movementBreakdown.total) * 100)}%)
 </span>
 </span>
 </div>
 ))
 ) : (
 <div className="text-sm text-muted-foreground">{t("app.dashboard.movements.empty")}</div>
 )}
 </div>
 </div>
 </div>
 </div>
 </section>
 </>
 )}
 </main>
 );
}
