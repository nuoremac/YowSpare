"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MaterialOperationsControllerService,
  WorkflowControllerService,
  type MaterialRequestDto,
  type WorkflowRequestDto,
} from "@/lib-spare";
import {
  PurchaseOrdersService,
  type PurchaseOrder as KernelPurchaseOrder,
} from "@/lib-spare/appServices";
import { useSession } from "@/store/session";
import {
  type InternalRequest,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  nowIso,
  readWorkflowState,
  updateWorkflowState,
} from "@/lib/workflowStore";
import { useT } from "@/components/i18n/useT";
import type { LangContextValue } from "@/components/i18n/LangProvider";
import type { TranslationKey } from "@/components/i18n/translation";

type ApprovalKind = "MATERIAL" | "WORKFLOW" | "PO" | "LOCAL_REQUEST";
type FilterKind = "ALL" | ApprovalKind;
type ToastState = { tone: "ok" | "err" | "warn"; msg: string } | null;
type Translate = LangContextValue["t"];
type SourceHealth = {
  material: boolean;
  workflow: boolean;
  purchaseOrders: "api" | "local";
};

type ApprovalRow = {
  key: string;
  id: string;
  kind: ApprovalKind;
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
  href?: string;
  sourceLabel: string;
  description: string;
  detailLines: Array<{ label: string; value: string }>;
  preview?: string;
};

const formatDate = (value: string | undefined, locale: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeIso = (value?: string): string => {
  if (!value) return "1970-01-01T00:00:00.000Z";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "1970-01-01T00:00:00.000Z" : date.toISOString();
};

const shortId = (value?: string): string => {
  if (!value) return "-";
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
};

const titleCase = (value?: string): string => {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const safeJson = (value?: string): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const summarizePayload = (payload?: Record<string, unknown> | null): string | undefined => {
  if (!payload) return undefined;
  const preferred = firstString(
    payload.title,
    payload.label,
    payload.description,
    payload.reason,
    payload.reference,
    payload.referenceId,
    payload.requestNumber,
    payload.supplierName
  );
  if (preferred) return preferred;
  const compact = JSON.stringify(payload);
  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
};

const computePoTotal = (po: PurchaseOrder): number =>
  po.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);

const normalizePurchaseOrderStatus = (status?: string): PurchaseOrderStatus => {
  switch ((status || "DRAFT").toUpperCase()) {
    case "SENT":
    case "CONFIRMED":
      return "SENT";
    case "PARTIAL":
    case "RECU_PARTIEL":
      return "PARTIAL";
    case "RECEIVED":
    case "RECU":
      return "RECEIVED";
    case "CLOSED":
    case "CANCELLED":
    case "ANNULE":
    case "REJETE":
      return "CLOSED";
    default:
      return "DRAFT";
  }
};

const toApprovalPurchaseOrder = (po: KernelPurchaseOrder): PurchaseOrder => ({
  id: po.id,
  supplierId: po.supplierId || "",
  supplierLabel: po.supplierName || po.supplierId || "-",
  status: normalizePurchaseOrderStatus(po.status),
  createdAt: po.createdAt || po.updatedAt || new Date().toISOString(),
  updatedAt: po.updatedAt || po.createdAt || new Date().toISOString(),
  note: po.notes || undefined,
  lines: (po.lines || []).map((line) => ({
    id: line.id || `${line.productId}:${line.sku}`,
    productId: line.productId,
    productLabel: line.sku ? `${line.sku} - ${line.productName}` : line.productName,
    quantity: Number(line.qty || 0),
    unitPrice: Number(line.unitPrice || 0),
    receivedQty: 0,
  })),
  events: [],
});

const describeFailure = (label: string, reason: unknown): string => {
  const value = reason as {
    status?: unknown;
    message?: unknown;
    response?: { status?: unknown };
    body?: { message?: unknown; error?: unknown };
  };
  const status = typeof value?.status === "number" ? value.status : value?.response?.status;
  const message =
    typeof value?.body?.message === "string"
      ? value.body.message
      : typeof value?.body?.error === "string"
        ? value.body.error
        : typeof value?.message === "string"
          ? value.message
          : "";
  if (typeof status === "number") return `${label} (${status}${message ? `: ${message}` : ""})`;
  return message ? `${label}: ${message}` : label;
};

const formatAmount = (value: number, locale: string): string =>
  `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(0, value || 0))} XAF`;

const localizedStatus = (t: Translate, status?: string): string =>
  t(`app.workflow.status.${(status || "PENDING").toUpperCase()}` as TranslationKey);

const statusClasses = (status: string): string => {
  switch (status.toUpperCase()) {
    case "PENDING":
    case "DRAFT":
    case "BROUILLON":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100";
    case "APPROVED":
    case "RECU_PARTIEL":
    case "RECU":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100";
    case "REJECTED":
    case "REJETE":
    case "ANNULE":
      return "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100";
    default:
      return "border-border bg-muted text-foreground";
  }
};

const sourceClasses = (kind: ApprovalKind): string => {
  switch (kind) {
    case "MATERIAL":
      return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100";
    case "WORKFLOW":
      return "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-100";
    case "PO":
      return "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100";
    case "LOCAL_REQUEST":
      return "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100";
    default:
      return "border-border bg-muted text-foreground";
  }
};

const buildMaterialRow = (request: MaterialRequestDto, t: Translate, locale: string): ApprovalRow => {
  const items = request.items || [];
  const totalRequested = items.reduce((sum, item) => sum + Number(item.quantityRequested || 0), 0);
  const mainReason = firstString(request.reasonText, request.reasonCode, request.departmentId);
  return {
    key: `MATERIAL:${request.id}`,
    id: request.id || "",
    kind: "MATERIAL",
    title: t("app.approvals.row.materialTitle", { id: shortId(request.id) }),
    subtitle: request.departmentId
      ? t("app.approvals.row.materialDepartment", { id: shortId(request.departmentId) })
      : t("app.approvals.row.materialDefault"),
    status: request.status || "PENDING",
    createdAt: normalizeIso(request.updatedAt),
    href: "/app/internal-requests",
    sourceLabel: t("app.approvals.source.stock"),
    description:
      mainReason ||
      (items.length
        ? t("app.approvals.row.materialDescription", { lines: items.length, units: totalRequested })
        : t("app.approvals.row.materialPending")),
    detailLines: [
      { label: t("app.approvals.detail.reference"), value: request.id || "-" },
      { label: t("app.approvals.detail.agency"), value: request.agencyId || "-" },
      { label: t("app.approvals.detail.department"), value: request.departmentId || "-" },
      { label: t("app.approvals.detail.requester"), value: request.requestedBy || "-" },
      { label: t("app.approvals.detail.reason"), value: firstString(request.reasonText, request.reasonCode) || "-" },
      {
        label: t("app.approvals.detail.items"),
        value: items.length
          ? t("app.approvals.row.materialDescription", { lines: items.length, units: totalRequested })
          : "-",
      },
      { label: t("app.approvals.detail.expectedReturn"), value: formatDate(request.expectedReturnAt, locale) },
      { label: t("app.approvals.detail.updated"), value: formatDate(request.updatedAt, locale) },
    ],
    preview: items
      .map((item) => `${shortId(item.productId)} x ${Number(item.quantityRequested || 0)}`)
      .slice(0, 4)
      .join(" | "),
  };
};

const buildWorkflowRow = (request: WorkflowRequestDto, t: Translate, locale: string): ApprovalRow => {
  const payload = safeJson(request.payloadJson);
  const summary = summarizePayload(payload);
  return {
    key: `WORKFLOW:${request.id}`,
    id: request.id || "",
    kind: "WORKFLOW",
    title: t("app.approvals.row.workflowTitle", { type: titleCase(request.type) }),
    subtitle: request.requestedBy
      ? t("app.approvals.row.workflowSubmitted", { name: request.requestedBy })
      : t("app.approvals.row.workflowReference", { id: shortId(request.id) }),
    status: request.status || "PENDING",
    createdAt: normalizeIso(request.updatedAt),
    sourceLabel: t("app.approvals.source.workflow"),
    description: summary || t("app.approvals.row.workflowPending"),
    detailLines: [
      { label: t("app.approvals.detail.reference"), value: request.id || "-" },
      { label: t("app.approvals.detail.type"), value: titleCase(request.type) },
      { label: t("app.approvals.detail.requester"), value: request.requestedBy || "-" },
      { label: t("app.approvals.detail.status"), value: localizedStatus(t, request.status) },
      { label: t("app.approvals.detail.updated"), value: formatDate(request.updatedAt, locale) },
    ],
    preview: summary,
  };
};

const buildPoRow = (po: PurchaseOrder, backendMode: boolean, t: Translate, locale: string): ApprovalRow => {
  const total = computePoTotal(po);
  return {
    key: `PO:${po.id}`,
    id: po.id,
    kind: "PO",
    title: t("app.approvals.row.poTitle", { id: shortId(po.id) }),
    subtitle: po.supplierLabel || po.supplierId || t("app.approvals.row.poSupplierMissing"),
    status: po.status,
    createdAt: normalizeIso(po.createdAt || po.updatedAt),
    href: "/app/purchase-orders",
    sourceLabel: backendMode ? t("app.approvals.source.billing") : t("app.approvals.source.localPo"),
    description: t("app.approvals.row.poDescription", {
      lines: po.lines.length,
      total: formatAmount(total, locale),
    }),
    detailLines: [
      { label: t("app.approvals.detail.reference"), value: po.id },
      { label: t("app.approvals.detail.supplier"), value: po.supplierLabel || po.supplierId || "-" },
      { label: t("app.approvals.detail.agency"), value: po.agencyId || "-" },
      { label: t("app.approvals.detail.delivery"), value: formatDate(po.expectedAt, locale) },
      { label: t("app.approvals.detail.total"), value: formatAmount(total, locale) },
      { label: t("app.approvals.detail.lines"), value: String(po.lines.length) },
      {
        label: t("app.approvals.detail.source"),
        value: backendMode ? t("app.approvals.source.billing") : t("app.approvals.detail.localStorage"),
      },
      { label: t("app.approvals.detail.note"), value: po.note || "-" },
    ],
    preview: po.lines.slice(0, 4).map((line) => `${line.productLabel} x ${line.quantity}`).join(" | "),
  };
};

const buildLocalRequestRow = (
  request: InternalRequest,
  t: Translate,
  locale: string,
): ApprovalRow => ({
  key: `LOCAL_REQUEST:${request.id}`,
  id: request.id,
  kind: "LOCAL_REQUEST",
  title: t("app.approvals.row.localTitle", { id: shortId(request.id) }),
  subtitle: `${request.department} - ${request.productLabel}`,
  status: request.status,
  createdAt: normalizeIso(request.createdAt || request.updatedAt),
  href: `/app/internal-requests/${request.id}`,
  sourceLabel: t("app.approvals.source.localWorkflow"),
  description: t("app.approvals.row.localDescription", {
    quantity: request.quantity,
    reason: request.reason || t("app.approvals.row.noReason"),
  }),
  detailLines: [
    { label: t("app.approvals.detail.reference"), value: request.id },
    { label: t("app.approvals.detail.agency"), value: request.agencyId || "-" },
    { label: t("app.approvals.detail.department"), value: request.department },
    { label: t("app.approvals.detail.product"), value: request.productLabel },
    { label: t("app.approvals.detail.quantity"), value: String(request.quantity) },
    { label: t("app.approvals.detail.neededFrom"), value: formatDate(request.neededFrom, locale) },
    { label: t("app.approvals.detail.neededTo"), value: formatDate(request.neededTo, locale) },
    { label: t("app.approvals.detail.reason"), value: request.reason || "-" },
  ],
});

export default function ApprovalsPage() {
  const { t, lang } = useT();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { activeAgencyId } = useSession();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKind>("ALL");
  const [localRequests, setLocalRequests] = useState<InternalRequest[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestDto[]>([]);
  const [workflowRequests, setWorkflowRequests] = useState<WorkflowRequestDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poBackendMode, setPoBackendMode] = useState(true);
  const [sourceHealth, setSourceHealth] = useState<SourceHealth>({
    material: true,
    workflow: true,
    purchaseOrders: "api",
  });
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const localState = readWorkflowState();
    setLocalRequests(localState.internalRequests);

    const [materialResult, workflowResult, poResult] = await Promise.allSettled([
      MaterialOperationsControllerService.listMaterialRequests(activeAgencyId || undefined, undefined, "PENDING"),
      WorkflowControllerService.list("PENDING"),
      PurchaseOrdersService.list({ status: "DRAFT" }),
    ]);

    const notes: string[] = [];

    if (materialResult.status === "fulfilled") {
      setMaterialRequests(materialResult.value || []);
    } else {
      setMaterialRequests([]);
      notes.push(describeFailure(t("app.approvals.degraded.material"), materialResult.reason));
    }

    if (workflowResult.status === "fulfilled") {
      setWorkflowRequests(workflowResult.value || []);
    } else {
      setWorkflowRequests([]);
      notes.push(describeFailure(t("app.approvals.degraded.workflow"), workflowResult.reason));
    }

    if (poResult.status === "fulfilled") {
      const rows = (poResult.value || []).map(toApprovalPurchaseOrder);
      setPurchaseOrders(rows);
      setPoBackendMode(true);
      updateWorkflowState((current) => ({ ...current, purchaseOrders: rows }));
    } else {
      setPurchaseOrders(localState.purchaseOrders);
      setPoBackendMode(false);
      notes.push(describeFailure(t("app.approvals.degraded.po"), poResult.reason));
    }

    setSourceHealth({
      material: materialResult.status === "fulfilled",
      workflow: workflowResult.status === "fulfilled",
      purchaseOrders: poResult.status === "fulfilled" ? "api" : "local",
    });
    setLastRefreshAt(new Date().toISOString());
    setLoading(false);

    if (notes.length) {
      setToast({
        tone: "warn",
        msg: t("app.approvals.degraded.toast", { sources: notes.join(", ") }),
      });
    }
  }, [activeAgencyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const allRows = useMemo<ApprovalRow[]>(() => {
    const rows: ApprovalRow[] = [
      ...materialRequests
        .filter((request) => (request.status || "PENDING").toUpperCase() === "PENDING")
        .map((request) => buildMaterialRow(request, t, locale)),
      ...workflowRequests
        .filter((request) => (request.status || "PENDING").toUpperCase() === "PENDING")
        .map((request) => buildWorkflowRow(request, t, locale)),
      ...purchaseOrders
        .filter((po) => po.status === "DRAFT")
        .map((po) => buildPoRow(po, poBackendMode, t, locale)),
      ...localRequests
        .filter((request) => request.status === "PENDING")
        .map((request) => buildLocalRequestRow(request, t, locale)),
    ];

    return rows.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [localRequests, materialRequests, workflowRequests, purchaseOrders, poBackendMode, t, locale]);

  const stats = useMemo(
    () => ({
      total: allRows.length,
      material: allRows.filter((row) => row.kind === "MATERIAL").length,
      workflow: allRows.filter((row) => row.kind === "WORKFLOW").length,
      po: allRows.filter((row) => row.kind === "PO").length,
      local: allRows.filter((row) => row.kind === "LOCAL_REQUEST").length,
    }),
    [allRows]
  );

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (filter !== "ALL" && row.kind !== filter) return false;
      if (!needle) return true;
      return `${row.title} ${row.subtitle} ${row.description} ${row.id} ${row.sourceLabel}`
        .toLowerCase()
        .includes(needle);
    });
  }, [allRows, filter, query]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedKey("");
      return;
    }
    if (!filteredRows.some((row) => row.key === selectedKey)) {
      setSelectedKey(filteredRows[0].key);
    }
  }, [filteredRows, selectedKey]);

  const selectedRow = filteredRows.find((row) => row.key === selectedKey) || filteredRows[0] || null;

  const setLocalRequestStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    const at = nowIso();
    const eventAction = status === "APPROVED" ? "STATUS_APPROVED" : "STATUS_REJECTED";
    const eventNote =
      status === "APPROVED"
        ? t("app.approvals.event.approved")
        : t("app.approvals.event.rejected");
    const next = updateWorkflowState((current) => ({
      ...current,
      internalRequests: current.internalRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              updatedAt: at,
              events: [{ at, action: eventAction, note: eventNote }, ...(request.events || [])],
            }
          : request
      ),
    }));
    setLocalRequests(next.internalRequests);
  };

  const setLocalPoStatus = (id: string, status: "SENT" | "CLOSED", note: string) => {
    const at = nowIso();
    const eventAction = status === "SENT" ? "PO_SENT" : "PO_REJECTED";
    const next = updateWorkflowState((current) => ({
      ...current,
      purchaseOrders: current.purchaseOrders.map((po) =>
        po.id === id
          ? {
              ...po,
              status,
              updatedAt: at,
              events: [{ at, action: eventAction, note }, ...(po.events || [])],
            }
          : po
      ),
    }));
    setPurchaseOrders(next.purchaseOrders);
  };

  const approve = async (row: ApprovalRow) => {
    const actionKey = `${row.key}:approve`;
    setBusyAction(actionKey);
    try {
      switch (row.kind) {
        case "MATERIAL":
          await MaterialOperationsControllerService.approve1(row.id);
          await load();
          setToast({ tone: "ok", msg: t("app.approvals.toast.approveMaterial") });
          break;
        case "WORKFLOW":
          await WorkflowControllerService.approve(row.id);
          await load();
          setToast({ tone: "ok", msg: t("app.approvals.toast.approveWorkflow") });
          break;
        case "PO":
          if (poBackendMode) {
            const updated = toApprovalPurchaseOrder(await PurchaseOrdersService.updateStatus(row.id, "SENT"));
            const nextPurchaseOrders = purchaseOrders.map((po) => (po.id === row.id ? updated : po));
            setPurchaseOrders(nextPurchaseOrders);
            updateWorkflowState((current) => ({ ...current, purchaseOrders: nextPurchaseOrders }));
            setToast({ tone: "ok", msg: t("app.approvals.toast.approvePo") });
          } else {
            setLocalPoStatus(row.id, "SENT", t("app.approvals.event.poApproved"));
            setToast({ tone: "ok", msg: t("app.approvals.toast.approvePoLocal") });
          }
          break;
        case "LOCAL_REQUEST":
          setLocalRequestStatus(row.id, "APPROVED");
          setToast({ tone: "ok", msg: t("app.approvals.toast.approveLocal") });
          break;
      }
    } catch {
      setToast({ tone: "err", msg: t("app.approvals.error.approve") });
    } finally {
      setBusyAction("");
    }
  };

  const reject = async (row: ApprovalRow) => {
    const actionKey = `${row.key}:reject`;
    setBusyAction(actionKey);
    try {
      switch (row.kind) {
        case "MATERIAL":
          await MaterialOperationsControllerService.reject1(row.id);
          await load();
          setToast({ tone: "ok", msg: t("app.approvals.toast.rejectMaterial") });
          break;
        case "WORKFLOW":
          await WorkflowControllerService.reject(row.id);
          await load();
          setToast({ tone: "ok", msg: t("app.approvals.toast.rejectWorkflow") });
          break;
        case "PO":
          if (poBackendMode) {
            const updated = toApprovalPurchaseOrder(await PurchaseOrdersService.updateStatus(row.id, "CANCELLED"));
            const nextPurchaseOrders = purchaseOrders.map((po) => (po.id === row.id ? updated : po));
            setPurchaseOrders(nextPurchaseOrders);
            updateWorkflowState((current) => ({ ...current, purchaseOrders: nextPurchaseOrders }));
            setToast({ tone: "ok", msg: t("app.approvals.toast.rejectPo") });
          } else {
            setLocalPoStatus(row.id, "CLOSED", t("app.approvals.event.poRejected"));
            setToast({ tone: "ok", msg: t("app.approvals.toast.rejectPoLocal") });
          }
          break;
        case "LOCAL_REQUEST":
          setLocalRequestStatus(row.id, "REJECTED");
          setToast({ tone: "ok", msg: t("app.approvals.toast.rejectLocal") });
          break;
      }
    } catch {
      setToast({ tone: "err", msg: t("app.approvals.error.reject") });
    } finally {
      setBusyAction("");
    }
  };

  const filterOptions: Array<{ value: FilterKind; label: string; count: number }> = [
    { value: "ALL", label: t("app.approvals.filter.all"), count: stats.total },
    { value: "MATERIAL", label: t("app.approvals.filter.material"), count: stats.material },
    { value: "WORKFLOW", label: t("app.approvals.filter.workflow"), count: stats.workflow },
    { value: "PO", label: t("app.approvals.filter.po"), count: stats.po },
    { value: "LOCAL_REQUEST", label: t("app.approvals.filter.local"), count: stats.local },
  ];

  const sourceNotes = [
    !sourceHealth.material ? t("app.approvals.degraded.material") : null,
    !sourceHealth.workflow ? t("app.approvals.degraded.workflow") : null,
    sourceHealth.purchaseOrders === "local" ? t("app.approvals.degraded.po") : null,
  ].filter(Boolean) as string[];

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="ys-toolbar">
          <div>
            <h2 className="ys-page-title">{t("app.approvals.title")}</h2>
            <p className="ys-page-subtitle">{t("app.approvals.subtitle")}</p>
          </div>
          <div className="ys-toolbar-actions">
            <div className="rounded-md border border-border bg-input px-3 py-2 text-xs text-muted-foreground">
              {t("app.approvals.lastSync", {
                date: lastRefreshAt ? formatDate(lastRefreshAt, locale) : "-",
              })}
            </div>
            <button type="button" className="ys-btn-secondary" onClick={() => void load()} disabled={loading}>
              {loading ? t("app.approvals.refreshing") : t("app.approvals.refresh")}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-5">
          {[
            { label: t("app.approvals.kpi.total"), value: stats.total, tone: "text-foreground" },
            { label: t("app.approvals.kpi.material"), value: stats.material, tone: "text-blue-700 dark:text-blue-300" },
            { label: t("app.approvals.kpi.workflow"), value: stats.workflow, tone: "text-violet-700 dark:text-violet-300" },
            { label: t("app.approvals.kpi.po"), value: stats.po, tone: "text-cyan-700 dark:text-cyan-300" },
            { label: t("app.approvals.kpi.local"), value: stats.local, tone: "text-slate-700 dark:text-slate-300" },
          ].map((card) => (
            <div key={card.label} className="ys-card px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {card.label}
              </div>
              <div className={`mt-2 text-3xl font-semibold tracking-tight ${card.tone}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      {sourceNotes.length ? (
        <section className="ys-alert-warning">
          <div className="font-medium">{t("app.approvals.degraded.title")}</div>
          <div className="mt-1 text-sm">{sourceNotes.join(" | ")}</div>
        </section>
      ) : null}

      {toast ? (
        <section
          className={
            toast.tone === "ok"
              ? "ys-alert-success"
              : toast.tone === "warn"
                ? "ys-alert-warning"
                : "ys-alert-error"
          }
        >
          {toast.msg}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <section className="ys-card p-5">
            <div className="ys-toolbar">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`ys-tab ${filter === option.value ? "ys-tab-active" : ""}`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
              <div className="w-full max-w-md">
                <label className="ys-filter-label">
                  {t("app.approvals.search.label")}
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="ys-filter-control"
                    placeholder={t("app.approvals.search.placeholder")}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            {loading ? (
              <div className="ys-card p-6 text-sm text-muted-foreground">{t("app.approvals.loading")}</div>
            ) : filteredRows.length ? (
              filteredRows.map((row) => {
                const approveBusy = busyAction === `${row.key}:approve`;
                const rejectBusy = busyAction === `${row.key}:reject`;
                const selected = row.key === selectedRow?.key;
                return (
                  <article
                    key={row.key}
                    className={`ys-card border transition ${selected ? "border-primary/40 ring-2 ring-primary/10" : "border-border"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedKey(row.key)}
                      className="w-full px-5 py-5 text-left"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${sourceClasses(row.kind)}`}>
                              {row.sourceLabel}
                            </span>
                            <span className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(row.status)}`}>
                              {localizedStatus(t, row.status)}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(row.createdAt, locale)}</span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">{row.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{row.subtitle}</p>
                          <p className="mt-3 text-sm leading-6 text-foreground">{row.description}</p>
                          {row.preview ? (
                            <div className="mt-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                              {row.preview}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          {row.href ? (
                            <Link href={row.href} className="ys-btn-secondary text-xs">
                              {t("app.approvals.action.open")}
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="ys-btn-danger text-xs"
                            disabled={!!busyAction}
                            onClick={() => void reject(row)}
                          >
                            {rejectBusy ? t("app.approvals.action.rejecting") : t("app.approvals.action.reject")}
                          </button>
                          <button
                            type="button"
                            className="ys-btn-primary text-xs"
                            disabled={!!busyAction}
                            onClick={() => void approve(row)}
                          >
                            {approveBusy ? t("app.approvals.action.approving") : t("app.approvals.action.approve")}
                          </button>
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="ys-card p-8 text-center">
                <div className="text-base font-semibold text-foreground">{t("app.approvals.empty.title")}</div>
                <p className="mt-2 text-sm text-muted-foreground">{t("app.approvals.empty.subtitle")}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className="ys-card p-5">
            <div className="ys-section-title">{t("app.approvals.detail.title")}</div>
            {selectedRow ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${sourceClasses(selectedRow.kind)}`}>
                    {selectedRow.sourceLabel}
                  </span>
                  <span className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(selectedRow.status)}`}>
                    {localizedStatus(t, selectedRow.status)}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{selectedRow.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRow.subtitle}</p>
                <p className="mt-4 text-sm leading-6 text-foreground">{selectedRow.description}</p>

                <div className="mt-5 space-y-3">
                  {selectedRow.detailLines.map((line) => (
                    <div key={`${selectedRow.key}:${line.label}`} className="rounded-md border border-border bg-muted/30 px-3 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {line.label}
                      </div>
                      <div className="mt-1 text-sm text-foreground">{line.value || "-"}</div>
                    </div>
                  ))}
                </div>

                {selectedRow.href ? (
                  <div className="mt-5">
                    <Link href={selectedRow.href} className="ys-btn-secondary w-full">
                      {t("app.approvals.action.openSource")}
                    </Link>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t("app.approvals.detail.empty")}</p>
            )}
          </section>

          <section className="ys-card p-5">
            <div className="ys-section-title">{t("app.approvals.rules.title")}</div>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li>- {t("app.approvals.rules.stock")}</li>
              <li>- {t("app.approvals.rules.po")}</li>
              <li>- {t("app.approvals.rules.local")}</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
