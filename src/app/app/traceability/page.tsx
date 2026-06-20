"use client";

import { useEffect, useMemo, useState } from "react";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { StockMovementsService } from "@/lib-stock";
import type { StockMovement } from "@/lib-stock";
import { getOrganizationStorageId, getQuotationStorageKey } from "@/lib/quotationStorage";
import { readWorkflowState } from "@/lib/workflowStore";
import { useSession } from "@/store/session";

// ── Storage keys (mirrors other pages) ───────────────────────────────────────
const PO_KEY = "yowspare-purchase-orders-v1";
const RECEIPTS_KEY = "yowspare-receipts-v1";

// ── Lightweight local types (only the fields we need) ─────────────────────────
type QuotationRecord = {
  id: string;
  quotationNumber: string;
  supplierName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type PORecord = {
  id: string;
  poNumber: string;
  supplierName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ReceiptRecord = {
  id: string;
  receiptNumber: string;
  poNumber: string;
  supplierName: string;
  status: string;
  receivedAt: string;
  createdAt: string;
};

// ── Trace model ───────────────────────────────────────────────────────────────
type TraceSource =
  | "QUOTATION"
  | "PO"
  | "RECEIPT"
  | "STOCK"
  | "REQUEST"
  | "ISSUE_RETURN"
  | "CYCLE_COUNT"
  | "WORK_ORDER"
  | "EXCEPTION";

type TraceEntry = {
  id: string;
  at: string;
  source: TraceSource;
  actionKey: string;
  ref: string;
  meta: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Source visual config ──────────────────────────────────────────────────────
const SOURCE_STYLES: Record<TraceSource, { dot: string; badge: string; label: string }> = {
  QUOTATION:   { dot: "bg-blue-500",   badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300",     label: "QUOTATION" },
  PO:          { dot: "bg-violet-500", badge: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300", label: "PO" },
  RECEIPT:     { dot: "bg-emerald-500",badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300", label: "RECEIPT" },
  STOCK:       { dot: "bg-amber-500",  badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",   label: "STOCK" },
  REQUEST:     { dot: "bg-sky-500",    badge: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300",             label: "REQUEST" },
  ISSUE_RETURN:{ dot: "bg-rose-500",   badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",       label: "ISSUE" },
  CYCLE_COUNT: { dot: "bg-orange-500", badge: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300", label: "CYCLE" },
  WORK_ORDER:  { dot: "bg-indigo-500", badge: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300", label: "WO" },
  EXCEPTION:   { dot: "bg-red-500",    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300",             label: "EXCEPTION" },
};

// ── Build trace entries from all data sources ─────────────────────────────────
function buildEntries(movements: StockMovement[], quotationsKey: string): TraceEntry[] {
  const entries: TraceEntry[] = [];

  // Quotations
  const quotations = readJson<QuotationRecord>(quotationsKey);
  for (const q of quotations) {
    entries.push({
      id: `q-created-${q.id}`,
      at: q.createdAt,
      source: "QUOTATION",
      actionKey: "app.trace.event.quotation.created",
      ref: q.quotationNumber,
      meta: q.supplierName || "",
    });
    if (q.status !== "BROUILLON" && q.updatedAt !== q.createdAt) {
      entries.push({
        id: `q-status-${q.id}`,
        at: q.updatedAt,
        source: "QUOTATION",
        actionKey: `app.trace.event.quotation.${q.status}`,
        ref: q.quotationNumber,
        meta: q.supplierName || "",
      });
    }
  }

  // Purchase Orders
  const pos = readJson<PORecord>(PO_KEY);
  for (const po of pos) {
    entries.push({
      id: `po-created-${po.id}`,
      at: po.createdAt,
      source: "PO",
      actionKey: "app.trace.event.po.created",
      ref: po.poNumber,
      meta: po.supplierName || "",
    });
    if (po.status !== "DRAFT" && po.updatedAt !== po.createdAt) {
      entries.push({
        id: `po-status-${po.id}`,
        at: po.updatedAt,
        source: "PO",
        actionKey: `app.trace.event.po.${po.status}`,
        ref: po.poNumber,
        meta: po.supplierName || "",
      });
    }
  }

  // Receipts
  const receipts = readJson<ReceiptRecord>(RECEIPTS_KEY);
  for (const r of receipts) {
    entries.push({
      id: `rcpt-${r.id}`,
      at: r.createdAt,
      source: "RECEIPT",
      actionKey: `app.trace.event.receipt.${r.status}`,
      ref: r.receiptNumber,
      meta: `${r.poNumber}${r.supplierName ? ` • ${r.supplierName}` : ""}`,
    });
  }

  // Stock movements from API
  for (const m of movements) {
    const at = m.date || m.validatedAt || "";
    if (!at) continue;
    entries.push({
      id: `stock-${m.id || m.reference || at}`,
      at,
      source: "STOCK",
      actionKey: "",
      ref: m.reference || m.id || "—",
      meta: `${m.type || "MOVE"} • ${m.status || ""}${m.notes ? ` • ${m.notes}` : ""}`,
    });
  }

  // WorkflowStore — internal requests
  const wf = readWorkflowState();
  for (const r of wf.internalRequests) {
    for (const e of r.events || []) {
      entries.push({
        id: `req-${r.id}-${e.at}`,
        at: e.at,
        source: "REQUEST",
        actionKey: "",
        ref: r.id.slice(0, 12),
        meta: `${e.action} • ${r.productLabel}${e.note ? ` • ${e.note}` : ""}`,
      });
    }
  }

  // WorkflowStore — issues & returns
  for (const it of wf.issuesReturns) {
    entries.push({
      id: `ir-${it.id}`,
      at: it.createdAt,
      source: "ISSUE_RETURN",
      actionKey: "",
      ref: it.id.slice(0, 12),
      meta: `${it.kind} • ${it.productLabel} • ${it.department}`,
    });
  }

  // WorkflowStore — cycle counts
  for (const cc of wf.cycleCounts) {
    entries.push({
      id: `cc-${cc.id}`,
      at: cc.updatedAt || cc.createdAt,
      source: "CYCLE_COUNT",
      actionKey: "",
      ref: cc.id.slice(0, 12),
      meta: `${cc.status} • ${cc.productLabel}${typeof cc.delta === "number" ? ` • Δ ${cc.delta}` : ""}`,
    });
  }

  // WorkflowStore — work orders
  for (const wo of wf.workOrders) {
    for (const e of wo.events || []) {
      entries.push({
        id: `wo-${wo.id}-${e.at}`,
        at: e.at,
        source: "WORK_ORDER",
        actionKey: "",
        ref: wo.id.slice(0, 12),
        meta: `${e.action} • ${wo.title}${e.note ? ` • ${e.note}` : ""}`,
      });
    }
  }

  // WorkflowStore — exceptions
  for (const ex of wf.exceptions) {
    entries.push({
      id: `exc-${ex.id}`,
      at: ex.updatedAt || ex.createdAt,
      source: "EXCEPTION",
      actionKey: "",
      ref: ex.id.slice(0, 12),
      meta: `${ex.type} • ${ex.severity} • ${ex.title}`,
    });
  }

  return entries.filter((e) => !!e.at);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TraceabilityPage() {
  const { t } = useT();
  const { query } = usePageSearch();
  const { tenant, user } = useSession();
  const organizationStorageId = getOrganizationStorageId(tenant, user);
  const quotationStorageKey = getQuotationStorageKey(organizationStorageId);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<TraceSource | "ALL">("ALL");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await StockMovementsService.getAllMovements();
        if (mounted) setMovements(list || []);
      } catch {
        if (mounted) setMovements([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const allEntries = useMemo(() => buildEntries(movements, quotationStorageKey), [movements, quotationStorageKey]);

  const filtered = useMemo(() => {
    const needle = `${query} ${search}`.trim().toLowerCase();
    return allEntries
      .filter((e) => sourceFilter === "ALL" || e.source === sourceFilter)
      .filter((e) => {
        if (!needle) return true;
        return `${e.ref} ${e.meta} ${e.actionKey}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [allEntries, query, search, sourceFilter]);

  const SOURCES: TraceSource[] = [
    "QUOTATION", "PO", "RECEIPT", "STOCK",
    "REQUEST", "ISSUE_RETURN", "CYCLE_COUNT", "WORK_ORDER", "EXCEPTION",
  ];

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/50">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 5h6v6H4zM14 13h6v6h-6z" strokeLinecap="round" />
              <path d="M10 8h4v8" strokeLinecap="round" />
              <path d="M12 16h2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="ys-page-title">{t("app.trace.title")}</h1>
            <p className="ys-page-subtitle">{t("app.trace.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="ys-card p-4">
        <div className="ys-toolbar flex-wrap gap-2">
          <div className="ys-toolbar-actions flex-wrap">
            <input
              type="search"
              className="ys-input h-10 w-72"
              placeholder={t("app.trace.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="ys-input h-10 w-52"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as TraceSource | "ALL")}
            >
              <option value="ALL">{t("app.trace.filter.all")}</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{t(`app.trace.source.${s}`)}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
        ) : !filtered.length ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            {t("app.trace.empty")}
          </div>
        ) : (
          <div className="relative mt-6">
            {/* vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-0">
              {filtered.map((entry, idx) => {
                const style = SOURCE_STYLES[entry.source];
                const isLast = idx === filtered.length - 1;
                const actionLabel = entry.actionKey
                  ? t(entry.actionKey as Parameters<typeof t>[0])
                  : entry.meta.split(" • ")[0];
                const metaText = entry.actionKey
                  ? entry.meta
                  : entry.meta.split(" • ").slice(1).join(" • ");

                return (
                  <div key={entry.id} className={`relative flex gap-4 pb-5 ${isLast ? "pb-0" : ""}`}>
                    {/* dot */}
                    <div className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.dot} shadow-sm`} />

                    {/* card */}
                    <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.06em] ${style.badge}`}>
                            {t(`app.trace.source.${entry.source}`)}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{actionLabel}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{entry.ref}</span>
                      </div>
                      {metaText && (
                        <p className="mt-1 text-xs text-muted-foreground">{metaText}</p>
                      )}
                      <p className="mt-1.5 text-[11px] text-muted-foreground/70">{formatDate(entry.at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
