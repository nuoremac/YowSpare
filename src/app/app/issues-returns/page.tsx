"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MovableModal from "@/components/MovableModal";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { AgenciesService } from "@/lib";
import type { Agency } from "@/lib";
import { ProductCatalogService, StockMovementsService } from "@/lib-stock";
import type { Product } from "@/lib-stock";
import {
  IssueReturnRecord,
  makeId,
  nowIso,
  readWorkflowState,
  updateWorkflowState,
} from "@/lib/workflowStore";

type IRKind = IssueReturnRecord["kind"];
type IRStatus = IssueReturnRecord["status"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// ── Kind badge ────────────────────────────────────────────────────────────────
function KindBadge({ kind }: { kind: IRKind }) {
  const { t } = useT();
  const cls =
    kind === "ISSUE"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {t(`app.ir.kind.${kind}`)}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function IRStatusBadge({ status }: { status: IRStatus }) {
  const { t } = useT();
  const cls =
    status === "OPEN"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {t(`app.ir.status.${status}`)}
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
    <MovableModal open={open} title={title} onClose={onClose} initialWidth={900} initialHeight={600}>
      <div className="mt-6">{children}</div>
    </MovableModal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IssuesReturnsPage() {
  const router = useRouter();
  const { t } = useT();
  const { query } = usePageSearch();
  const { tenant, user, activeAgencyId, logout, roles } = useSession();
  const canManageInventory =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "inventory:write");

  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<IssueReturnRecord[]>([]);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<IRKind | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<IRStatus | "ALL">("ALL");

  // ── Create form state ─────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [formKind, setFormKind] = useState<IRKind>("ISSUE");
  const [formAgencyId, setFormAgencyId] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formProductQuery, setFormProductQuery] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);
  const [formQty, setFormQty] = useState(1);
  const [formDueAt, setFormDueAt] = useState("");
  const [formReason, setFormReason] = useState("");
  const [createError, setCreateError] = useState("");

  // ── Busy / toast ──────────────────────────────────────────────────────────────
  const [busy, setBusy] = useState(false);
  const [busyReturnId, setBusyReturnId] = useState("");
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!tenant) return;
      setLoading(true);
      const [agRes, pRes] = await Promise.allSettled([
        AgenciesService.getAgencies(),
        ProductCatalogService.getProducts(),
      ]);
      if (!mounted) return;
      if (agRes.status === "rejected" && (agRes.reason as any)?.status === 401) {
        logout(); router.replace("/"); return;
      }
      setAgencies(agRes.status === "fulfilled" ? agRes.value || [] : []);
      setProducts(pRes.status === "fulfilled" ? pRes.value || [] : []);
      setRecords(readWorkflowState().issuesReturns);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [logout, router, tenant]);

  const showToast = (tone: "ok" | "err", msg: string) => {
    setToast({ tone, msg });
    window.setTimeout(() => setToast(null), 2400);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const needle = formProductQuery.trim().toLowerCase();
    const base = products.slice().sort((a, b) => (a.sku || "").localeCompare(b.sku || ""));
    if (!needle) return base.slice(0, 60);
    return base
      .filter((p) =>
        [p.sku, p.name, p.description, p.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 60);
  }, [formProductQuery, products]);

  const filteredRecords = useMemo(() => {
    const needle = `${query} ${search}`.trim().toLowerCase();
    return records
      .filter((r) => kindFilter === "ALL" || r.kind === kindFilter)
      .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
      .filter((r) => {
        if (!needle) return true;
        return `${r.productLabel} ${r.department} ${r.reason}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [records, query, search, kindFilter, statusFilter]);

  // ── Open create ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    if (!canManageInventory) return;
    setFormKind("ISSUE");
    setFormAgencyId(activeAgencyId || agencies[0]?.id || "");
    setFormDepartment("");
    setFormProductQuery("");
    setFormProductId("");
    setFormQty(1);
    setFormDueAt("");
    setFormReason("");
    setCreateError("");
    setCreateOpen(true);
  };

  const onProductSelect = (id: string) => {
    const p = products.find((x) => x.id === id);
    setFormProductId(id);
    setFormProductQuery(p ? `${p.sku || "—"} • ${p.name || ""}` : "");
    setShowProductResults(false);
  };

  // ── Submit new operation ──────────────────────────────────────────────────────
  const submitCreate = async () => {
    if (!canManageInventory) return;
    setCreateError("");
    if (!formAgencyId || !formDepartment.trim() || !formProductId || !formReason.trim()) {
      setCreateError(t("app.ir.error.required"));
      return;
    }
    const product = products.find((p) => p.id === formProductId);
    const qty = Math.max(1, Number(formQty || 1));
    setBusy(true);
    try {
      const movementType = formKind === "ISSUE" ? "OUT" : "IN";
      const draft = await StockMovementsService.createDraft({
        type: movementType,
        ...(movementType === "OUT"
          ? { sourceAgencyId: formAgencyId }
          : { destinationAgencyId: formAgencyId }),
        notes: `${formKind} — ${formDepartment.trim()} — ${formReason.trim()}`,
        items: [{ productId: formProductId, quantity: qty }],
      });
      if (draft?.id) await StockMovementsService.validateMovement(draft.id);

      const record: IssueReturnRecord = {
        id: makeId(),
        kind: formKind,
        agencyId: formAgencyId,
        department: formDepartment.trim(),
        productId: formProductId,
        productLabel: product?.name || product?.sku || formProductId,
        quantity: qty,
        reason: formReason.trim(),
        dueAt: formKind === "ISSUE" && formDueAt ? formDueAt : undefined,
        status: formKind === "ISSUE" ? "OPEN" : "RETURNED",
        createdAt: nowIso(),
      };

      const state = updateWorkflowState((cur) => ({
        ...cur,
        issuesReturns: [record, ...cur.issuesReturns],
      }));
      setRecords(state.issuesReturns);
      setCreateOpen(false);
      showToast("ok", t("app.ir.success.created"));
    } catch {
      setCreateError(t("app.ir.error.submitFailed"));
    } finally {
      setBusy(false);
    }
  };

  // ── Mark returned ─────────────────────────────────────────────────────────────
  const markReturned = async (rec: IssueReturnRecord) => {
    if (!canManageInventory) return;
    setBusyReturnId(rec.id);
    try {
      const draft = await StockMovementsService.createDraft({
        type: "IN",
        destinationAgencyId: rec.agencyId,
        notes: `Return — ${rec.department} — ${rec.reason}`,
        items: [{ productId: rec.productId, quantity: rec.quantity }],
      });
      if (draft?.id) await StockMovementsService.validateMovement(draft.id);

      const state = updateWorkflowState((cur) => ({
        ...cur,
        issuesReturns: cur.issuesReturns.map((r) =>
          r.id === rec.id ? { ...r, status: "RETURNED" as IRStatus } : r
        ),
      }));
      setRecords(state.issuesReturns);
      showToast("ok", t("app.ir.success.returned"));
    } catch {
      showToast("err", t("app.ir.error.submitFailed"));
    } finally {
      setBusyReturnId("");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteRecord = (id: string) => {
    if (!canManageInventory) return;
    const state = updateWorkflowState((cur) => ({
      ...cur,
      issuesReturns: cur.issuesReturns.filter((r) => r.id !== id),
    }));
    setRecords(state.issuesReturns);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/50">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 7h16v10H4z" strokeLinecap="round" />
              <path d="M8 12h8M12 8v8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="ys-page-title">{t("app.ir.title")}</h1>
            <p className="ys-page-subtitle">{t("app.ir.subtitle")}</p>
          </div>
        </div>
      </section>

      {toast && (
        <div className={toast.tone === "ok" ? "ys-alert-success" : "ys-alert-error"}>
          {toast.msg}
        </div>
      )}

      <section className="ys-card p-4">
        <div className="ys-toolbar flex-wrap gap-2">
          <div className="ys-toolbar-actions flex-wrap">
            <input
              type="search"
              className="ys-input h-10 w-72"
              placeholder={t("app.ir.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="ys-input h-10 w-44"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as IRKind | "ALL")}
            >
              <option value="ALL">{t("app.ir.filter.kindAll")}</option>
              <option value="ISSUE">{t("app.ir.kind.ISSUE")}</option>
              <option value="RETURN">{t("app.ir.kind.RETURN")}</option>
            </select>
            <select
              className="ys-input h-10 w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IRStatus | "ALL")}
            >
              <option value="ALL">{t("app.ir.status.all")}</option>
              <option value="OPEN">{t("app.ir.status.OPEN")}</option>
              <option value="RETURNED">{t("app.ir.status.RETURNED")}</option>
            </select>
          </div>
          <button type="button" onClick={openCreate} className="ys-btn-primary gap-2 text-xs" disabled={!canManageInventory}>
            <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 5v14" strokeLinecap="round" />
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
            {t("app.ir.action.create")}
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
        ) : !filteredRecords.length ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("app.ir.empty")}
          </div>
        ) : (
          <div className="ys-table-wrap mt-4">
            <table className="ys-table min-w-[1000px]">
              <thead className="ys-table-head bg-muted/30">
                <tr>
                  <th className="ys-table-cell pl-4">{t("app.ir.table.kind")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.department")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.product")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.qty")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.reason")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.due")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.status")}</th>
                  <th className="ys-table-cell">{t("app.ir.table.date")}</th>
                  <th className="ys-table-cell pr-4 text-right">{t("app.ir.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="ys-table-row">
                    <td className="ys-table-cell pl-4">
                      <KindBadge kind={rec.kind} />
                    </td>
                    <td className="ys-table-cell font-medium">{rec.department}</td>
                    <td className="ys-table-cell">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
                          <ProductImage
                            product={products.find((p) => p.id === rec.productId)}
                            productId={rec.productId}
                            alt={rec.productLabel || t("app.catalog.image.alt")}
                            className="h-full w-full object-cover"
                            fallback={<ProductImageFallback />}
                          />
                        </div>
                        <div className="truncate font-medium">{rec.productLabel}</div>
                      </div>
                    </td>
                    <td className="ys-table-cell">{rec.quantity}</td>
                    <td className="ys-table-cell max-w-[220px]">
                      <span className="line-clamp-2 text-xs text-muted-foreground">{rec.reason}</span>
                    </td>
                    <td className="ys-table-cell text-muted-foreground">
                      {rec.dueAt ? formatDate(rec.dueAt) : "—"}
                    </td>
                    <td className="ys-table-cell">
                      <IRStatusBadge status={rec.status} />
                    </td>
                    <td className="ys-table-cell text-muted-foreground">{formatDate(rec.createdAt)}</td>
                    <td className="ys-table-cell pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.kind === "ISSUE" && rec.status === "OPEN" && (
                          <button
                            type="button"
                            onClick={() => void markReturned(rec)}
                            disabled={!canManageInventory || busyReturnId === rec.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                          >
                            {busyReturnId === rec.id
                              ? t("app.ir.action.marking")
                              : t("app.ir.action.markReturned")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteRecord(rec.id)}
                          disabled={!canManageInventory}
                          className="ys-icon-btn-delete"
                          aria-label={t("app.ir.action.delete")}
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
      <Modal open={createOpen} title={t("app.ir.form.title")} onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          {/* Kind tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              className={`ys-tab ${formKind === "ISSUE" ? "ys-tab-active" : ""}`}
              onClick={() => setFormKind("ISSUE")}
            >
              {t("app.ir.kind.ISSUE")}
            </button>
            <button
              type="button"
              className={`ys-tab ${formKind === "RETURN" ? "ys-tab-active" : ""}`}
              onClick={() => setFormKind("RETURN")}
            >
              {t("app.ir.kind.RETURN")}
            </button>
          </div>

          <div className="ys-card p-4 relative z-10">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Agency */}
              <label className="ys-filter-label">
                {t("app.ir.form.agency")}
                <select
                  className="ys-filter-control"
                  value={formAgencyId}
                  onChange={(e) => setFormAgencyId(e.target.value)}
                >
                  <option value="">—</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id || ""}>{a.name || a.id}</option>
                  ))}
                </select>
              </label>

              {/* Department */}
              <label className="ys-filter-label">
                {t("app.ir.form.department")}
                <input
                  className="ys-filter-control"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder={t("app.ir.form.departmentPlaceholder")}
                />
              </label>

              {/* Quantity */}
              <label className="ys-filter-label">
                {t("app.ir.form.quantity")}
                <input
                  type="number"
                  min={1}
                  className="ys-filter-control"
                  value={formQty}
                  onChange={(e) => setFormQty(Math.max(1, Number(e.target.value || 1)))}
                />
              </label>

              {/* Product combobox */}
              <label className="ys-filter-label md:col-span-2">
                {t("app.ir.form.product")}
                <div className="relative">
                  <input
                    className="ys-filter-control"
                    value={formProductQuery}
                    onFocus={() => setShowProductResults(true)}
                    onBlur={() => window.setTimeout(() => setShowProductResults(false), 120)}
                    onChange={(e) => {
                      setFormProductQuery(e.target.value);
                      setFormProductId("");
                      setShowProductResults(true);
                    }}
                    placeholder={t("app.ir.form.productSearch")}
                  />
                  {showProductResults && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
                      {filteredProducts.length ? (
                        filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); onProductSelect(p.id || ""); }}
                            className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
                                <ProductImage
                                  product={p}
                                  alt={p.name || p.sku || t("app.catalog.image.alt")}
                                  className="h-full w-full object-cover"
                                  fallback={<ProductImageFallback />}
                                />
                              </span>
                              <span className="truncate font-medium text-foreground">{p.sku || "—"} · {p.name || ""}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{p.categoryName || ""}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t("app.ir.form.productNoResult")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>

              {/* Due date (ISSUE only) */}
              {formKind === "ISSUE" && (
                <label className="ys-filter-label">
                  {t("app.ir.form.dueAt")}
                  <input
                    type="date"
                    className="ys-filter-control"
                    value={formDueAt}
                    onChange={(e) => setFormDueAt(e.target.value)}
                  />
                </label>
              )}

              {/* Reason */}
              <label className={`ys-filter-label ${formKind === "ISSUE" ? "md:col-span-3" : "md:col-span-2"}`}>
                {t("app.ir.form.reason")}
                <textarea
                  className="ys-input mt-1 min-h-[80px]"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={t("app.ir.form.reasonPlaceholder")}
                />
              </label>
            </div>
          </div>

          {createError && <div className="ys-alert-error">{createError}</div>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="ys-btn-secondary text-xs"
              onClick={() => setCreateOpen(false)}
            >
              {t("app.ir.action.discard")}
            </button>
            <button
              type="button"
              className="ys-btn-primary text-xs"
              onClick={() => void submitCreate()}
              disabled={!canManageInventory || busy}
            >
              {busy ? t("app.ir.action.submitting") : t("app.ir.action.submit")}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
