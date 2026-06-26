"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MovableModal from "@/components/MovableModal";
import ProductImage, { ProductImageFallback } from "@/components/ProductImage";
import { usePageSearch } from "@/components/PageSearchContext";
import { useT } from "@/components/i18n/useT";
import { useSession } from "@/store/session";
import { ProductCatalogService, StockLevelsService } from "@/lib-stock";
import type { Product, StockLevel } from "@/lib-stock";
import { SuppliersService } from "@/yowyob-tiers/appServices";
import type { Supplier } from "@/yowyob-tiers/appServices";
import { hasAuthority, hasFullOrganizationAccess } from "@/lib/accessControl";
import { getOrganizationStorageId, getQuotationStorageKey } from "@/lib/quotationStorage";
import ExportMenu from "@/components/ExportMenu";

type QuotationStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";

type QuotationLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
  stockAvailable: number;
};

type QuotationTotals = {
  ht: number;
  vat: number;
  ttc: number;
  discount: number;
  air?: number;
  ir?: number;
  netAPayer?: number;
  final: number;
};

type QuotationRecord = {
  id: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  status: QuotationStatus;
  paymentMethod: string;
  nosRef: string;
  vosRef: string;
  globalDiscountPct: number;
  installments: number;
  applyVat: boolean;
  applyRetenue?: boolean;
  referralPartner: boolean;
  issueDate: string;
  validUntil: string;
  systemDate: string;
  inStockOnly: boolean;
  lines: QuotationLine[];
  totals: QuotationTotals;
  createdAt: string;
  updatedAt: string;
};

const VAT_RATE = 0.1925;
const AIR_RATE = 0.055;
const IR_RATE = 0.015;

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

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function generateQuotationNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `RFQ-${y}${m}${d}-${random}`;
}

function computeQuotationTotals(
  lines: QuotationLine[],
  discountPct: number,
  applyVat: boolean,
  applyRetenue = true,
): QuotationTotals {
  const ht = lines.reduce((acc, line) => acc + line.qty * line.unitPrice, 0);
  const discount = Math.max(0, ht * (Math.max(0, discountPct) / 100));
  const base = Math.max(0, ht - discount);
  const vat = applyVat ? base * VAT_RATE : 0;
  const ttc = base + vat;
  const air = applyRetenue ? base * AIR_RATE : 0;
  const ir = applyRetenue ? base * IR_RATE : 0;
  const netAPayer = ttc - air - ir;
  return { ht, vat, ttc, discount, air, ir, netAPayer, final: netAPayer };
}

function payableTotal(totals: QuotationTotals) {
  return totals.netAPayer ?? totals.final;
}

type RFQLang = "fr" | "en";

function getRFQLabels(lang: RFQLang) {
  if (lang === "fr") return {
    title: "Demande de Cotation",
    subtitle: "REQUEST FOR QUOTATION",
    companySub: "Approvisionnement — Gestion des pieces de rechange",
    docRef: "N° de document",
    issueDate: "Date d'émission",
    validUntil: "Valide jusqu'au",
    payment: "Mode de paiement",
    ourRef: "Notre réf.",
    yourRef: "Votre réf.",
    supplierSection: "Fournisseur",
    productsSection: "Produits à cotiser",
    colNo: "#",
    colSku: "SKU / Réf.",
    colDesc: "Désignation",
    colUnit: "Unité",
    colQty: "Qté demandée",
    colUnitPrice: "Prix unitaire HT",
    colSubtotal: "Sous-total HT",
    toFill: "À renseigner",
    instructions: "Veuillez verifier les prix unitaires, taxes et retenues, puis retourner ce document signe avant la date de validite. Tout prix soumis est repute definitif pour la duree de validite indiquee.",
    supplierSig: "Cachet & signature du fournisseur",
    buyerSig: "Visa de l'acheteur",
    sigName: "Nom :",
    sigDate: "Date :",
    sigFunc: "Fonction :",
    confidential: "Document confidentiel — Demande de cotation uniquement. Ne pas diffuser.",
    generatedBy: "Généré par YowSpare",
    vatNote: "TVA applicable selon la législation en vigueur.",
    totalsTitle: "Synthese financiere",
    totalHT: "Total HT",
    totalVAT: "TVA",
    totalTTC: "Total TTC",
    totalDiscount: "Remise",
    totalAIR: "Retenue AIR (5,5 %)",
    totalIR: "Retenue IR (1,5 %)",
    totalNet: "Net a payer",
  };
  return {
    title: "Request for Quotation",
    subtitle: "DEMANDE DE COTATION",
    companySub: "Procurement — Spare Parts Management",
    docRef: "Document No.",
    issueDate: "Issue Date",
    validUntil: "Valid Until",
    payment: "Payment Method",
    ourRef: "Our Ref.",
    yourRef: "Your Ref.",
    supplierSection: "Supplier",
    productsSection: "Products to Quote",
    colNo: "#",
    colSku: "SKU / Ref.",
    colDesc: "Description",
    colUnit: "Unit",
    colQty: "Qty Requested",
    colUnitPrice: "Unit Price (excl. VAT)",
    colSubtotal: "Subtotal (excl. VAT)",
    toFill: "To fill in",
    instructions: "Please review the unit prices, taxes, and withholding amounts, then return this signed document before the validity date. All submitted prices are considered final for the stated validity period.",
    supplierSig: "Supplier Stamp & Signature",
    buyerSig: "Buyer Approval",
    sigName: "Name:",
    sigDate: "Date:",
    sigFunc: "Title:",
    confidential: "Confidential document — Request for Quotation only. Do not distribute.",
    generatedBy: "Generated by YowSpare",
    vatNote: "VAT applicable per current legislation.",
    totalsTitle: "Financial summary",
    totalHT: "Subtotal (excl. VAT)",
    totalVAT: "VAT",
    totalTTC: "Total (incl. VAT)",
    totalDiscount: "Discount",
    totalAIR: "AIR Withholding (5.5%)",
    totalIR: "IR Withholding (1.5%)",
    totalNet: "Net payable",
  };
}

function printRFQ(quotation: QuotationRecord, lang: RFQLang = "fr", tenantName = "", currency = "XAF") {
  const L = getRFQLabels(lang);
  const win = window.open("", "_blank", "width=1020,height=800");
  if (!win) return;

  const rows = quotation.lines.map((line, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="center">${i + 1}</td>
      <td class="mono">${escHtml(line.sku || "—")}</td>
      <td>${escHtml(line.productName || "—")}</td>
      <td class="center">—</td>
      <td class="center bold">${line.qty}</td>
      <td class="right">${escHtmlRaw(formatMoney(line.unitPrice, currency))}</td>
      <td class="right bold">${escHtmlRaw(formatMoney(line.qty * line.unitPrice, currency))}</td>
    </tr>`).join("");
  const showWithholding = quotation.applyRetenue ?? true;
  const totalsRows = [
    `<div class="totals-hint-row"><span>${L.totalHT}</span><span>${escHtmlRaw(formatMoney(quotation.totals.ht, currency))}</span></div>`,
    quotation.totals.discount > 0
      ? `<div class="totals-hint-row"><span>${L.totalDiscount}</span><span>- ${escHtmlRaw(formatMoney(quotation.totals.discount, currency))}</span></div>`
      : "",
    `<div class="totals-hint-row"><span>${L.totalVAT}</span><span>${escHtmlRaw(formatMoney(quotation.totals.vat, currency))}</span></div>`,
    `<div class="totals-hint-row"><span>${L.totalTTC}</span><span>${escHtmlRaw(formatMoney(quotation.totals.ttc, currency))}</span></div>`,
    showWithholding
      ? `<div class="totals-hint-row"><span>${L.totalAIR}</span><span>- ${escHtmlRaw(formatMoney(quotation.totals.air ?? 0, currency))}</span></div>`
      : "",
    showWithholding
      ? `<div class="totals-hint-row"><span>${L.totalIR}</span><span>- ${escHtmlRaw(formatMoney(quotation.totals.ir ?? 0, currency))}</span></div>`
      : "",
    `<div class="totals-hint-row"><span>${L.totalNet}</span><span>${escHtmlRaw(formatMoney(payableTotal(quotation.totals), currency))}</span></div>`,
  ].join("");

  win.document.write(`<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<title>${L.title} — ${escHtmlRaw(quotation.quotationNumber)}</title>
<style>
  @page{margin:0;size:A4}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",Arial,sans-serif;color:#000;background:#fff;font-size:12.5px;line-height:1.5;padding:14mm 16mm}

  /* Header */
  .doc-header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2px solid #000;margin-bottom:0}
  .company-name{font-size:20px;font-weight:800;color:#000;letter-spacing:-.02em}
  .company-sub{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
  .rfq-title-block{text-align:right}
  .rfq-main-title{font-size:24px;font-weight:900;color:#000;letter-spacing:-.01em;line-height:1}
  .rfq-sub-title{font-size:9px;color:#777;letter-spacing:.12em;text-transform:uppercase;margin-top:3px}

  /* Metadata grid */
  .meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #ccc;border-top:1px solid #ccc;background:#f5f5f5;margin-top:0}
  .meta-cell{padding:9px 14px;border-right:1px solid #ccc}
  .meta-cell:last-child{border-right:none}
  .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#555;font-weight:600;margin-bottom:2px}
  .meta-value{font-size:12.5px;font-weight:700;color:#000}

  /* Sections */
  .body-wrap{padding:16px 0 0}
  .section{margin-bottom:18px}
  .section-title{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#000;font-weight:700;margin-bottom:7px;display:flex;align-items:center;gap:6px}
  .section-title::after{content:"";flex:1;height:1px;background:#ccc}

  /* Supplier box */
  .supplier-box{background:#f5f5f5;border:1px solid #ccc;border-left:3px solid #000;padding:10px 14px}
  .supplier-name{font-size:14px;font-weight:700;color:#000}
  .supplier-detail{font-size:11px;color:#444;margin-top:3px}

  /* Table */
  table{width:100%;border-collapse:collapse;border:1px solid #bbb}
  thead tr{background:#222;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  th{padding:8px 10px;text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;white-space:nowrap}
  th.center,td.center{text-align:center}
  td.right{text-align:right}
  td{padding:8px 10px;font-size:12px;color:#000;border-bottom:1px solid #ddd;vertical-align:middle}
  .row-even{background:#fff}
  .row-odd{background:#f5f5f5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  tr:last-child td{border-bottom:none}
  .mono{font-family:"Courier New",monospace;font-size:11.5px;color:#000;font-weight:600}
  .tbd{color:#aaa;font-style:italic;font-size:11px}
  .bold{font-weight:700}

  /* Totals hint */
  .totals-hint{background:#f5f5f5;border:1px dashed #999;padding:10px 14px;margin-top:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .totals-hint-title{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#555;font-weight:600;margin-bottom:7px}
  .totals-hint-row{display:flex;justify-content:space-between;font-size:11px;color:#444;padding:3px 0;border-bottom:1px dashed #ccc}
  .totals-hint-row:last-child{border-bottom:none;font-weight:700;color:#000}
  .totals-hint-line{color:#bbb;font-style:italic}

  /* Instructions */
  .instructions{background:#f5f5f5;border:1px solid #bbb;padding:9px 13px;font-size:11px;color:#333;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* Signatures */
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px}
  .sig-box{border:1px solid #bbb;padding:12px 14px}
  .sig-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#000;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #ccc}
  .sig-space{height:72px;border-bottom:1px solid #000}

  /* Footer */
  .doc-footer{margin-top:22px;padding-top:8px;border-top:1px solid #ccc;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:#888}
</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="company-name">${escHtmlRaw(tenantName || "YowSpare")}</div>
      <div class="company-sub">${L.companySub}</div>
    </div>
    <div class="rfq-title-block">
      <div class="rfq-main-title">${L.title.toUpperCase()}</div>
      <div class="rfq-sub-title">${L.subtitle}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-cell">
      <div class="meta-label">${L.docRef}</div>
      <div class="meta-value">${escHtmlRaw(quotation.quotationNumber)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">${L.issueDate}</div>
      <div class="meta-value">${escHtmlRaw(formatDate(quotation.issueDate))}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">${L.validUntil}</div>
      <div class="meta-value">${escHtmlRaw(formatDate(quotation.validUntil))}</div>
    </div>
  </div>
  ${quotation.nosRef || quotation.vosRef ? `
  <div class="meta-grid" style="grid-template-columns:1fr 1fr;border-top:none">
    ${quotation.nosRef ? `<div class="meta-cell"><div class="meta-label">${L.ourRef}</div><div class="meta-value">${escHtmlRaw(quotation.nosRef)}</div></div>` : ""}
    ${quotation.vosRef ? `<div class="meta-cell"><div class="meta-label">${L.yourRef}</div><div class="meta-value">${escHtmlRaw(quotation.vosRef)}</div></div>` : ""}
  </div>` : ""}

  <div class="body-wrap">
    <div class="section">
      <div class="section-title">${L.supplierSection}</div>
      <div class="supplier-box">
        <div class="supplier-name">${escHtmlRaw(quotation.supplierName || "—")}</div>
        ${quotation.supplierAddress ? `<div class="supplier-detail">${escHtmlRaw(quotation.supplierAddress)}</div>` : ""}
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
            <th class="center">${L.colUnit}</th>
            <th class="center">${L.colQty}</th>
            <th class="center">${L.colUnitPrice}</th>
            <th class="center">${L.colSubtotal}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals-hint">
        <div class="totals-hint-title">${L.totalsTitle}</div>
        ${totalsRows}
      </div>
    </div>

    <div class="instructions">${L.instructions}</div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">${L.supplierSig}</div>
        <div class="sig-space"></div>
      </div>
      <div class="sig-box">
        <div class="sig-title">${L.buyerSig}</div>
        <div class="sig-space"></div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>${L.confidential}</span>
    <span>${L.generatedBy} · ${escHtmlRaw(new Date().toLocaleDateString())}</span>
  </div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`);
  win.document.close();
  win.focus();
}

function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function escHtmlRaw(s: string): string { return escHtml(s); }

function downloadRFQCsv(quotation: QuotationRecord, lang: RFQLang = "fr") {
  const L = getRFQLabels(lang);
  const sep = ";";
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows: string[][] = [
    [L.colSku, L.colDesc, L.colQty, L.colUnitPrice, L.colSubtotal],
    ...quotation.lines.map((line) => [
      line.sku || "",
      line.productName || "",
      String(line.qty),
      "",
      "",
    ]),
  ];
  const csv = rows.map((row) => row.map(q).join(sep)).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quotation.quotationNumber}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


function StatusBadge({ status }: { status: QuotationStatus }) {
  const { t } = useT();
  const cls =
    status === "BROUILLON"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
      : status === "ENVOYE"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"
      : status === "ACCEPTE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {t(`app.procurement.quotation.status.${status}`)}
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

export default function QuotationsPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const { query } = usePageSearch();
  const { tenant, user, roles, currency, logout } = useSession();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<"ALL" | QuotationStatus>("ALL");

  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationError, setQuotationError] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [showSupplierResults, setShowSupplierResults] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);
  const [lineProductId, setLineProductId] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [lineUnitPrice, setLineUnitPrice] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRecord | null>(null);

  const [draft, setDraft] = useState(() => {
    const now = new Date();
    return {
      quotationNumber: generateQuotationNumber(),
      supplierId: "",
      supplierName: "",
      supplierAddress: "",
      paymentMethod: "VIREMENT",
      nosRef: "",
      vosRef: "",
      globalDiscountPct: 0,
      installments: 1,
      applyVat: true,
      applyRetenue: true,
      referralPartner: false,
      issueDate: isoDate(now),
      validUntil: isoDate(addDays(now, 14)),
      systemDate: isoDate(now),
      inStockOnly: false,
      lines: [] as QuotationLine[],
    };
  });

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
      setLoadError("");
      try {
        const [productsResult, stockResult, suppliersResult] = await Promise.allSettled([
          ProductCatalogService.getProducts(),
          StockLevelsService.getStockLevels(),
          SuppliersService.list(),
        ]);
        if (!mounted) return;
        setProducts(productsResult.status === "fulfilled" ? productsResult.value || [] : []);
        setLevels(stockResult.status === "fulfilled" ? stockResult.value || [] : []);
        setSuppliers(suppliersResult.status === "fulfilled" ? suppliersResult.value || [] : []);

        const failedSources = [
          productsResult.status === "rejected" ? t("app.procurement.source.products") : "",
          stockResult.status === "rejected" ? t("app.procurement.source.stock") : "",
          suppliersResult.status === "rejected" ? t("app.procurement.source.suppliers") : "",
        ].filter(Boolean);
        if (failedSources.length) {
          setLoadError(`${t("app.procurement.error.load")} ${failedSources.join(" | ")}`);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const apiError = err as { status?: number };
        if (apiError?.status === 401) {
          logout();
          router.replace("/");
          return;
        }
        setLoadError(t("app.procurement.error.load"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [logout, router, t, tenant]);

  useEffect(() => {
    if (!organizationStorageId) {
      setQuotations([]);
      return;
    }
    try {
      const raw = localStorage.getItem(quotationStorageKey);
      const parsed = raw ? (JSON.parse(raw) as QuotationRecord[]) : [];
      setQuotations(Array.isArray(parsed) ? parsed : []);
    } catch {
      setQuotations([]);
    }
  }, [organizationStorageId, quotationStorageKey]);

  useEffect(() => {
    if (!suppliers.length) return;
    setDraft((prev) => {
      if (prev.supplierId) return prev;
      const first = suppliers[0];
      return {
        ...prev,
        supplierId: first.id || "",
        supplierName: first.name || "",
        supplierAddress: first.address || "",
      };
    });
    setSupplierQuery((prev) => {
      if (prev.trim()) return prev;
      const first = suppliers[0];
      return first ? supplierLabel(first) : "";
    });
  }, [suppliers]);

  const qtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const level of levels) {
      if (!level.productId) continue;
      map.set(level.productId, (map.get(level.productId) || 0) + (level.quantity || 0));
    }
    return map;
  }, [levels]);

  const supplierLabel = (supplier: Supplier) => supplier.name || supplier.email || supplier.id || "—";
  const productLabel = (product: Product) =>
    `${product.sku || "—"} • ${product.name || product.description || t("app.procurement.unnamed")}`;

  const filteredSuppliers = useMemo(() => {
    const needle = supplierQuery.trim().toLowerCase();
    const base = suppliers.slice().sort((a, b) => supplierLabel(a).localeCompare(supplierLabel(b)));
    if (!needle) return base.slice(0, 40);
    return base
      .filter((s) =>
        [s.name, s.email, s.phone, s.address, s.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 40);
  }, [supplierQuery, suppliers]);

  const filteredProducts = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    const base = products.slice().sort((a, b) => (a.sku || "").localeCompare(b.sku || ""));
    if (!needle) return base.slice(0, 60);
    return base
      .filter((p) =>
        [p.sku, p.name, p.description, p.categoryName, p.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 60);
  }, [productQuery, products]);

  const draftTotals = useMemo(
    () => computeQuotationTotals(draft.lines, draft.globalDiscountPct, draft.applyVat, draft.applyRetenue ?? true),
    [draft.applyRetenue, draft.applyVat, draft.globalDiscountPct, draft.lines]
  );

  const filteredQuotations = useMemo(() => {
    const needle = `${query} ${quotationSearch}`.trim().toLowerCase();
    return quotations
      .filter((q) => (quotationStatusFilter === "ALL" ? true : q.status === quotationStatusFilter))
      .filter((q) => {
        if (!needle) return true;
        return [q.quotationNumber, q.supplierName, q.status].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [query, quotationSearch, quotationStatusFilter, quotations]);

  const updateDraft = (patch: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const persistQuotations = (next: QuotationRecord[]) => {
    setQuotations(next);
    try {
      localStorage.setItem(quotationStorageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const updateQuotationStatus = (id: string, status: QuotationStatus) => {
    const updatedAt = new Date().toISOString();
    const next = quotations.map((q) => (q.id === id ? { ...q, status, updatedAt } : q));
    persistQuotations(next);
    setSelectedQuotation((prev) => (prev?.id === id ? { ...prev, status, updatedAt } : prev));
  };

  const deleteQuotation = (id: string) => {
    persistQuotations(quotations.filter((q) => q.id !== id));
    setDetailOpen(false);
    setSelectedQuotation(null);
  };

  const openDetail = (q: QuotationRecord) => {
    setSelectedQuotation(q);
    setDetailOpen(true);
  };

  const resetDraft = () => {
    const now = new Date();
    const first = suppliers[0];
    setDraft({
      quotationNumber: generateQuotationNumber(),
      supplierId: first?.id || "",
      supplierName: first?.name || "",
      supplierAddress: first?.address || "",
      paymentMethod: "VIREMENT",
      nosRef: "",
      vosRef: "",
      globalDiscountPct: 0,
      installments: 1,
      applyVat: true,
      applyRetenue: true,
      referralPartner: false,
      issueDate: isoDate(now),
      validUntil: isoDate(addDays(now, 14)),
      systemDate: isoDate(now),
      inStockOnly: false,
      lines: [],
    });
    setLineProductId("");
    setProductQuery("");
    setLineQty(1);
    setLineUnitPrice("");
    setShowSupplierResults(false);
    setShowProductResults(false);
    setSupplierQuery(first ? supplierLabel(first) : "");
    setQuotationError("");
  };

  const openCreateQuotation = () => {
    if (!canProcure) {
      setActionError(t("app.procurement.requisition.forbidden"));
      return;
    }
    resetDraft();
    setQuotationOpen(true);
    setActionError("");
  };

  const onSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    updateDraft({
      supplierId,
      supplierName: supplier?.name || "",
      supplierAddress: supplier?.address || "",
    });
    setSupplierQuery(supplier ? supplierLabel(supplier) : "");
    setShowSupplierResults(false);
  };

  const onProductChange = (productId: string) => {
    setLineProductId(productId);
    const selectedProduct = products.find((p) => p.id === productId);
    const price = selectedProduct?.defaultCostPrice ?? 0;
    setLineUnitPrice(price > 0 ? String(price) : "");
    setProductQuery(selectedProduct ? productLabel(selectedProduct) : "");
    setShowProductResults(false);
  };

  const addLine = () => {
    setQuotationError("");
    const selectedProduct = products.find((p) => p.id === lineProductId);
    if (!selectedProduct?.id) {
      setQuotationError(t("app.procurement.quotation.error.productRequired"));
      return;
    }
    const qty = Math.max(1, Number(lineQty || 1));
    const unitPrice = Math.max(0, Number(lineUnitPrice || 0));
    const stockAvailable = qtyByProduct.get(selectedProduct.id) || 0;
    if (draft.inStockOnly && qty > stockAvailable) {
      setQuotationError(t("app.procurement.quotation.error.stockOnly"));
      return;
    }
    const line: QuotationLine = {
      id: `${selectedProduct.id}-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name || selectedProduct.description || t("app.procurement.unnamed"),
      sku: selectedProduct.sku || "—",
      qty,
      unitPrice,
      stockAvailable,
    };
    updateDraft({ lines: [...draft.lines, line] });
    setLineProductId("");
    setProductQuery("");
    setLineQty(1);
    setLineUnitPrice("");
    setShowProductResults(false);
  };

  const removeLine = (lineId: string) => {
    updateDraft({ lines: draft.lines.filter((line) => line.id !== lineId) });
  };

  const saveQuotation = () => {
    setQuotationError("");
    if (!draft.supplierId) {
      setQuotationError(t("app.procurement.quotation.error.supplierRequired"));
      return;
    }
    if (!draft.lines.length) {
      setQuotationError(t("app.procurement.quotation.error.linesRequired"));
      return;
    }
    const nowIso = new Date().toISOString();
    const record: QuotationRecord = {
      id: `quotation-${Date.now()}`,
      ...draft,
      status: "BROUILLON",
      totals: computeQuotationTotals(draft.lines, draft.globalDiscountPct, draft.applyVat, draft.applyRetenue ?? true),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    persistQuotations([record, ...quotations]);
    setQuotationOpen(false);
  };

  return (
    <main className="ys-page">
      <section className="ys-page-header">
        <h1 className="ys-page-title">{t("app.procurement.quotation.title")}</h1>
        <p className="ys-page-subtitle">{t("app.procurement.quotation.subtitle")}</p>
      </section>

      {loadError ? <div className="ys-alert-error">{loadError}</div> : null}
      {actionError ? <div className="ys-alert-error">{actionError}</div> : null}

      <section className="ys-card p-4">
        <div className="ys-toolbar">
          <div className="ys-toolbar-actions">
            <input
              type="search"
              className="ys-input h-10 w-72"
              placeholder={t("app.procurement.quotation.searchPlaceholder")}
              value={quotationSearch}
              onChange={(e) => setQuotationSearch(e.target.value)}
            />
            <select
              className="ys-input h-10 w-52"
              value={quotationStatusFilter}
              onChange={(e) => setQuotationStatusFilter(e.target.value as "ALL" | QuotationStatus)}
            >
              <option value="ALL">{t("app.procurement.quotation.status.all")}</option>
              <option value="BROUILLON">{t("app.procurement.quotation.status.BROUILLON")}</option>
              <option value="ENVOYE">{t("app.procurement.quotation.status.ENVOYE")}</option>
              <option value="ACCEPTE">{t("app.procurement.quotation.status.ACCEPTE")}</option>
              <option value="REFUSE">{t("app.procurement.quotation.status.REFUSE")}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={openCreateQuotation}
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
            {t("app.procurement.quotation.action.create")}
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("app.common.loading")}</div>
        ) : !filteredQuotations.length ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("app.procurement.quotation.empty")}
          </div>
        ) : (
          <div className="ys-table-wrap mt-4">
            <table className="ys-table min-w-[920px]">
              <thead className="ys-table-head bg-muted/30">
                <tr>
                  <th className="ys-table-cell pl-4">{t("app.procurement.quotation.table.number")}</th>
                  <th className="ys-table-cell">{t("app.procurement.quotation.table.supplier")}</th>
                  <th className="ys-table-cell">{t("app.procurement.quotation.table.date")}</th>
                  <th className="ys-table-cell">{t("app.procurement.quotation.table.status")}</th>
                  <th className="ys-table-cell">{t("app.procurement.quotation.table.total")}</th>
                  <th className="ys-table-cell w-28 text-right pr-4">{t("app.procurement.quotation.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {filteredQuotations.map((quote) => (
                  <tr
                    key={quote.id}
                    className="ys-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => openDetail(quote)}
                  >
                    <td className="ys-table-cell pl-4 font-mono text-xs">{quote.quotationNumber}</td>
                    <td className="ys-table-cell">
                      <div className="font-medium">{quote.supplierName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{quote.supplierAddress || "—"}</div>
                    </td>
                    <td className="ys-table-cell text-muted-foreground">{formatDate(quote.createdAt)}</td>
                    <td className="ys-table-cell">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="ys-table-cell font-semibold">{formatMoney(payableTotal(quote.totals), currency)}</td>
                    <td className="ys-table-cell text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title={t("app.procurement.quotation.action.printRfq")}
                        onClick={() => printRFQ(quote, lang as RFQLang, tenant?.name || "", currency)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <path d="M6 9V4h12v5" strokeLinecap="round" strokeLinejoin="round" />
                          <rect x="4" y="9" width="16" height="9" rx="1.5" />
                          <path d="M8 18v-4h8v4" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="17" cy="13" r="0.8" fill="currentColor" stroke="none" />
                        </svg>
                        RFQ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      {selectedQuotation && (
        <Modal
          open={detailOpen}
          title={selectedQuotation.quotationNumber}
          onClose={() => setDetailOpen(false)}
          wide
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">
                  {t("app.procurement.quotation.detail.supplier")}
                </div>
                <div className="font-medium text-sm">{selectedQuotation.supplierName || "—"}</div>
                {selectedQuotation.supplierAddress && (
                  <div className="text-xs text-muted-foreground">{selectedQuotation.supplierAddress}</div>
                )}
              </div>
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">
                  {t("app.procurement.quotation.detail.dates")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("app.procurement.quotation.detail.issued")} <span className="text-foreground font-medium">{formatDate(selectedQuotation.issueDate)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("app.procurement.quotation.detail.validUntil")} <span className="text-foreground font-medium">{formatDate(selectedQuotation.validUntil)}</span>
                </div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[10px] uppercase tracking-[.08em] text-muted-foreground mb-1">
                  {t("app.procurement.quotation.detail.status")}
                </div>
                <div className="mb-2">
                  <StatusBadge status={selectedQuotation.status} />
                </div>
                {/* Status transitions */}
                <div className="flex flex-wrap gap-2">
                  {selectedQuotation.status === "BROUILLON" && (
                    <button
                      type="button"
                      onClick={() => updateQuotationStatus(selectedQuotation.id, "ENVOYE")}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      {t("app.procurement.quotation.action.markSent")}
                    </button>
                  )}
                  {selectedQuotation.status === "ENVOYE" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateQuotationStatus(selectedQuotation.id, "ACCEPTE")}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        {t("app.procurement.quotation.action.accept")}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuotationStatus(selectedQuotation.id, "REFUSE")}
                        className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 transition-colors"
                      >
                        {t("app.procurement.quotation.action.reject")}
                      </button>
                    </>
                  )}
                  {(selectedQuotation.status === "ACCEPTE" || selectedQuotation.status === "REFUSE") && (
                    <span className="text-xs text-muted-foreground italic">{t("app.procurement.quotation.detail.finalStatus")}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lines */}
            <div className="ys-card p-4">
              <div className="ys-section-title mb-3">{t("app.procurement.quotation.detail.lines")}</div>
              <div className="ys-table-wrap">
                <table className="ys-table min-w-[700px]">
                  <thead className="ys-table-head bg-muted/30">
                    <tr>
                      <th className="ys-table-cell pl-4">{t("app.procurement.quotation.detail.number")}</th>
                      <th className="ys-table-cell">{t("app.procurement.quotation.detail.sku")}</th>
                      <th className="ys-table-cell">{t("app.procurement.quotation.detail.designation")}</th>
                      <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.qty")}</th>
                      <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.unitPrice")}</th>
                      <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.subtotal")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card text-foreground">
                    {selectedQuotation.lines.map((line, i) => (
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

            {/* Totals */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
                  {t("app.procurement.quotation.total.ht")}
                </div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedQuotation.totals.ht, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
                  {t("app.procurement.quotation.total.vat")}
                </div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedQuotation.totals.vat, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
                  {t("app.procurement.quotation.total.ttc")}
                </div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedQuotation.totals.ttc, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
                  {t("app.procurement.quotation.total.discount")}
                </div>
                <div className="mt-1 text-base font-semibold">{formatMoney(selectedQuotation.totals.discount, currency)}</div>
              </div>
              {selectedQuotation.applyRetenue && (
                <>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[.08em] text-amber-700 dark:text-amber-400">
                      {t("app.procurement.quotation.total.air")}
                    </div>
                    <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">
                      - {formatMoney(selectedQuotation.totals.air ?? 0, currency)}
                    </div>
                  </div>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[.08em] text-amber-700 dark:text-amber-400">
                      {t("app.procurement.quotation.total.ir")}
                    </div>
                    <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">
                      - {formatMoney(selectedQuotation.totals.ir ?? 0, currency)}
                    </div>
                  </div>
                </>
              )}
              <div className="ys-card border-primary/20 bg-primary/5 p-3">
                <div className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
                  {t("app.procurement.quotation.total.final")}
                </div>
                <div className="mt-1 text-base font-semibold text-primary">{formatMoney(payableTotal(selectedQuotation.totals), currency)}</div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => deleteQuotation(selectedQuotation.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 7h16" strokeLinecap="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                  <path d="M6 7l1-2h10l1 2" strokeLinecap="round" />
                </svg>
                {t("app.procurement.quotation.action.delete")}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="ys-btn-secondary text-xs"
                  onClick={() => setDetailOpen(false)}
                >
                  {t("app.procurement.quotation.action.close")}
                </button>
                <ExportMenu
                  label={t("app.common.export")}
                  csvLabel={t("app.common.export.csv")}
                  pdfLabel={t("app.common.export.pdf")}
                  onCsv={() => downloadRFQCsv(selectedQuotation, lang as RFQLang)}
                  onPdf={() => printRFQ(selectedQuotation, lang as RFQLang, tenant?.name || "", currency)}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <Modal
        open={quotationOpen}
        title={t("app.procurement.quotation.modal.title")}
        onClose={() => setQuotationOpen(false)}
      >
        <div className="space-y-4">
          <div className="ys-card p-4 relative z-10">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="ys-filter-label">
                {t("app.procurement.quotation.form.supplier")}
                <div className="relative">
                  <input
                    className="ys-filter-control"
                    value={supplierQuery}
                    onFocus={() => setShowSupplierResults(true)}
                    onBlur={() => window.setTimeout(() => setShowSupplierResults(false), 120)}
                    onChange={(e) => {
                      setSupplierQuery(e.target.value);
                      setShowSupplierResults(true);
                      updateDraft({
                        supplierId: "",
                        supplierName: "",
                        supplierAddress: "",
                      });
                    }}
                    placeholder={t("app.procurement.quotation.form.supplierSearchPlaceholder")}
                  />
                  {showSupplierResults && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
                      {filteredSuppliers.length ? (
                        filteredSuppliers.map((supplier) => (
                          <button
                            key={supplier.id}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onSupplierChange(supplier.id || "");
                            }}
                            className="flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                          >
                            <span className="font-medium text-foreground">{supplierLabel(supplier)}</span>
                            <span className="text-xs text-muted-foreground">{supplier.email || supplier.phone || "—"}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t("app.procurement.quotation.form.supplierNoResult")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>
              <label className="ys-filter-label">
                {t("app.procurement.quotation.form.address")}
                <input
                  className="ys-filter-control"
                  value={draft.supplierAddress}
                  onChange={(e) => updateDraft({ supplierAddress: e.target.value })}
                />
              </label>
              <label className="ys-filter-label">
                {t("app.procurement.quotation.form.number")}
                <input className="ys-filter-control" value={draft.quotationNumber} readOnly />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.applyVat}
                  onChange={(e) => updateDraft({ applyVat: e.target.checked })}
                />
                <span>{t("app.procurement.quotation.form.applyVat")}</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.applyRetenue ?? true}
                  onChange={(e) => updateDraft({ applyRetenue: e.target.checked })}
                />
                <span>{t("app.procurement.quotation.form.applyRetenue")}</span>
              </label>
            </div>
          </div>

          <div className="ys-card p-4">
            <div className="ys-section-title">{t("app.procurement.quotation.lines.title")}</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[2fr_120px_170px_170px_90px]">
              <label className="ys-filter-label">
                {t("app.procurement.quotation.lines.product")}
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
                    placeholder={t("app.procurement.quotation.lines.productSearchPlaceholder")}
                  />
                  {showProductResults && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
                      {filteredProducts.length ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onProductChange(product.id || "");
                            }}
                            className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
                                <ProductImage
                                  product={product}
                                  alt={product.name || product.sku || t("app.catalog.image.alt")}
                                  className="h-full w-full object-cover"
                                  fallback={<ProductImageFallback />}
                                />
                              </span>
                              <span className="truncate font-medium text-foreground">{productLabel(product)}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatMoney(product.defaultCostPrice || 0, currency)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t("app.procurement.quotation.lines.productNoResult")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>
              <label className="ys-filter-label">
                {t("app.procurement.quotation.lines.qty")}
                <input
                  className="ys-filter-control"
                  type="number"
                  min={1}
                  value={lineQty}
                  onChange={(e) => setLineQty(Math.max(1, Number(e.target.value || 1)))}
                />
              </label>
              <label className="ys-filter-label">
                {t("app.procurement.quotation.lines.unitPrice")}
                <input
                  className="ys-filter-control"
                  type="number"
                  min={0}
                  value={lineUnitPrice}
                  onChange={(e) => setLineUnitPrice(e.target.value)}
                />
              </label>
              <label className="ys-filter-label">
                {t("app.procurement.quotation.lines.stock")}
                <input
                  className="ys-filter-control"
                  readOnly
                  value={lineProductId ? String(qtyByProduct.get(lineProductId) || 0) : "—"}
                />
              </label>
              <div className="flex items-end">
                <button type="button" className="ys-btn-primary h-10 w-full px-0" onClick={addLine}>
                  +
                </button>
              </div>
            </div>

            {quotationError ? <div className="ys-alert-error mt-3">{quotationError}</div> : null}

            <div className="ys-table-wrap mt-4">
              <table className="ys-table min-w-[820px]">
                <thead className="ys-table-head bg-muted/30">
                  <tr>
                    <th className="ys-table-cell pl-4">{t("app.procurement.quotation.lines.table.product")}</th>
                    <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.qty")}</th>
                    <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.unitPrice")}</th>
                    <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.subtotal")}</th>
                    <th className="ys-table-cell">{t("app.procurement.quotation.lines.table.actions")}</th>
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
                          aria-label={t("app.procurement.quotation.lines.remove")}
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
              <div className="mt-3 text-sm text-muted-foreground">{t("app.procurement.quotation.lines.empty")}</div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-7">
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.ht")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.ht, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.vat")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.vat, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.ttc")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.ttc, currency)}</div>
              </div>
              <div className="ys-card p-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.discount")}</div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(draftTotals.discount, currency)}</div>
              </div>
              {(draft.applyRetenue ?? true) && (
                <>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">{t("app.procurement.quotation.total.air")}</div>
                    <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">- {formatMoney(draftTotals.air ?? 0, currency)}</div>
                  </div>
                  <div className="ys-card border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">{t("app.procurement.quotation.total.ir")}</div>
                    <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">- {formatMoney(draftTotals.ir ?? 0, currency)}</div>
                  </div>
                </>
              )}
              <div className="ys-card border-primary/20 bg-primary/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("app.procurement.quotation.total.final")}</div>
                <div className="mt-1 text-lg font-semibold text-primary">{formatMoney(payableTotal(draftTotals), currency)}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="ys-btn-secondary text-xs" onClick={() => setQuotationOpen(false)}>
                {t("app.procurement.quotation.action.discard")}
              </button>
              <button type="button" className="ys-btn-primary text-xs" onClick={saveQuotation}>
                {t("app.procurement.quotation.action.save")}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
