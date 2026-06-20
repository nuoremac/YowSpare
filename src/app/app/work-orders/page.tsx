"use client";

import { useEffect, useMemo, useState } from "react";
import { AgenciesService } from "@/lib";
import type { Agency } from "@/lib";
import { ProductCatalogService, StockMovementsService } from "@/lib-stock";
import type { Product } from "@/lib-stock";
import { makeId, nowIso, readWorkflowState, updateWorkflowState, WorkOrder, WorkOrderLine } from "@/lib/workflowStore";
import { useSession } from "@/store/session";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { useT } from "@/components/i18n/useT";
import type { TranslationKey } from "@/components/i18n/translation";

export default function WorkOrdersPage() {
  const { t, lang } = useT();
  const { roles, tenant, user } = useSession();
  const canManageInventory =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "inventory:write");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [priority, setPriority] = useState<WorkOrder["priority"]>("MEDIUM");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState("");
  const [lineProductId, setLineProductId] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [lines, setLines] = useState<WorkOrderLine[]>([]);
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [agenciesRes, productsRes] = await Promise.allSettled([
        AgenciesService.getAgencies(),
        ProductCatalogService.getProducts(),
      ]);
      if (!mounted) return;
      setAgencies(agenciesRes.status === "fulfilled" ? agenciesRes.value || [] : []);
      setProducts(productsRes.status === "fulfilled" ? productsRes.value || [] : []);
      setOrders(readWorkflowState().workOrders);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  const stats = useMemo(
    () => ({
      active: orders.filter((order) => order.status === "OPEN").length,
      completed: orders.filter((order) => order.status === "DONE").length,
      parts: orders
        .filter((order) => order.status === "OPEN")
        .reduce((sum, order) => sum + order.lines.reduce((lineSum, line) => lineSum + line.quantity, 0), 0),
    }),
    [orders],
  );

  const addLine = () => {
    if (!lineProductId) return;
    const p = productById.get(lineProductId);
    setLines((prev) => [
      ...prev,
      {
        id: makeId(),
        productId: lineProductId,
        productLabel: p?.name || p?.sku || lineProductId,
        quantity: Math.max(1, Number(lineQty || 1)),
      },
    ]);
    setLineProductId("");
    setLineQty(1);
  };

  const removeLine = (lineId: string) => {
    setLines((current) => current.filter((line) => line.id !== lineId));
  };

  const createOrder = () => {
    if (!canManageInventory) return;
    if (!title.trim() || !department.trim() || !agencyId || !lines.length) {
      setToast({ tone: "err", msg: t("app.workOrders.error.required") });
      return;
    }
    const at = nowIso();
    const order: WorkOrder = {
      id: makeId(),
      title: title.trim(),
      department: department.trim(),
      agencyId,
      priority,
      status: "OPEN",
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      note: note.trim() || undefined,
      createdAt: at,
      updatedAt: at,
      lines,
      events: [{ at, action: "WORK_ORDER_CREATED", note: t("app.workOrders.event.created") }],
    };
    const state = updateWorkflowState((current) => ({
      ...current,
      workOrders: [order, ...current.workOrders],
    }));
    setOrders(state.workOrders);
    setTitle("");
    setDepartment("");
    setStartsAt("");
    setEndsAt("");
    setNote("");
    setLines([]);
    setToast({ tone: "ok", msg: t("app.workOrders.success.created") });
    window.setTimeout(() => setToast(null), 2200);
  };

  const consumeAndClose = async (order: WorkOrder) => {
    if (!canManageInventory) return;
    setBusyId(order.id);
    try {
      for (const line of order.lines) {
        const draft = await StockMovementsService.createDraft({
          type: "OUT",
          sourceAgencyId: order.agencyId,
          notes: t("app.workOrders.movement.note", { id: order.id }),
          items: [{ productId: line.productId, quantity: line.quantity }],
        });
        if (draft?.id) await StockMovementsService.validateMovement(draft.id);
      }
      const at = nowIso();
      const state = updateWorkflowState((current) => ({
        ...current,
        workOrders: current.workOrders.map((row) =>
          row.id !== order.id
            ? row
            : {
                ...row,
                status: "DONE",
                updatedAt: at,
                events: [{ at, action: "WORK_ORDER_DONE", note: t("app.workOrders.event.done") }, ...(row.events || [])],
              }
        ),
      }));
      setOrders(state.workOrders);
      setToast({ tone: "ok", msg: t("app.workOrders.success.closed") });
    } catch {
      setToast({ tone: "err", msg: t("app.workOrders.error.consumeFailed") });
    } finally {
      setBusyId("");
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <h2 className="ys-page-title">{t("app.workOrders.title")}</h2>
        <p className="ys-page-subtitle">{t("app.workOrders.subtitle")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: t("app.workOrders.kpi.active"), value: stats.active },
            { label: t("app.workOrders.kpi.completed"), value: stats.completed },
            { label: t("app.workOrders.kpi.parts"), value: stats.parts },
          ].map((item) => (
            <div key={item.label} className="ys-card px-4 py-3">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {toast ? <section className={toast.tone === "ok" ? "ys-alert-success" : "ys-alert-error"}>{toast.msg}</section> : null}

      <section className="ys-card p-5">
        <div className="ys-section-title">{t("app.workOrders.form.title")}</div>
        <p className="mt-1 text-sm text-muted-foreground">{t("app.workOrders.form.subtitle")}</p>
        <div className="ys-filter-grid mt-4 md:grid-cols-3">
          <label className="ys-filter-label">
            {t("app.workOrders.form.name")}
            <input
              className="ys-filter-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("app.workOrders.form.namePlaceholder")}
            />
          </label>
          <label className="ys-filter-label">
            {t("app.workOrders.form.department")}
            <input
              className="ys-filter-control"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={t("app.workOrders.form.departmentPlaceholder")}
            />
          </label>
          <label className="ys-filter-label">
            {t("app.workOrders.form.agency")}
            <select className="ys-filter-control" value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
              <option value="">{t("app.workOrders.form.select")}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id || ""}>
                  {a.name || a.id}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label">
            {t("app.workOrders.form.priority")}
            <select className="ys-filter-control" value={priority} onChange={(e) => setPriority(e.target.value as WorkOrder["priority"])}>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`app.workflow.priority.${value}` as TranslationKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="ys-filter-label">
            {t("app.workOrders.form.start")}
            <input type="date" className="ys-filter-control" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label className="ys-filter-label">
            {t("app.workOrders.form.end")}
            <input type="date" className="ys-filter-control" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
          <label className="ys-filter-label md:col-span-3">
            {t("app.workOrders.form.note")}
            <textarea
              className="ys-input mt-1 min-h-20"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("app.workOrders.form.notePlaceholder")}
            />
          </label>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <div className="ys-section-title">{t("app.workOrders.parts.title")}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t("app.workOrders.parts.subtitle")}</p>
          <div className="ys-filter-grid mt-3 md:grid-cols-3">
            <label className="ys-filter-label md:col-span-2">
              {t("app.workOrders.parts.product")}
              <select className="ys-filter-control" value={lineProductId} onChange={(e) => setLineProductId(e.target.value)}>
                <option value="">{t("app.workOrders.form.select")}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id || ""}>
                    {p.sku || p.name || p.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="ys-filter-label">
              {t("app.workOrders.parts.quantity")}
              <input
                type="number"
                min={1}
                className="ys-filter-control"
                value={lineQty}
                onChange={(e) => setLineQty(Math.max(1, Number(e.target.value || 1)))}
              />
            </label>
          </div>
          <button type="button" onClick={addLine} className="ys-btn-secondary mt-3 text-xs">
            {t("app.workOrders.parts.add")}
          </button>
          <div className="mt-3 space-y-2">
            {!lines.length ? (
              <div className="text-sm text-muted-foreground">{t("app.workOrders.parts.empty")}</div>
            ) : null}
            {lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  {line.productLabel} - {line.quantity}
                </span>
                <button
                  type="button"
                  className="ys-icon-btn h-8 w-8"
                  onClick={() => removeLine(line.id)}
                  title={t("app.workOrders.parts.remove")}
                  aria-label={t("app.workOrders.parts.remove")}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {canManageInventory ? t("app.workOrders.form.inventoryHint") : t("app.workOrders.form.readOnly")}
          </div>
          <button type="button" className="ys-btn-primary" onClick={createOrder} disabled={!canManageInventory}>
            {t("app.workOrders.form.submit")}
          </button>
        </div>
      </section>

      <section className="ys-card p-5">
        <div className="ys-section-title">{t("app.workOrders.list.title")}</div>
        <p className="mt-1 text-sm text-muted-foreground">{t("app.workOrders.list.subtitle")}</p>
        {!orders.length ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.workOrders.list.empty")}</div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{order.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.department} - {t(`app.workflow.priority.${order.priority}` as TranslationKey)} -{" "}
                      {t(`app.workflow.status.${order.status}` as TranslationKey)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ys-btn-primary text-xs disabled:opacity-50"
                    disabled={!canManageInventory || order.status === "DONE" || busyId === order.id}
                    onClick={() => void consumeAndClose(order)}
                  >
                    {busyId === order.id
                      ? t("app.workOrders.action.processing")
                      : order.status === "DONE"
                        ? t("app.workOrders.action.completed")
                        : t("app.workOrders.action.consumeClose")}
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {order.lines.map((line) => (
                    <li key={line.id}>
                      {line.productLabel} - {line.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
