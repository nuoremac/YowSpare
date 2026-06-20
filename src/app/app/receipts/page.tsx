"use client";

import { useEffect, useMemo, useState } from "react";
import MovableModal from "@/components/MovableModal";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { PurchaseOrdersService, ReceiptsService } from "@/lib-spare/appServices";
import type { PurchaseOrder as PurchaseOrderApi, Receipt as ReceiptApi } from "@/lib-spare/appServices";

type POStatus = "DRAFT" | "SENT" | "CONFIRMED" | "PARTIAL" | "RECEIVED" | "CANCELLED";

type POLine = {
  id: string;
  poLineId: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
};

type PORecord = {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  status: POStatus;
  expectedAt: string;
  note: string;
  applyVat: boolean;
  fromQuotationNumber: string;
  issueDate: string;
  lines: POLine[];
  createdAt: string;
};

type ReceiptStatus = "COMPLETE" | "PARTIAL" | "REJECTED";

type ReceiptLine = {
  id: string;
  poLineId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  note: string;
};

type ReceiptRecord = {
  id: string;
  receiptNumber: string;
  poId: string;
  poNumber: string;
  agencyId: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  status: ReceiptStatus;
  receivedAt: string;
  note: string;
  lines: ReceiptLine[];
  createdAt: string;
  updatedAt: string;
};

const OPEN_STATUSES: POStatus[] = ["CONFIRMED", "PARTIAL"];

function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "body" in error) {
    const body = (error as { body?: unknown }).body;
    if (typeof body === "string") return body;
    if (typeof body === "object" && body) {
      const message = (body as { message?: unknown; error?: unknown }).message ?? (body as { error?: unknown }).error;
      if (typeof message === "string") return message;
    }
  }
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

function normalizePOStatus(status?: string | null): POStatus {
  return status === "SENT" ||
    status === "CONFIRMED" ||
    status === "PARTIAL" ||
    status === "RECEIVED" ||
    status === "CANCELLED" ||
    status === "DRAFT"
    ? status
    : "DRAFT";
}

function normalizeReceiptStatus(status?: string | null): ReceiptStatus {
  return status === "COMPLETE" || status === "PARTIAL" || status === "REJECTED" ? status : "PARTIAL";
}

function fromApiPO(po: PurchaseOrderApi): PORecord {
  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId || "",
    supplierName: po.supplierName || "",
    supplierAddress: po.supplierAddress || "",
    status: normalizePOStatus(po.status),
    expectedAt: "",
    note: po.notes || "",
    applyVat: true,
    fromQuotationNumber: "",
    issueDate: po.createdAt ? po.createdAt.slice(0, 10) : "",
    lines: (po.lines || []).map((line, index) => ({
      id: line.id || `${po.id}:line:${index}`,
      poLineId: line.id,
      productId: line.productId,
      productName: line.productName,
      sku: line.sku,
      qty: line.qty,
      unitPrice: line.unitPrice ?? 0,
    })),
    createdAt: po.createdAt || "",
  };
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
    receivedAt: receipt.receivedAt || receipt.createdAt || "",
    note: receipt.note || "",
    lines: (receipt.lines || []).map((line) => ({
      id: line.id,
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

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function computeStatus(lines: ReceiptLine[]): ReceiptStatus {
  if (!lines.length) return "PARTIAL";
  const allFull = lines.every((l) => l.receivedQty >= l.orderedQty);
  if (allFull) return "COMPLETE";
  return "PARTIAL";
}

function normalizeReceivedQty(value: string | undefined, orderedQty: number) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(0, Math.trunc(orderedQty)), Math.max(0, Math.trunc(parsed)));
}

type GRNLang = "fr" | "en";

function getGRNLabels(lang: GRNLang) {
  if (lang === "fr") return {
    title: "Bon de Réception",
    subtitle: "GOODS RECEIPT NOTE",
    docRef: "N° réception",
    poRef: "N° bon de commande",
    receivedAt: "Date de réception",
    buyerSection: "Acheteur",
    supplierSection: "Fournisseur",
    itemsSection: "Articles réceptionnés",
    colNo: "#",
    colSku: "SKU / Réf.",
    colDesc: "Désignation",
    colOrdered: "Qté commandée",
    colReceived: "Qté reçue",
    colDiff: "Écart",
    noteSection: "Observations",
    buyerSig: "Responsable réception",
    supplierSig: "Représentant fournisseur",
    statusComplete: "Réception complète",
    statusPartial: "Réception partielle",
    statusRejected: "Rejetée",
    confidential: "Document interne — Bon de réception. Ne pas diffuser.",
    generatedBy: "Généré par YowSpare",
  };
  return {
    title: "Goods Receipt Note",
    subtitle: "BON DE RÉCEPTION",
    docRef: "Receipt #",
    poRef: "Purchase Order #",
    receivedAt: "Reception Date",
    buyerSection: "Buyer",
    supplierSection: "Supplier",
    itemsSection: "Received Items",
    colNo: "#",
    colSku: "SKU / Ref.",
    colDesc: "Description",
    colOrdered: "Ordered Qty",
    colReceived: "Received Qty",
    colDiff: "Difference",
    noteSection: "Notes",
    buyerSig: "Reception Officer",
    supplierSig: "Supplier Representative",
    statusComplete: "Complete",
    statusPartial: "Partial",
    statusRejected: "Rejected",
    confidential: "Internal document — Goods Receipt Note. Do not distribute.",
    generatedBy: "Generated by YowSpare",
  };
}

function escHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function printGRN(receipt: ReceiptRecord, lang: GRNLang = "fr", tenantName = "") {
  const L = getGRNLabels(lang);
  const statusText =
    receipt.status === "COMPLETE" ? L.statusComplete :
    receipt.status === "PARTIAL"  ? L.statusPartial  : L.statusRejected;

  const rows = receipt.lines.map((line, i) => {
    const diff = line.receivedQty - line.orderedQty;
    const diffStr = diff === 0 ? "—" : diff > 0 ? `+${diff}` : String(diff);
    const diffColor = diff < 0 ? "color:#c00" : diff > 0 ? "color:#070" : "";
    return `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="center">${i + 1}</td>
      <td class="mono">${escHtml(line.sku || "—")}</td>
      <td>${escHtml(line.productName || "—")}</td>
      <td class="center">${line.orderedQty}</td>
      <td class="center bold ${line.receivedQty < line.orderedQty ? "short" : "full"}">${line.receivedQty}</td>
      <td class="center" style="${diffColor}">${diffStr}</td>
    </tr>
    ${line.note ? `<tr class="note-row"><td></td><td colspan="5" class="line-note">${escHtml(line.note)}</td></tr>` : ""}`;
  }).join("");

  const win = window.open("", "_blank", "width=1020,height=800");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<title>${L.title} — ${escHtml(receipt.receiptNumber)}</title>
<style>
  @page{margin:0;size:A4}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",Arial,sans-serif;color:#000;background:#fff;font-size:12.5px;line-height:1.5;padding:14mm 16mm}

  .doc-header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2px solid #000}
  .company-name{font-size:20px;font-weight:800;letter-spacing:-.02em}
  .company-sub{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
  .grn-title-block{text-align:right}
  .grn-main-title{font-size:24px;font-weight:900;letter-spacing:-.01em;line-height:1}
  .grn-sub-title{font-size:9px;color:#777;letter-spacing:.12em;text-transform:uppercase;margin-top:3px}

  .meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #ccc;border-top:1px solid #ccc;background:#f5f5f5;margin-top:0}
  .meta-cell{padding:9px 14px;border-right:1px solid #ccc}
  .meta-cell:last-child{border-right:none}
  .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#555;font-weight:600;margin-bottom:2px}
  .meta-value{font-size:12.5px;font-weight:700}
  .status-badge{display:inline-block;padding:2px 10px;border:1px solid #000;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}

  .body-wrap{padding:16px 0 0}
  .section{margin-bottom:18px}
  .section-title{font-size:9px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:7px;display:flex;align-items:center;gap:6px}
  .section-title::after{content:"";flex:1;height:1px;background:#ccc}

  .addr-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .addr-box{background:#f5f5f5;border:1px solid #ccc;border-left:3px solid #000;padding:10px 14px}
  .addr-name{font-size:14px;font-weight:700}
  .addr-detail{font-size:11px;color:#444;margin-top:3px}

  table{width:100%;border-collapse:collapse;border:1px solid #bbb}
  thead tr{background:#222;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  th{padding:8px 10px;text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;white-space:nowrap}
  th.center,td.center{text-align:center}
  td{padding:7px 10px;font-size:12px;border-bottom:1px solid #ddd;vertical-align:middle}
  .row-even{background:#fff}
  .row-odd{background:#f5f5f5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  tr:last-child td{border-bottom:none}
  .mono{font-family:"Courier New",monospace;font-size:11.5px;font-weight:600}
  .bold{font-weight:700}
  .short{color:#c00}
  .full{color:#070}
  .note-row td{padding:2px 10px 6px;font-size:10.5px;color:#666;font-style:italic;background:#fff}
  .line-note::before{content:"↳ ";}

  .note-box{background:#f5f5f5;border:1px solid #bbb;padding:9px 13px;font-size:11px;color:#333;line-height:1.7}

  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:20px}
  .sig-box{border:1px solid #bbb;padding:12px 14px}
  .sig-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #ccc}
  .sig-space{height:72px;border-bottom:1px solid #000}

  .doc-footer{margin-top:18px;padding-top:8px;border-top:1px solid #ccc;display:flex;justify-content:space-between;font-size:9.5px;color:#888}
</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="company-name">${escHtml(tenantName || "YowSpare")}</div>
      <div class="company-sub">Procurement — Spare Parts Management</div>
    </div>
    <div class="grn-title-block">
      <div class="grn-main-title">${L.title.toUpperCase()}</div>
      <div class="grn-sub-title">${L.subtitle}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-cell">
      <div class="meta-label">${L.docRef}</div>
      <div class="meta-value">${escHtml(receipt.receiptNumber)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">${L.poRef}</div>
      <div class="meta-value" style="font-family:'Courier New',monospace;font-size:12px">${escHtml(receipt.poNumber)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">${L.receivedAt}</div>
      <div class="meta-value">${escHtml(formatDate(receipt.receivedAt))}</div>
    </div>
  </div>

  <div class="body-wrap">
    <div class="section">
      <div class="section-title">${L.buyerSection} / ${L.supplierSection}</div>
      <div class="addr-grid">
        <div class="addr-box">
          <div class="addr-name">${escHtml(tenantName || "YowSpare")}</div>
          <div class="addr-detail">Procurement Department</div>
        </div>
        <div class="addr-box">
          <div class="addr-name">${escHtml(receipt.supplierName || "—")}</div>
          ${receipt.supplierAddress ? `<div class="addr-detail">${escHtml(receipt.supplierAddress)}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${L.itemsSection} — <span class="status-badge">${statusText}</span></div>
      <table>
        <thead>
          <tr>
            <th class="center">${L.colNo}</th>
            <th>${L.colSku}</th>
            <th>${L.colDesc}</th>
            <th class="center">${L.colOrdered}</th>
            <th class="center">${L.colReceived}</th>
            <th class="center">${L.colDiff}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    ${receipt.note ? `
    <div class="section">
      <div class="section-title">${L.noteSection}</div>
      <div class="note-box">${escHtml(receipt.note)}</div>
    </div>` : ""}

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">${L.buyerSig}</div>
        <div class="sig-space"></div>
      </div>
      <div class="sig-box">
        <div class="sig-title">${L.supplierSig}</div>
        <div class="sig-space"></div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>${L.confidential}</span>
    <span>${L.generatedBy} · ${escHtml(new Date().toLocaleDateString())}</span>
  </div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`);
  win.document.close();
  win.focus();
}

function ReceiptStatusBadge({ status }: { status: ReceiptStatus }) {
  const { t } = useT();
  const cls =
    status === "COMPLETE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      : status === "PARTIAL"
      ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200"
      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {t(`app.receipt.status.${status}`)}
    </span>
  );
}

function Modal({
  open, title, children, onClose, wide,
}: {
  open: boolean; title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <MovableModal open={open} title={title} onClose={onClose} initialWidth={wide ? 1200 : 1100} initialHeight={760}>
      <div className="mt-6">{children}</div>
    </MovableModal>
  );
}

export default function ReceiptsPage() {
  const { t, lang } = useT();
  const { query } = usePageSearch();
  const { tenant, user, roles, activeAgencyId } = useSession();
  const canManageReceipts =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "procurement:write");

  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [openPOs, setOpenPOs] = useState<PORecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadSeq, setReloadSeq] = useState(0);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReceiptStatus>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const [selectedPoId, setSelectedPoId] = useState("");
  const [receivedAt, setReceivedAt] = useState(isoDate(new Date()));
  const [receiptNote, setReceiptNote] = useState("");
  const [lineInputs, setLineInputs] = useState<Record<string, { qty: string; note: string }>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!tenant) {
        setReceipts([]);
        setOpenPOs([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        const [receiptsResult, poResult] = await Promise.allSettled([
          ReceiptsService.list(),
          PurchaseOrdersService.list(),
        ]);
        if (!mounted) return;
        setReceipts(receiptsResult.status === "fulfilled" ? (receiptsResult.value || []).map(fromApiReceipt) : []);
        setOpenPOs(
          poResult.status === "fulfilled"
            ? (poResult.value || []).map(fromApiPO).filter((po) => OPEN_STATUSES.includes(po.status))
            : []
        );
        if (receiptsResult.status === "rejected" || poResult.status === "rejected") {
          setLoadError(t("app.receipt.error.load"));
        }
      } catch {
        if (!mounted) return;
        setReceipts([]);
        setOpenPOs([]);
        setLoadError(t("app.receipt.error.load"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reloadSeq, t, tenant]);

  const selectedPO = useMemo(
    () => openPOs.find((po) => po.id === selectedPoId) ?? null,
    [openPOs, selectedPoId]
  );

  useEffect(() => {
    if (!selectedPO) { setLineInputs({}); return; }
    const initial: Record<string, { qty: string; note: string }> = {};
    for (const line of selectedPO.lines) {
      initial[line.id] = { qty: String(line.qty), note: "" };
    }
    setLineInputs(initial);
  }, [selectedPO]);

  const filteredReceipts = useMemo(() => {
    const needle = `${query} ${receiptSearch}`.trim().toLowerCase();
    return receipts
      .filter((r) => (statusFilter === "ALL" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!needle) return true;
        return [r.receiptNumber, r.poNumber, r.supplierName].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [query, receiptSearch, statusFilter, receipts]);

  const openCreate = () => {
    if (!canManageReceipts) return;
    setSelectedPoId(openPOs[0]?.id ?? "");
    setReceivedAt(isoDate(new Date()));
    setReceiptNote("");
    setLineInputs({});
    setCreateError("");
    setCreateOpen(true);
  };

  const saveReceipt = async () => {
    if (!canManageReceipts) return;
    setCreateError("");
    if (!selectedPoId || !selectedPO) {
      setCreateError(t("app.receipt.error.selectPo"));
      return;
    }
    if (!activeAgencyId) {
      setCreateError(t("app.receipt.error.agencyRequired"));
      return;
    }
    const lines: ReceiptLine[] = selectedPO.lines.map((l) => ({
      id: `${l.id}-rcpt-${Date.now()}`,
      poLineId: l.poLineId,
      productId: l.productId,
      productName: l.productName,
      sku: l.sku,
      orderedQty: l.qty,
      receivedQty: normalizeReceivedQty(lineInputs[l.id]?.qty, l.qty),
      note: lineInputs[l.id]?.note ?? "",
    }));
    const receivedLines = lines.filter((line) => line.receivedQty > 0);
    if (!receivedLines.length) {
      setCreateError(t("app.receipt.error.zeroQty"));
      return;
    }
    if (receivedLines.some((line) => !line.poLineId)) {
      setCreateError(t("app.receipt.error.poLineIds"));
      return;
    }
    if (receivedLines.some((line) => !line.productId || !line.productName.trim() || !line.sku.trim())) {
      setCreateError(t("app.receipt.error.invalidLines"));
      return;
    }
    const status = computeStatus(lines);
    try {
      const saved = await ReceiptsService.create({
        poId: selectedPO.id,
        agencyId: activeAgencyId,
        note: receiptNote.trim() || undefined,
        lines: receivedLines.map((line) => ({
          poLineId: line.poLineId,
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          orderedQty: line.orderedQty,
          receivedQty: line.receivedQty,
          note: line.note || undefined,
        })),
      });
      const nextStatus: POStatus = status === "COMPLETE" ? "RECEIVED" : "PARTIAL";
      try {
        await PurchaseOrdersService.updateStatus(selectedPO.id, nextStatus);
      } catch {
        // Receipt creation succeeded; keep the page usable even if status sync is delayed.
      }
      const savedRecord = fromApiReceipt(saved);
      setReceipts((prev) => [
        { ...savedRecord, receivedAt: savedRecord.receivedAt || receivedAt },
        ...prev.filter((receipt) => receipt.id !== savedRecord.id),
      ]);
      setOpenPOs((prev) =>
        prev
          .map((po) => (po.id === selectedPO.id ? { ...po, status: nextStatus } : po))
          .filter((po) => OPEN_STATUSES.includes(po.status))
      );
      setCreateOpen(false);
      setReloadSeq((seq) => seq + 1);
    } catch (error: unknown) {
      const apiMessage = getApiErrorMessage(error);
      setCreateError(apiMessage ? `${t("app.receipt.error.save")} ${apiMessage}` : t("app.receipt.error.save"));
    }
  };

  const deleteReceipt = (id: string) => {
    if (!canManageReceipts) return;
    setReceipts(receipts.filter((r) => r.id !== id));
    setDetailOpen(false);
    setSelectedReceipt(null);
  };

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/50">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="ys-page-title">{t("app.receipt.title")}</h1>
            <p className="ys-page-subtitle">{t("app.receipt.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="ys-card p-4">
        <div className="ys-toolbar">
          <div className="ys-toolbar-actions">
            <input
              type="search"
              className="ys-input h-10 w-72"
              placeholder={t("app.receipt.searchPlaceholder")}
              value={receiptSearch}
              onChange={(e) => setReceiptSearch(e.target.value)}
            />
            <select
              className="ys-input h-10 w-52"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | ReceiptStatus)}
            >
              <option value="ALL">{t("app.receipt.status.all")}</option>
              <option value="COMPLETE">{t("app.receipt.status.COMPLETE")}</option>
              <option value="PARTIAL">{t("app.receipt.status.PARTIAL")}</option>
              <option value="REJECTED">{t("app.receipt.status.REJECTED")}</option>
            </select>
          </div>
          <button type="button" onClick={openCreate} className="ys-btn-primary gap-2 text-xs" disabled={!canManageReceipts}>
            <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 5v14" strokeLinecap="round" />
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
            {t("app.receipt.action.create")}
          </button>
        </div>

        {loadError ? <div className="ys-alert-error mt-4">{loadError}</div> : null}

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
        ) : !filteredReceipts.length ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("app.receipt.empty")}
          </div>
        ) : (
          <div className="ys-table-wrap mt-4">
            <table className="ys-table min-w-[860px]">
              <thead className="ys-table-head bg-muted/30">
                <tr>
                  <th className="ys-table-cell pl-4">{t("app.receipt.table.number")}</th>
                  <th className="ys-table-cell">{t("app.receipt.table.po")}</th>
                  <th className="ys-table-cell">{t("app.receipt.table.supplier")}</th>
                  <th className="ys-table-cell">{t("app.receipt.table.date")}</th>
                  <th className="ys-table-cell">{t("app.receipt.table.lines")}</th>
                  <th className="ys-table-cell">{t("app.receipt.table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {filteredReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className="ys-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => { setSelectedReceipt(r); setDetailOpen(true); }}
                  >
                    <td className="ys-table-cell pl-4 font-mono text-xs">{r.receiptNumber}</td>
                    <td className="ys-table-cell font-mono text-xs">{r.poNumber}</td>
                    <td className="ys-table-cell">
                      <div className="font-medium">{r.supplierName || "—"}</div>
                      {r.supplierAddress ? <div className="text-xs text-muted-foreground">{r.supplierAddress}</div> : null}
                    </td>
                    <td className="ys-table-cell text-muted-foreground">{formatDate(r.receivedAt)}</td>
                    <td className="ys-table-cell">{r.lines.length}</td>
                    <td className="ys-table-cell"><ReceiptStatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      {selectedReceipt && (
        <Modal open={detailOpen} title={selectedReceipt.receiptNumber} onClose={() => setDetailOpen(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">{t("app.receipt.detail.supplier")}</div>
                <div className="font-medium text-sm">{selectedReceipt.supplierName || "—"}</div>
                {selectedReceipt.supplierAddress && (
                  <div className="text-xs text-muted-foreground">{selectedReceipt.supplierAddress}</div>
                )}
              </div>
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">{t("app.receipt.detail.dates")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("app.receipt.detail.issued")} :{" "}
                  <span className="font-medium text-foreground">{formatDate(selectedReceipt.receivedAt)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("app.receipt.detail.po")} :{" "}
                  <span className="font-mono text-foreground">{selectedReceipt.poNumber}</span>
                </div>
                {selectedReceipt.note && (
                  <div className="mt-1 text-xs italic text-muted-foreground">{selectedReceipt.note}</div>
                )}
              </div>
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">{t("app.receipt.detail.status")}</div>
                <ReceiptStatusBadge status={selectedReceipt.status} />
              </div>
            </div>

            <div className="ys-card p-4">
              <div className="ys-section-title mb-3">{t("app.receipt.detail.lines")}</div>
              <div className="ys-table-wrap">
                <table className="ys-table min-w-[720px]">
                  <thead className="ys-table-head bg-muted/30">
                    <tr>
                      <th className="ys-table-cell pl-4">#</th>
                      <th className="ys-table-cell">SKU</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.product")}</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.ordered")}</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.received")}</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.remaining")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card text-foreground">
                    {selectedReceipt.lines.map((line, i) => {
                      const remaining = Math.max(0, line.orderedQty - line.receivedQty);
                      return (
                        <tr key={line.id}>
                          <td className="ys-table-cell pl-4 text-muted-foreground">{i + 1}</td>
                          <td className="ys-table-cell font-mono text-xs">{line.sku}</td>
                          <td className="ys-table-cell font-medium">{line.productName}</td>
                          <td className="ys-table-cell">{line.orderedQty}</td>
                          <td className={`ys-table-cell font-semibold ${line.receivedQty < line.orderedQty ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {line.receivedQty}
                          </td>
                          <td className={`ys-table-cell ${remaining > 0 ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground"}`}>
                            {remaining > 0 ? remaining : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => deleteReceipt(selectedReceipt.id)}
                disabled={!canManageReceipts}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 7h16" strokeLinecap="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                  <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
                </svg>
                {t("app.receipt.action.delete")}
              </button>
              <div className="flex items-center gap-2">
                <button type="button" className="ys-btn-secondary text-xs" onClick={() => setDetailOpen(false)}>
                  {t("app.receipt.action.close")}
                </button>
                <button
                  type="button"
                  onClick={() => printGRN(selectedReceipt, lang as GRNLang, tenant?.name || "")}
                  className="inline-flex items-center gap-1.5 ys-btn-primary text-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M6 9V4h12v5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="4" y="9" width="16" height="9" rx="1.5" />
                    <path d="M8 18v-4h8v4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="17" cy="13" r="0.8" fill="currentColor" stroke="none" />
                  </svg>
                  {t("app.receipt.action.print")}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <Modal open={createOpen} title={t("app.receipt.form.title")} onClose={() => setCreateOpen(false)} wide>
        <div className="space-y-4">
          <div className="ys-card p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="ys-filter-label md:col-span-2">
                {t("app.receipt.form.selectPo")}
                <select
                  className="ys-filter-control"
                  value={selectedPoId}
                  onChange={(e) => { setSelectedPoId(e.target.value); setCreateError(""); }}
                >
                  <option value="">{t("app.receipt.form.selectPoPlaceholder")}</option>
                  {openPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplierName}
                    </option>
                  ))}
                </select>
                {!openPOs.length && (
                  <span className="mt-1 block text-xs text-muted-foreground">{t("app.receipt.form.noPo")}</span>
                )}
              </label>
              <label className="ys-filter-label">
                {t("app.receipt.form.receivedAt")}
                <input
                  type="date"
                  className="ys-filter-control"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                />
              </label>
              <label className="ys-filter-label md:col-span-3">
                {t("app.receipt.form.note")}
                <input
                  className="ys-filter-control"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                />
              </label>
            </div>
          </div>

          {selectedPO && (
            <div className="ys-card p-4">
              <div className="ys-section-title mb-3">{t("app.receipt.lines.title")}</div>
              <div className="ys-table-wrap">
                <table className="ys-table min-w-[780px]">
                  <thead className="ys-table-head bg-muted/30">
                    <tr>
                      <th className="ys-table-cell pl-4">SKU</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.product")}</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.ordered")}</th>
                      <th className="ys-table-cell w-36">{t("app.receipt.lines.received")}</th>
                      <th className="ys-table-cell">{t("app.receipt.lines.note")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card text-foreground">
                    {selectedPO.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="ys-table-cell pl-4 font-mono text-xs">{line.sku}</td>
                        <td className="ys-table-cell font-medium">{line.productName}</td>
                        <td className="ys-table-cell text-muted-foreground">{line.qty}</td>
                        <td className="ys-table-cell">
                          <input
                            type="number"
                            min={0}
                            className="ys-filter-control h-8 w-24 text-sm"
                            value={lineInputs[line.id]?.qty ?? String(line.qty)}
                            onChange={(e) =>
                              setLineInputs((prev) => ({
                                ...prev,
                                [line.id]: { ...prev[line.id], qty: e.target.value },
                              }))
                            }
                          />
                        </td>
                        <td className="ys-table-cell">
                          <input
                            type="text"
                            className="ys-filter-control h-8 text-sm"
                            placeholder="—"
                            value={lineInputs[line.id]?.note ?? ""}
                            onChange={(e) =>
                              setLineInputs((prev) => ({
                                ...prev,
                                [line.id]: { ...prev[line.id], note: e.target.value },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {createError ? <div className="ys-alert-error">{createError}</div> : null}

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="ys-btn-secondary text-xs" onClick={() => setCreateOpen(false)}>
              {t("app.receipt.action.discard")}
            </button>
            <button type="button" className="ys-btn-primary text-xs" onClick={saveReceipt} disabled={!canManageReceipts}>
              {t("app.receipt.action.save")}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
