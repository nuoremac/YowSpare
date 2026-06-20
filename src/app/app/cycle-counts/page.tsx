"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MovableModal from "@/components/MovableModal";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { AgenciesService } from "@/lib";
import type { Agency } from "@/lib";
import { ProductCatalogService, StockLevelsService, StockMovementsService } from "@/lib-stock";
import type { Product, StockLevel } from "@/lib-stock";
import {
  CycleCountTask,
  makeId,
  nowIso,
  readWorkflowState,
  updateWorkflowState,
} from "@/lib/workflowStore";

type CCStatus = CycleCountTask["status"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function CCStatusBadge({ status }: { status: CCStatus }) {
  const { t } = useT();
  const cls =
    status === "PLANNED"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
      : status === "COUNTED"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {t(`app.cc.status.${status}`)}
    </span>
  );
}

// ── Delta badge ───────────────────────────────────────────────────────────────
function DeltaBadge({ delta }: { delta: number | undefined }) {
  const { t } = useT();
  if (typeof delta !== "number") return <span className="text-muted-foreground">—</span>;
  if (delta === 0)
    return <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{t("app.cc.delta.none")}</span>;
  return (
    <span className={`text-sm font-semibold ${delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({
  open, title, children, onClose,
}: {
  open: boolean; title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <MovableModal open={open} title={title} onClose={onClose} initialWidth={860} initialHeight={560}>
      <div className="mt-6">{children}</div>
    </MovableModal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CycleCountsPage() {
  const router = useRouter();
  const { t } = useT();
  const { query } = usePageSearch();
  const { tenant, user, logout, roles } = useSession();
  const canManageInventory =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "inventory:write");

  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [tasks, setTasks] = useState<CycleCountTask[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CCStatus | "ALL">("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [binCode, setBinCode] = useState("");

  const [countInputs, setCountInputs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!tenant) return;
      setLoading(true);
      const [agRes, pRes, lRes] = await Promise.allSettled([
        AgenciesService.getAgencies(),
        ProductCatalogService.getProducts(),
        StockLevelsService.getStockLevels(),
      ]);
      if (!mounted) return;
      if (agRes.status === "rejected" && (agRes.reason as any)?.status === 401) {
        logout(); router.replace("/"); return;
      }
      setAgencies(agRes.status === "fulfilled" ? agRes.value || [] : []);
      setProducts(pRes.status === "fulfilled" ? pRes.value || [] : []);
      setLevels(lRes.status === "fulfilled" ? lRes.value || [] : []);
      setTasks(readWorkflowState().cycleCounts);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [logout, router, tenant]);

  const showToast = (tone: "ok" | "err", msg: string) => {
    setToast({ tone, msg });
    window.setTimeout(() => setToast(null), 2400);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const agencyById = useMemo(() => {
    const m = new Map<string, Agency>();
    agencies.forEach((a) => { if (a.id) m.set(a.id, a); });
    return m;
  }, [agencies]);

  const filteredProducts = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    const base = products.slice().sort((a, b) => (a.sku || "").localeCompare(b.sku || ""));
    if (!needle) return base.slice(0, 60);
    return base
      .filter((p) => [p.sku, p.name, p.description, p.id].filter(Boolean).join(" ").toLowerCase().includes(needle))
      .slice(0, 60);
  }, [productQuery, products]);

  const expectedQtyFor = (agencyId: string, productId: string) =>
    levels
      .filter((l) => l.agencyId === agencyId && l.productId === productId)
      .reduce((sum, l) => sum + (l.quantity || 0), 0);

  const filteredTasks = useMemo(() => {
    const needle = `${query} ${search}`.trim().toLowerCase();
    return tasks
      .filter((t) => statusFilter === "ALL" || t.status === statusFilter)
      .filter((t) => {
        if (!needle) return true;
        return `${t.productLabel} ${t.binCode} ${t.agencyId}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tasks, query, search, statusFilter]);

  // ── Create ───────────────────────────────────────────────────────────────────
  const openCreate = () => {
    if (!canManageInventory) return;
    setSelectedProductId("");
    setProductQuery("");
    setSelectedAgencyId(agencies[0]?.id || "");
    setBinCode("");
    setCreateError("");
    setCreateOpen(true);
  };

  const onProductSelect = (id: string) => {
    const p = products.find((x) => x.id === id);
    setSelectedProductId(id);
    setProductQuery(p ? `${p.sku || "—"} • ${p.name || ""}` : "");
    setShowProductResults(false);
  };

  const createTask = () => {
    if (!canManageInventory) return;
    setCreateError("");
    if (!selectedProductId) { setCreateError(t("app.cc.error.selectProduct")); return; }
    const product = products.find((p) => p.id === selectedProductId);
    const agencyId = selectedAgencyId || agencies[0]?.id || "";
    const now = nowIso();
    const task: CycleCountTask = {
      id: makeId(),
      agencyId,
      productId: selectedProductId,
      productLabel: product?.name || product?.sku || selectedProductId,
      binCode: binCode.trim() || "A1",
      expectedQty: expectedQtyFor(agencyId, selectedProductId),
      status: "PLANNED",
      createdAt: now,
      updatedAt: now,
    };
    const state = updateWorkflowState((cur) => ({ ...cur, cycleCounts: [task, ...cur.cycleCounts] }));
    setTasks(state.cycleCounts);
    setCreateOpen(false);
    showToast("ok", t("app.cc.success.created"));
  };

  // ── Record count ─────────────────────────────────────────────────────────────
  const recordCount = (taskId: string) => {
    if (!canManageInventory) return;
    const raw = countInputs[taskId];
    if (raw === undefined || raw === "") return;
    const countedQty = Math.max(0, Number(raw));
    const state = updateWorkflowState((cur) => ({
      ...cur,
      cycleCounts: cur.cycleCounts.map((task) =>
        task.id !== taskId ? task : {
          ...task,
          countedQty,
          delta: countedQty - task.expectedQty,
          status: "COUNTED",
          updatedAt: nowIso(),
        }
      ),
    }));
    setTasks(state.cycleCounts);
    setCountInputs((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
  };

  // ── Adjust stock ─────────────────────────────────────────────────────────────
  const applyAdjustment = async (task: CycleCountTask) => {
    if (!canManageInventory) return;
    if (task.status !== "COUNTED" || task.delta === undefined || task.delta === 0) {
      const state = updateWorkflowState((cur) => ({
        ...cur,
        cycleCounts: cur.cycleCounts.map((t) =>
          t.id === task.id ? { ...t, status: "ADJUSTED", updatedAt: nowIso() } : t
        ),
      }));
      setTasks(state.cycleCounts);
      return;
    }
    setBusyId(task.id);
    try {
      const type = task.delta > 0 ? "IN" : "OUT";
      const draft = await StockMovementsService.createDraft({
        type,
        ...(type === "IN" ? { destinationAgencyId: task.agencyId } : { sourceAgencyId: task.agencyId }),
        notes: `Cycle count adjustment — ${task.id}`,
        items: [{ productId: task.productId, quantity: Math.abs(task.delta) }],
      });
      if (draft?.id) await StockMovementsService.validateMovement(draft.id);
      const state = updateWorkflowState((cur) => ({
        ...cur,
        cycleCounts: cur.cycleCounts.map((t) =>
          t.id === task.id ? { ...t, status: "ADJUSTED", updatedAt: nowIso() } : t
        ),
      }));
      setTasks(state.cycleCounts);
      showToast("ok", t("app.cc.success.adjusted"));
    } catch {
      showToast("err", t("app.cc.error.adjustFailed"));
    } finally {
      setBusyId("");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteTask = (id: string) => {
    if (!canManageInventory) return;
    const state = updateWorkflowState((cur) => ({
      ...cur,
      cycleCounts: cur.cycleCounts.filter((t) => t.id !== id),
    }));
    setTasks(state.cycleCounts);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/50">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 6h16M4 12h10M4 18h10" strokeLinecap="round" />
              <path d="m17 11 2 2 3-3M17 17l2 2 3-3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="ys-page-title">{t("app.cc.title")}</h1>
            <p className="ys-page-subtitle">{t("app.cc.subtitle")}</p>
          </div>
        </div>
      </section>

      {toast && (
        <div className={toast.tone === "ok" ? "ys-alert-success" : "ys-alert-error"}>
          {toast.msg}
        </div>
      )}

      <section className="ys-card p-4">
        <div className="ys-toolbar">
          <div className="ys-toolbar-actions">
            <input
              type="search"
              className="ys-input h-10 w-72"
              placeholder={t("app.cc.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="ys-input h-10 w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CCStatus | "ALL")}
            >
              <option value="ALL">{t("app.cc.status.all")}</option>
              <option value="PLANNED">{t("app.cc.status.PLANNED")}</option>
              <option value="COUNTED">{t("app.cc.status.COUNTED")}</option>
              <option value="ADJUSTED">{t("app.cc.status.ADJUSTED")}</option>
            </select>
          </div>
          <button type="button" onClick={openCreate} className="ys-btn-primary gap-2 text-xs" disabled={!canManageInventory}>
            <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 5v14" strokeLinecap="round" />
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
            {t("app.cc.action.create")}
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
        ) : !filteredTasks.length ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("app.cc.empty")}
          </div>
        ) : (
          <div className="ys-table-wrap mt-4">
            <table className="ys-table min-w-[900px]">
              <thead className="ys-table-head bg-muted/30">
                <tr>
                  <th className="ys-table-cell pl-4">{t("app.cc.table.product")}</th>
                  <th className="ys-table-cell">{t("app.cc.table.bin")}</th>
                  <th className="ys-table-cell">{t("app.cc.table.expected")}</th>
                  <th className="ys-table-cell">{t("app.cc.table.counted")}</th>
                  <th className="ys-table-cell">{t("app.cc.table.delta")}</th>
                  <th className="ys-table-cell">{t("app.cc.table.status")}</th>
                  <th className="ys-table-cell">{t("app.cc.table.date")}</th>
                  <th className="ys-table-cell pr-4 text-right">{t("app.cc.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="ys-table-row">
                    <td className="ys-table-cell pl-4">
                      <div className="font-medium">{task.productLabel}</div>
                      {agencyById.get(task.agencyId) && (
                        <div className="text-xs text-muted-foreground">
                          {agencyById.get(task.agencyId)!.name || task.agencyId}
                        </div>
                      )}
                    </td>
                    <td className="ys-table-cell font-mono text-xs">{task.binCode}</td>
                    <td className="ys-table-cell">{task.expectedQty}</td>
                    <td className="ys-table-cell">
                      {task.status === "PLANNED" ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            className="ys-filter-control h-8 w-20 text-sm"
                            placeholder={t("app.cc.action.countPlaceholder")}
                            value={countInputs[task.id] ?? ""}
                            onChange={(e) =>
                              setCountInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => recordCount(task.id)}
                            disabled={!canManageInventory || !countInputs[task.id]}
                            className="inline-flex h-8 items-center rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium hover:bg-muted disabled:opacity-40"
                          >
                            {t("app.cc.action.record")}
                          </button>
                        </div>
                      ) : (
                        <span>{task.countedQty ?? "—"}</span>
                      )}
                    </td>
                    <td className="ys-table-cell">
                      <DeltaBadge delta={task.delta} />
                    </td>
                    <td className="ys-table-cell">
                      <CCStatusBadge status={task.status} />
                    </td>
                    <td className="ys-table-cell text-muted-foreground">{formatDate(task.updatedAt)}</td>
                    <td className="ys-table-cell pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {task.status === "COUNTED" && (
                          <button
                            type="button"
                            onClick={() => void applyAdjustment(task)}
                            disabled={!canManageInventory || busyId === task.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                          >
                            {busyId === task.id ? t("app.cc.action.adjusting") : t("app.cc.action.adjust")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          disabled={!canManageInventory}
                          className="ys-icon-btn-delete"
                          aria-label={t("app.cc.action.delete")}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M4 7h16" strokeLinecap="round" />
                            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                            <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <Modal open={createOpen} title={t("app.cc.form.title")} onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          <div className="ys-card p-4 relative z-10">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="ys-filter-label md:col-span-2">
                {t("app.cc.form.product")}
                <div className="relative">
                  <input
                    className="ys-filter-control"
                    value={productQuery}
                    onFocus={() => setShowProductResults(true)}
                    onBlur={() => window.setTimeout(() => setShowProductResults(false), 120)}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setSelectedProductId("");
                      setShowProductResults(true);
                    }}
                    placeholder={t("app.cc.form.productSearch")}
                  />
                  {showProductResults && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
                      {filteredProducts.length ? (
                        filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); onProductSelect(p.id || ""); }}
                            className="flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                          >
                            <span className="font-medium text-foreground">{p.sku || "—"} · {p.name || ""}</span>
                            <span className="text-xs text-muted-foreground">{p.categoryName || ""}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{t("app.cc.form.productNoResult")}</div>
                      )}
                    </div>
                  )}
                </div>
              </label>
              <label className="ys-filter-label">
                {t("app.cc.form.bin")}
                <input
                  className="ys-filter-control"
                  value={binCode}
                  onChange={(e) => setBinCode(e.target.value)}
                  placeholder={t("app.cc.form.binPlaceholder")}
                />
              </label>
              <label className="ys-filter-label md:col-span-3">
                {t("app.cc.form.agency")}
                <select
                  className="ys-filter-control"
                  value={selectedAgencyId}
                  onChange={(e) => setSelectedAgencyId(e.target.value)}
                >
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id || ""}>{a.name || a.id}</option>
                  ))}
                </select>
              </label>
            </div>
            {selectedProductId && selectedAgencyId && (
              <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("app.cc.table.expected")} : </span>
                <span className="font-semibold">
                  {expectedQtyFor(selectedAgencyId, selectedProductId)}
                </span>
              </div>
            )}
          </div>

          {createError && <div className="ys-alert-error">{createError}</div>}

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="ys-btn-secondary text-xs" onClick={() => setCreateOpen(false)}>
              {t("app.procurement.quotation.action.discard")}
            </button>
            <button type="button" className="ys-btn-primary text-xs" onClick={createTask} disabled={!canManageInventory}>
              {t("app.cc.action.create")}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
