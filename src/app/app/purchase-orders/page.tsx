"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MovableModal from "@/components/MovableModal";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { ProductCatalogService } from "@/lib-stock";
import type { Product } from "@/lib-stock";
import { SuppliersService } from "@/yowyob-tiers/appServices";
import type { Supplier } from "@/yowyob-tiers/appServices";
import { PurchaseOrdersService } from "@/lib-spare/appServices";
import type { PurchaseOrder as PurchaseOrderApi } from "@/lib-spare/appServices";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { getOrganizationStorageId, getQuotationStorageKey } from "@/lib/quotationStorage";

type POStatus = "DRAFT" | "SENT" | "CONFIRMED" | "PARTIAL" | "RECEIVED" | "CANCELLED";

type POLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
};

type POTotals = {
  ht: number;
  vat: number;
  ttc: number;
  air: number;
  ir: number;
  netAPayer: number;
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
  applyRetenue: boolean;
  fromQuotationId: string;
  fromQuotationNumber: string;
  issueDate: string;
  lines: POLine[];
  totals: POTotals;
  createdAt: string;
  updatedAt: string;
};

type QuotationRecord = {
  id: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  status: string;
  lines: { id: string; productId: string; productName: string; sku: string; qty: number; unitPrice: number }[];
};

const VAT_RATE = 0.1925;
const AIR_RATE = 0.055;
const IR_RATE = 0.015;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorStatus(error: unknown) {
  if (!isRecord(error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

function getErrorMessage(error: unknown) {
  if (!isRecord(error)) return "";
  return typeof error.message === "string" ? error.message : "";
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

function generatePONumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `PO-${y}${m}${d}-${random}`;
}

function computePOTotals(lines: POLine[], applyVat: boolean, applyRetenue = true): POTotals {
  const ht = lines.reduce((acc, line) => acc + line.qty * line.unitPrice, 0);
  const vat = applyVat ? ht * VAT_RATE : 0;
  const ttc = ht + vat;
  const air = applyRetenue ? ht * AIR_RATE : 0;
  const ir = applyRetenue ? ht * IR_RATE : 0;
  const netAPayer = ttc - air - ir;
  return { ht, vat, ttc, air, ir, netAPayer };
}

function fromApi(po: PurchaseOrderApi): PORecord {
  const lines: POLine[] = (po.lines || []).map((l) => ({
    id: l.id,
    productId: l.productId,
    productName: l.productName,
    sku: l.sku,
    qty: l.qty,
    unitPrice: l.unitPrice ?? 0,
  }));
  const applyVat = true;
  const applyRetenue = true;
  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId ?? "",
    supplierName: po.supplierName,
    supplierAddress: po.supplierAddress ?? "",
    status: po.status as POStatus,
    expectedAt: "",
    note: po.notes ?? "",
    applyVat,
    applyRetenue,
    fromQuotationId: "",
    fromQuotationNumber: "",
    issueDate: po.createdAt ? po.createdAt.slice(0, 10) : isoDate(new Date()),
    lines,
    totals: computePOTotals(lines, applyVat, applyRetenue),
    createdAt: po.createdAt ?? new Date().toISOString(),
    updatedAt: po.updatedAt ?? new Date().toISOString(),
  };
}

type POLang = "fr" | "en";

function getPOLabels(lang: POLang) {
  if (lang === "fr") return {
    title: "Bon de Commande",
    subtitle: "PURCHASE ORDER",
    docRef: "N° de commande",
    issueDate: "Date d'émission",
    expectedAt: "Livraison prévue",
    fromQuotation: "Réf. cotation",
    buyerSection: "Acheteur",
    supplierSection: "Fournisseur",
    productsSection: "Articles commandés",
    colNo: "#",
    colSku: "SKU / Réf.",
    colDesc: "Désignation",
    colQty: "Qté",
    colUnitPrice: "Prix unitaire HT",
    colSubtotal: "Sous-total HT",
    totalHT: "Total HT",
    totalVAT: "TVA (19,25 %)",
    totalTTC: "Total TTC",
    totalAIR: "Retenue AIR (5,5 %)",
    totalIR: "Retenue IR (1,5 %)",
    totalNet: "Net à payer",
    totalFinal: "Net à payer",
    noteSection: "Observations",
    supplierSig: "Accusé de réception fournisseur",
    buyerSig: "Visa acheteur",
    terms: "Ce bon de commande est soumis aux conditions générales d'achat de l'acheteur. Merci de confirmer réception et délai de livraison prévu.",
    confidential: "Document confidentiel — Bon de commande. Ne pas diffuser.",
    generatedBy: "Généré par YowSpare",
  };
  return {
    title: "Purchase Order",
    subtitle: "BON DE COMMANDE",
    docRef: "PO Number",
    issueDate: "Issue Date",
    expectedAt: "Expected Delivery",
    fromQuotation: "Ref. Quotation",
    buyerSection: "Buyer",
    supplierSection: "Supplier",
    productsSection: "Ordered Items",
    colNo: "#",
    colSku: "SKU / Ref.",
    colDesc: "Description",
    colQty: "Qty",
    colUnitPrice: "Unit Price (excl. VAT)",
    colSubtotal: "Subtotal (excl. VAT)",
    totalHT: "Subtotal (excl. VAT)",
    totalVAT: "VAT (19.25%)",
    totalTTC: "Total incl. VAT",
    totalAIR: "AIR Withholding (5.5%)",
    totalIR: "IR Withholding (1.5%)",
    totalNet: "Net to pay",
    totalFinal: "Net to pay",
    noteSection: "Notes",
    supplierSig: "Supplier Acknowledgment",
    buyerSig: "Authorized Buyer",
    terms: "This purchase order is subject to the buyer's general terms and conditions. Please confirm receipt and expected delivery date.",
    confidential: "Confidential document — Purchase Order. Do not distribute.",
    generatedBy: "Generated by YowSpare",
  };
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function printPO(po: PORecord, lang: POLang = "fr", currency = "XAF", tenantName = "") {
  const L = getPOLabels(lang);

  const fmt = (v: number) =>
    new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(v) ? v : 0);

  const rows = po.lines
    .map(
      (line, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="center">${i + 1}</td>
      <td class="mono">${escHtml(line.sku || "—")}</td>
      <td>${escHtml(line.productName || "—")}</td>
      <td class="center">${line.qty}</td>
      <td class="right">${escHtml(fmt(line.unitPrice))}</td>
      <td class="right bold">${escHtml(fmt(line.qty * line.unitPrice))}</td>
    </tr>`
    )
    .join("");

  const win = window.open("", "_blank", "width=1020,height=800");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<title>${L.title} — ${escHtml(po.poNumber)}</title>
<style>
  @page{margin:0;size:A4}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",Arial,sans-serif;color:#000;background:#fff;font-size:12.5px;line-height:1.5;padding:14mm 16mm}

  .doc-header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2px solid #000;margin-bottom:0}
  .company-name{font-size:20px;font-weight:800;letter-spacing:-.02em}
  .company-sub{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
  .po-title-block{text-align:right}
  .po-main-title{font-size:24px;font-weight:900;letter-spacing:-.01em;line-height:1}
  .po-sub-title{font-size:9px;color:#777;letter-spacing:.12em;text-transform:uppercase;margin-top:3px}

  .meta-grid{display:grid;gap:0;border-bottom:1px solid #ccc;border-top:1px solid #ccc;background:#f5f5f5;margin-top:0}
  .meta-grid-3{grid-template-columns:repeat(3,1fr)}
  .meta-grid-2{grid-template-columns:repeat(2,1fr)}
  .meta-cell{padding:9px 14px;border-right:1px solid #ccc}
  .meta-cell:last-child{border-right:none}
  .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#555;font-weight:600;margin-bottom:2px}
  .meta-value{font-size:12.5px;font-weight:700}

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
  th.right,td.right{text-align:right}
  td{padding:8px 10px;font-size:12px;border-bottom:1px solid #ddd;vertical-align:middle}
  .row-even{background:#fff}
  .row-odd{background:#f5f5f5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  tr:last-child td{border-bottom:none}
  .mono{font-family:"Courier New",monospace;font-size:11.5px;font-weight:600}
  .bold{font-weight:700}

  .totals-wrap{margin-top:6px;display:flex;justify-content:flex-end}
  .totals-table{width:320px;border:1px solid #bbb;border-collapse:collapse}
  .totals-table td{padding:7px 12px;font-size:12px;border-bottom:1px solid #ddd}
  .totals-table tr:last-child td{border-bottom:none;font-weight:700;font-size:13px;background:#f0f0f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .totals-table .t-label{color:#555}
  .totals-table .t-value{text-align:right;font-weight:600}
  .totals-table .retenue{color:#b45309;font-size:11px}

  .note-box{background:#f5f5f5;border:1px solid #bbb;padding:9px 13px;font-size:11px;color:#333;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  .terms{font-size:10.5px;color:#444;line-height:1.6;padding:8px 12px;border:1px solid #ccc;background:#fafafa;margin-top:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

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
    <div class="po-title-block">
      <div class="po-main-title">${L.title.toUpperCase()}</div>
      <div class="po-sub-title">${L.subtitle}</div>
    </div>
  </div>

  <div class="meta-grid meta-grid-3">
    <div class="meta-cell">
      <div class="meta-label">${L.docRef}</div>
      <div class="meta-value">${escHtml(po.poNumber)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">${L.issueDate}</div>
      <div class="meta-value">${escHtml(formatDate(po.issueDate))}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">${L.expectedAt}</div>
      <div class="meta-value">${escHtml(formatDate(po.expectedAt))}</div>
    </div>
  </div>
  ${po.fromQuotationNumber ? `
  <div class="meta-grid meta-grid-2" style="border-top:none">
    <div class="meta-cell">
      <div class="meta-label">${L.fromQuotation}</div>
      <div class="meta-value" style="font-family:'Courier New',monospace;font-size:12px">${escHtml(po.fromQuotationNumber)}</div>
    </div>
  </div>` : ""}

  <div class="body-wrap">
    <div class="section">
      <div class="section-title">${L.buyerSection} / ${L.supplierSection}</div>
      <div class="addr-grid">
        <div class="addr-box">
          <div class="addr-name">${escHtml(tenantName || "YowSpare")}</div>
          <div class="addr-detail">Procurement Department</div>
        </div>
        <div class="addr-box">
          <div class="addr-name">${escHtml(po.supplierName || "—")}</div>
          ${po.supplierAddress ? `<div class="addr-detail">${escHtml(po.supplierAddress)}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${L.productsSection}</div>
      <table>
        <thead>
          <tr>
            <th class="center">${L.colNo}</th>
            <th>${L.colSku}</th>
            <th>${L.colDesc}</th>
            <th class="center">${L.colQty}</th>
            <th class="right">${L.colUnitPrice}</th>
            <th class="right">${L.colSubtotal}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals-wrap">
        <table class="totals-table">
          <tr><td class="t-label">${L.totalHT}</td><td class="t-value">${escHtml(fmt(po.totals.ht))}</td></tr>
          <tr><td class="t-label">${L.totalVAT}</td><td class="t-value">${escHtml(fmt(po.totals.vat))}</td></tr>
          <tr><td class="t-label">${L.totalTTC}</td><td class="t-value">${escHtml(fmt(po.totals.ttc))}</td></tr>
          ${po.applyRetenue ? `<tr><td class="t-label retenue">${L.totalAIR}</td><td class="t-value retenue">- ${escHtml(fmt(po.totals.air))}</td></tr>` : ""}
          ${po.applyRetenue ? `<tr><td class="t-label retenue">${L.totalIR}</td><td class="t-value retenue">- ${escHtml(fmt(po.totals.ir))}</td></tr>` : ""}
          <tr><td class="t-label">${L.totalNet}</td><td class="t-value">${escHtml(fmt(po.totals.netAPayer))}</td></tr>
        </table>
      </div>
    </div>

    ${po.note ? `
    <div class="section">
      <div class="section-title">${L.noteSection}</div>
      <div class="note-box">${escHtml(po.note)}</div>
    </div>` : ""}

    <div class="terms">${L.terms}</div>

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

function POStatusBadge({ status }: { status: POStatus }) {
  const { t } = useT();
  const cls =
    status === "DRAFT"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
      : status === "SENT"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"
      : status === "CONFIRMED"
      ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200"
      : status === "PARTIAL"
      ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200"
      : status === "RECEIVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {t(`app.po.status.${status}`)}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <MovableModal open={open} title={title} onClose={onClose} initialWidth={wide ? 1200 : 1180} initialHeight={760}>
      <div className="mt-6">{children}</div>
    </MovableModal>
  );
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const { query } = usePageSearch();
  const { tenant, user, roles, currency, logout } = useSession();

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState<QuotationRecord[]>([]);

  const [orders, setOrders] = useState<PORecord[]>([]);
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState<"ALL" | POStatus>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PORecord | null>(null);

  const [supplierQuery, setSupplierQuery] = useState("");
  const [showSupplierResults, setShowSupplierResults] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);
  const [lineProductId, setLineProductId] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [lineUnitPrice, setLineUnitPrice] = useState("");

  const [draft, setDraft] = useState(() => ({
    poNumber: generatePONumber(),
    supplierId: "",
    supplierName: "",
    supplierAddress: "",
    expectedAt: "",
    note: "",
    applyVat: true,
    applyRetenue: true,
    fromQuotationId: "",
    fromQuotationNumber: "",
    issueDate: isoDate(new Date()),
    lines: [] as POLine[],
  }));

  const canProcure =
    hasFullOrganizationAccess({ authorities: roles, user, organization: tenant }) ||
    hasAuthority(roles, "procurement:write");
  const organizationStorageId = getOrganizationStorageId(tenant, user);
  const quotationStorageKey = getQuotationStorageKey(organizationStorageId);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!tenant) return;
      setLoading(true);
      try {
        const [pResult, sResult, poResult] = await Promise.allSettled([
          ProductCatalogService.getProducts(),
          SuppliersService.list(),
          PurchaseOrdersService.list(),
        ]);
        if (!mounted) return;
        if (pResult.status === "rejected" && getErrorStatus(pResult.reason) === 401) {
          logout();
          router.replace("/");
          return;
        }
        setProducts(pResult.status === "fulfilled" ? pResult.value || [] : []);
        setSuppliers(sResult.status === "fulfilled" ? sResult.value || [] : []);
        setOrders(poResult.status === "fulfilled" ? (poResult.value || []).map(fromApi) : []);
      } catch (err: unknown) {
        if (!mounted) return;
        if (getErrorStatus(err) === 401) { logout(); router.replace("/"); return; }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [logout, router, t, tenant]);

  useEffect(() => {
    if (!organizationStorageId) {
      setAcceptedQuotations([]);
      return;
    }
    try {
      const raw = localStorage.getItem(quotationStorageKey);
      const parsed = raw ? (JSON.parse(raw) as QuotationRecord[]) : [];
      const accepted = (Array.isArray(parsed) ? parsed : []).filter((q) => q.status === "ACCEPTE");
      setAcceptedQuotations(accepted);
    } catch {
      setAcceptedQuotations([]);
    }
  }, [organizationStorageId, quotationStorageKey]);

  useEffect(() => {
    if (!suppliers.length) return;
    setDraft((prev) => {
      if (prev.supplierId) return prev;
      const first = suppliers[0];
      return { ...prev, supplierId: first.id || "", supplierName: first.name || "", supplierAddress: first.address || "" };
    });
    setSupplierQuery((prev) => {
      if (prev.trim()) return prev;
      const first = suppliers[0];
      return first ? supplierLabel(first) : "";
    });
  }, [suppliers]);

  const supplierLabel = (s: Supplier) => s.name || s.email || s.id || "—";
  const productLabel = (p: Product) => `${p.sku || "—"} • ${p.name || p.description || ""}`;

  const filteredSuppliers = useMemo(() => {
    const needle = supplierQuery.trim().toLowerCase();
    const base = suppliers.slice().sort((a, b) => supplierLabel(a).localeCompare(supplierLabel(b)));
    if (!needle) return base.slice(0, 40);
    return base
      .filter((s) => [s.name, s.email, s.phone, s.address, s.id].filter(Boolean).join(" ").toLowerCase().includes(needle))
      .slice(0, 40);
  }, [supplierQuery, suppliers]);

  const filteredProducts = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    const base = products.slice().sort((a, b) => (a.sku || "").localeCompare(b.sku || ""));
    if (!needle) return base.slice(0, 60);
    return base
      .filter((p) => [p.sku, p.name, p.description, p.categoryName, p.id].filter(Boolean).join(" ").toLowerCase().includes(needle))
      .slice(0, 60);
  }, [productQuery, products]);

  const draftTotals = useMemo(() => computePOTotals(draft.lines, draft.applyVat, draft.applyRetenue), [draft.lines, draft.applyVat, draft.applyRetenue]);

  const filteredOrders = useMemo(() => {
    const needle = `${query} ${poSearch}`.trim().toLowerCase();
    return orders
      .filter((po) => (poStatusFilter === "ALL" ? true : po.status === poStatusFilter))
      .filter((po) => {
        if (!needle) return true;
        return [po.poNumber, po.supplierName, po.status].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [query, poSearch, poStatusFilter, orders]);

  const updateDraft = (patch: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const updatePOStatus = async (id: string, status: POStatus) => {
    try {
      const updated = await PurchaseOrdersService.updateStatus(id, status);
      const rec = fromApi(updated);
      setOrders((prev) => prev.map((po) => (po.id === id ? rec : po)));
      setSelectedPO((prev) => (prev?.id === id ? rec : prev));
    } catch { /* ignore */ }
  };

  const deletePO = async (id: string) => {
    try {
      await PurchaseOrdersService.delete(id);
      setOrders((prev) => prev.filter((po) => po.id !== id));
      setDetailOpen(false);
      setSelectedPO(null);
    } catch { /* ignore */ }
  };

  const openDetail = (po: PORecord) => {
    setSelectedPO(po);
    setDetailOpen(true);
  };

  const resetDraft = () => {
    const first = suppliers[0];
    setDraft({
      poNumber: generatePONumber(),
      supplierId: first?.id || "",
      supplierName: first?.name || "",
      supplierAddress: first?.address || "",
      expectedAt: "",
      note: "",
      applyVat: true,
      applyRetenue: true,
      fromQuotationId: "",
      fromQuotationNumber: "",
      issueDate: isoDate(new Date()),
      lines: [],
    });
    setLineProductId("");
    setProductQuery("");
    setLineQty(1);
    setLineUnitPrice("");
    setShowSupplierResults(false);
    setShowProductResults(false);
    setSupplierQuery(first ? supplierLabel(first) : "");
    setCreateError("");
  };

  const openCreate = () => {
    if (!canProcure) {
      setActionError(t("app.procurement.requisition.forbidden"));
      return;
    }
    resetDraft();
    setCreateOpen(true);
    setActionError("");
  };

  const onSupplierChange = (supplierId: string) => {
    const s = suppliers.find((x) => x.id === supplierId);
    updateDraft({ supplierId, supplierName: s?.name || "", supplierAddress: s?.address || "" });
    setSupplierQuery(s ? supplierLabel(s) : "");
    setShowSupplierResults(false);
  };

  const onProductChange = (productId: string) => {
    setLineProductId(productId);
    const p = products.find((x) => x.id === productId);
    const price = p?.defaultCostPrice ?? 0;
    setLineUnitPrice(price > 0 ? String(price) : "");
    setProductQuery(p ? productLabel(p) : "");
    setShowProductResults(false);
  };

  const onQuotationPrefill = (quotationId: string) => {
    const q = acceptedQuotations.find((x) => x.id === quotationId);
    if (!q) { updateDraft({ fromQuotationId: "", fromQuotationNumber: "" }); return; }
    const lines: POLine[] = q.lines.map((l) => ({
      id: `${l.productId}-${Date.now()}-${Math.random()}`,
      productId: l.productId,
      productName: l.productName,
      sku: l.sku,
      qty: l.qty,
      unitPrice: l.unitPrice,
    }));
    const s = suppliers.find((x) => x.id === q.supplierId);
    updateDraft({
      fromQuotationId: q.id,
      fromQuotationNumber: q.quotationNumber,
      supplierId: q.supplierId,
      supplierName: q.supplierName,
      supplierAddress: q.supplierAddress,
      lines,
    });
    setSupplierQuery(s ? supplierLabel(s) : q.supplierName);
  };

  const addLine = () => {
    setCreateError("");
    const p = products.find((x) => x.id === lineProductId);
    if (!p?.id) { setCreateError(t("app.procurement.quotation.error.productRequired")); return; }
    const qty = Math.max(1, Number(lineQty || 1));
    const unitPrice = Math.max(0, Number(lineUnitPrice || 0));
    const line: POLine = {
      id: `${p.id}-${Date.now()}`,
      productId: p.id,
      productName: p.name || p.description || "",
      sku: p.sku || "—",
      qty,
      unitPrice,
    };
    updateDraft({ lines: [...draft.lines, line] });
    setLineProductId("");
    setProductQuery("");
    setLineQty(1);
    setLineUnitPrice("");
    setShowProductResults(false);
  };

  const removeLine = (lineId: string) => updateDraft({ lines: draft.lines.filter((l) => l.id !== lineId) });

  const savePO = async () => {
    setCreateError("");
    if (!draft.supplierName.trim() || !draft.lines.length) {
      setCreateError(t("app.po.error.required"));
      return;
    }
    try {
      const created = await PurchaseOrdersService.create({
        supplierId: draft.supplierId || undefined,
        supplierName: draft.supplierName,
        supplierAddress: draft.supplierAddress || undefined,
        notes: draft.note || undefined,
        lines: draft.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          sku: l.sku,
          qty: l.qty,
          unitPrice: l.unitPrice || undefined,
        })),
      });
      setOrders((prev) => [fromApi(created), ...prev]);
      setCreateOpen(false);
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err) || t("app.po.error.required"));
    }
  };

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/50">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 4h8v3H8z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 7h12v13H6z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 11h6M9 15h6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="ys-page-title">{t("app.po.title")}</h1>
            <p className="ys-page-subtitle">{t("app.po.subtitle")}</p>
          </div>
        </div>
      </section>

      {actionError ? <div className="ys-alert-error">{actionError}</div> : null}

      <section className="ys-card p-4">
        <div className="ys-toolbar">
          <div className="ys-toolbar-actions">
            <input
              type="search"
              className="ys-input h-10 w-72"
              placeholder={t("app.po.searchPlaceholder")}
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
            />
            <select
              className="ys-input h-10 w-52"
              value={poStatusFilter}
              onChange={(e) => setPoStatusFilter(e.target.value as "ALL" | POStatus)}
            >
              <option value="ALL">{t("app.po.status.all")}</option>
              <option value="DRAFT">{t("app.po.status.DRAFT")}</option>
              <option value="SENT">{t("app.po.status.SENT")}</option>
              <option value="CONFIRMED">{t("app.po.status.CONFIRMED")}</option>
              <option value="PARTIAL">{t("app.po.status.PARTIAL")}</option>
              <option value="RECEIVED">{t("app.po.status.RECEIVED")}</option>
              <option value="CANCELLED">{t("app.po.status.CANCELLED")}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className={[
              "ys-btn-primary gap-2 text-xs",
              canProcure ? "" : "cursor-not-allowed rounded-xl border border-border bg-muted text-muted-foreground opacity-70",
            ].join(" ")}
            aria-disabled={!canProcure}
          >
            <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 5v14" strokeLinecap="round" />
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
            {t("app.po.action.create")}
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
        ) : !filteredOrders.length ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("app.po.empty")}
          </div>
        ) : (
          <div className="ys-table-wrap mt-4">
            <table className="ys-table min-w-[960px]">
              <thead className="ys-table-head bg-muted/30">
                <tr>
                  <th className="ys-table-cell pl-4">{t("app.po.table.number")}</th>
                  <th className="ys-table-cell">{t("app.po.table.supplier")}</th>
                  <th className="ys-table-cell">{t("app.po.table.date")}</th>
                  <th className="ys-table-cell">{t("app.po.table.expected")}</th>
                  <th className="ys-table-cell">{t("app.po.table.lines")}</th>
                  <th className="ys-table-cell">{t("app.po.table.total")}</th>
                  <th className="ys-table-cell">{t("app.po.table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {filteredOrders.map((po) => (
                  <tr
                    key={po.id}
                    className="ys-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => openDetail(po)}
                  >
                    <td className="ys-table-cell pl-4 font-mono text-xs">{po.poNumber}</td>
                    <td className="ys-table-cell">
                      <div className="font-medium">{po.supplierName || "—"}</div>
                      {po.supplierAddress ? (
                        <div className="text-xs text-muted-foreground">{po.supplierAddress}</div>
                      ) : null}
                    </td>
                    <td className="ys-table-cell text-muted-foreground">{formatDate(po.createdAt)}</td>
                    <td className="ys-table-cell text-muted-foreground">{formatDate(po.expectedAt) || "—"}</td>
                    <td className="ys-table-cell">{po.lines.length}</td>
                    <td className="ys-table-cell font-semibold">{formatMoney(po.totals.netAPayer, currency)}</td>
                    <td className="ys-table-cell">
                      <POStatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      {selectedPO && (
        <Modal open={detailOpen} title={selectedPO.poNumber} onClose={() => setDetailOpen(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">{t("app.po.detail.supplier")}</div>
                <div className="font-medium text-sm">{selectedPO.supplierName || "—"}</div>
                {selectedPO.supplierAddress && (
                  <div className="text-xs text-muted-foreground">{selectedPO.supplierAddress}</div>
                )}
              </div>
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">{t("app.po.detail.dates")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("app.po.detail.issued")} :{" "}
                  <span className="text-foreground font-medium">{formatDate(selectedPO.issueDate)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("app.po.detail.expected")} :{" "}
                  <span className="text-foreground font-medium">{formatDate(selectedPO.expectedAt)}</span>
                </div>
                {selectedPO.fromQuotationNumber && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t("app.po.detail.from")} :{" "}
                    <span className="font-mono text-foreground">{selectedPO.fromQuotationNumber}</span>
                  </div>
                )}
                {selectedPO.note && (
                  <div className="mt-1 text-xs text-muted-foreground italic">{selectedPO.note}</div>
                )}
              </div>
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">{t("app.po.detail.status")}</div>
                <div className="mb-2">
                  <POStatusBadge status={selectedPO.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPO.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={() => updatePOStatus(selectedPO.id, "SENT")}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      {t("app.po.action.send")}
                    </button>
                  )}
                  {selectedPO.status === "SENT" && (
                    <button
                      type="button"
                      onClick={() => updatePOStatus(selectedPO.id, "CONFIRMED")}
                      className="rounded-lg bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-violet-700 transition-colors"
                    >
                      {t("app.po.action.confirm")}
                    </button>
                  )}
                  {(selectedPO.status === "CONFIRMED" || selectedPO.status === "PARTIAL") && (
                    <button
                      type="button"
                      onClick={() => updatePOStatus(selectedPO.id, "RECEIVED")}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      {t("app.po.action.receive")}
                    </button>
                  )}
                  {selectedPO.status !== "RECEIVED" && selectedPO.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => updatePOStatus(selectedPO.id, "CANCELLED")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 transition-colors"
                    >
                      {t("app.po.action.cancel")}
                    </button>
                  )}
                  {(selectedPO.status === "RECEIVED" || selectedPO.status === "CANCELLED") && (
                    <span className="text-xs text-muted-foreground italic">
                      {selectedPO.status === "RECEIVED" ? t("app.po.status.RECEIVED") : t("app.po.status.CANCELLED")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="ys-card p-4">
              <div className="ys-section-title mb-3">{t("app.po.detail.lines")}</div>
              <div className="ys-table-wrap">
                <table className="ys-table min-w-[700px]">
                  <thead className="ys-table-head bg-muted/30">
                    <tr>
                      <th className="ys-table-cell pl-4">#</th>
                      <th className="ys-table-cell">SKU</th>
                      <th className="ys-table-cell">{t("app.po.lines.table.product")}</th>
                      <th className="ys-table-cell">{t("app.po.lines.table.qty")}</th>
                      <th className="ys-table-cell">{t("app.po.lines.table.unitPrice")}</th>
                      <th className="ys-table-cell">{t("app.po.lines.table.subtotal")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card text-foreground">
                    {selectedPO.lines.map((line, i) => (
                      <tr key={line.id}>
                        <td className="ys-table-cell pl-4 text-muted-foreground">{i + 1}</td>
                        <td className="ys-table-cell font-mono text-xs">{line.sku}</td>
                        <td className="ys-table-cell font-medium">{line.productName}</td>
                        <td className="ys-table-cell">{line.qty}</td>
                        <td className="ys-table-cell">{formatMoney(line.unitPrice, currency)}</td>
                        <td className="ys-table-cell font-semibold">{formatMoney(line.qty * line.unitPrice, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.ht")}</div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedPO.totals.ht, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.vat")}</div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedPO.totals.vat, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.ttc")}</div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedPO.totals.ttc, currency)}</div>
              </div>
              {selectedPO.applyRetenue && (
                <>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[.08em] text-amber-700 dark:text-amber-400">{t("app.po.total.air")}</div>
                    <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">− {formatMoney(selectedPO.totals.air, currency)}</div>
                  </div>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[.08em] text-amber-700 dark:text-amber-400">{t("app.po.total.ir")}</div>
                    <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">− {formatMoney(selectedPO.totals.ir, currency)}</div>
                  </div>
                </>
              )}
              <div className="ys-card border-primary/20 bg-primary/5 p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.net")}</div>
                <div className="mt-1 text-base font-semibold text-primary">{formatMoney(selectedPO.totals.netAPayer, currency)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => deletePO(selectedPO.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 7h16" strokeLinecap="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                  <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
                </svg>
                {t("app.po.action.delete")}
              </button>
              <div className="flex items-center gap-2">
                <button type="button" className="ys-btn-secondary text-xs" onClick={() => setDetailOpen(false)}>
                  {t("app.po.action.close")}
                </button>
                <button
                  type="button"
                  onClick={() => printPO(selectedPO, lang as POLang, currency, tenant?.name || "")}
                  className="inline-flex items-center gap-1.5 ys-btn-primary text-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M6 9V4h12v5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="4" y="9" width="16" height="9" rx="1.5" />
                    <path d="M8 18v-4h8v4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="17" cy="13" r="0.8" fill="currentColor" stroke="none" />
                  </svg>
                  {lang === "fr" ? "Imprimer / PDF" : "Print / PDF"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <Modal open={createOpen} title={t("app.po.form.title")} onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          {/* Supplier + metadata */}
          <div className="ys-card p-4 relative z-10">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="ys-filter-label">
                {t("app.po.form.supplier")}
                <div className="relative">
                  <input
                    className="ys-filter-control"
                    value={supplierQuery}
                    onFocus={() => setShowSupplierResults(true)}
                    onBlur={() => window.setTimeout(() => setShowSupplierResults(false), 120)}
                    onChange={(e) => {
                      setSupplierQuery(e.target.value);
                      setShowSupplierResults(true);
                      updateDraft({ supplierId: "", supplierName: "", supplierAddress: "" });
                    }}
                    placeholder={t("app.po.form.supplierSearch")}
                  />
                  {showSupplierResults && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
                      {filteredSuppliers.length ? (
                        filteredSuppliers.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); onSupplierChange(s.id || ""); }}
                            className="flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                          >
                            <span className="font-medium text-foreground">{supplierLabel(s)}</span>
                            <span className="text-xs text-muted-foreground">{s.email || s.phone || "—"}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{t("app.po.form.supplierNoResult")}</div>
                      )}
                    </div>
                  )}
                </div>
              </label>
              <label className="ys-filter-label">
                {t("app.po.form.address")}
                <input
                  className="ys-filter-control"
                  value={draft.supplierAddress}
                  onChange={(e) => updateDraft({ supplierAddress: e.target.value })}
                />
              </label>
              <label className="ys-filter-label">
                {t("app.po.form.number")}
                <input className="ys-filter-control" value={draft.poNumber} readOnly />
              </label>
              <label className="ys-filter-label">
                {t("app.po.form.expectedAt")}
                <input
                  type="date"
                  className="ys-filter-control"
                  value={draft.expectedAt}
                  onChange={(e) => updateDraft({ expectedAt: e.target.value })}
                />
              </label>
              <label className="ys-filter-label md:col-span-2">
                {t("app.po.form.note")}
                <input
                  className="ys-filter-control"
                  value={draft.note}
                  onChange={(e) => updateDraft({ note: e.target.value })}
                />
              </label>
            </div>
            {acceptedQuotations.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <label className="ys-filter-label">
                  {t("app.po.form.fromQuotation")}
                  <select
                    className="ys-filter-control"
                    value={draft.fromQuotationId}
                    onChange={(e) => onQuotationPrefill(e.target.value)}
                  >
                    <option value="">{t("app.po.form.fromQuotationPlaceholder")}</option>
                    {acceptedQuotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNumber} — {q.supplierName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="ys-card p-4">
            <div className="ys-section-title">{t("app.po.lines.title")}</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[2fr_120px_170px_90px]">
              <label className="ys-filter-label">
                {t("app.po.lines.product")}
                <div className="relative">
                  <input
                    className="ys-filter-control"
                    value={productQuery}
                    onFocus={() => setShowProductResults(true)}
                    onBlur={() => window.setTimeout(() => setShowProductResults(false), 120)}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setLineProductId("");
                      setLineUnitPrice("");
                      setShowProductResults(true);
                    }}
                    placeholder={t("app.po.lines.productSearch")}
                  />
                  {showProductResults && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
                      {filteredProducts.length ? (
                        filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); onProductChange(p.id || ""); }}
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
                              <span className="truncate font-medium text-foreground">{productLabel(p)}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{formatMoney(p.defaultCostPrice || 0, currency)}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{t("app.po.lines.productNoResult")}</div>
                      )}
                    </div>
                  )}
                </div>
              </label>
              <label className="ys-filter-label">
                {t("app.po.lines.qty")}
                <input
                  className="ys-filter-control"
                  type="number"
                  min={1}
                  value={lineQty}
                  onChange={(e) => setLineQty(Math.max(1, Number(e.target.value || 1)))}
                />
              </label>
              <label className="ys-filter-label">
                {t("app.po.lines.unitPrice")}
                <input
                  className="ys-filter-control"
                  type="number"
                  min={0}
                  value={lineUnitPrice}
                  onChange={(e) => setLineUnitPrice(e.target.value)}
                />
              </label>
              <div className="flex items-end">
                <button type="button" className="ys-btn-primary h-10 w-full px-0" onClick={addLine}>
                  +
                </button>
              </div>
            </div>

            {createError ? <div className="ys-alert-error mt-3">{createError}</div> : null}

            <div className="ys-table-wrap mt-4">
              <table className="ys-table min-w-[700px]">
                <thead className="ys-table-head bg-muted/30">
                  <tr>
                    <th className="ys-table-cell pl-4">{t("app.po.lines.table.product")}</th>
                    <th className="ys-table-cell">{t("app.po.lines.table.qty")}</th>
                    <th className="ys-table-cell">{t("app.po.lines.table.unitPrice")}</th>
                    <th className="ys-table-cell">{t("app.po.lines.table.subtotal")}</th>
                    <th className="ys-table-cell">{t("app.po.lines.table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card text-foreground">
                  {draft.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="ys-table-cell pl-4">
                        <div className="font-medium">{line.productName}</div>
                        <div className="text-xs font-mono text-muted-foreground">{line.sku}</div>
                      </td>
                      <td className="ys-table-cell">{line.qty}</td>
                      <td className="ys-table-cell">{formatMoney(line.unitPrice, currency)}</td>
                      <td className="ys-table-cell font-semibold">{formatMoney(line.qty * line.unitPrice, currency)}</td>
                      <td className="ys-table-cell">
                        <button
                          type="button"
                          className="ys-icon-btn-delete"
                          onClick={() => removeLine(line.id)}
                          aria-label={t("app.po.lines.remove")}
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

            {!draft.lines.length ? (
              <div className="mt-3 text-sm text-muted-foreground">{t("app.po.lines.empty")}</div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.ht")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.ht, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.vat")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.vat, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.ttc")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.ttc, currency)}</div>
              </div>
              {draft.applyRetenue && (
                <>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[.08em] text-amber-700 dark:text-amber-400">{t("app.po.total.air")}</div>
                    <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">− {formatMoney(draftTotals.air, currency)}</div>
                  </div>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[.08em] text-amber-700 dark:text-amber-400">{t("app.po.total.ir")}</div>
                    <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">− {formatMoney(draftTotals.ir, currency)}</div>
                  </div>
                </>
              )}
              <div className="ys-card border-primary/20 bg-primary/5 p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">{t("app.po.total.net")}</div>
                <div className="mt-1 text-lg font-semibold text-primary">{formatMoney(draftTotals.netAPayer, currency)}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={draft.applyVat}
                  onChange={(e) => updateDraft({ applyVat: e.target.checked })}
                />
                {t("app.po.form.applyVat")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={draft.applyRetenue}
                  onChange={(e) => updateDraft({ applyRetenue: e.target.checked })}
                />
                {t("app.po.form.applyRetenue")}
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="ys-btn-secondary text-xs" onClick={() => setCreateOpen(false)}>
                {t("app.po.action.discard")}
              </button>
              <button type="button" className="ys-btn-primary text-xs" onClick={savePO}>
                {t("app.po.action.save")}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
