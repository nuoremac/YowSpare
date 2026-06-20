import { BonDAchatService } from "@/yowyob-billing/services/BonDAchatService";
import { BondeReceptionControllerService } from "@/yowyob-billing/services/BondeReceptionControllerService";
import { BonAchatRequest } from "@/yowyob-billing/models/BonAchatRequest";
import type { BonAchatResponse } from "@/yowyob-billing/models/BonAchatResponse";
import { BondeReceptionCreateRequest } from "@/yowyob-billing/models/BondeReceptionCreateRequest";
import type { BondeReceptionResponse } from "@/yowyob-billing/models/BondeReceptionResponse";
import type { LigneBonAchatRequest } from "@/yowyob-billing/models/LigneBonAchatRequest";
import type { LineBonReception } from "@/yowyob-billing/models/LineBonReception";
import type { PurchaseOrder, PurchaseOrderLine } from "@/lib/workflowStore";

type CreatePurchaseOrderInput = {
  supplierId: string;
  supplierLabel: string;
  agencyId?: string;
  expectedAt?: string;
  note?: string;
  lines: PurchaseOrderLine[];
};

type CreateReceiptInput = {
  po: PurchaseOrder;
  line: PurchaseOrderLine;
  quantity: number;
};

const safeIso = (value?: string | null): string => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const generatePoNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 9000 + 1000);
  return `PO-${y}${m}${d}-${r}`;
};

const generateReceiptNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 9000 + 1000);
  return `GRN-${y}${m}${d}-${r}`;
};

const toLocalStatus = (
  status?: BonAchatResponse.status | BonAchatRequest.status | string
): PurchaseOrder["status"] => {
  switch (status) {
    case "BROUILLON":
      return "DRAFT";
    case "RECU_PARTIEL":
      return "PARTIAL";
    case "RECU":
      return "RECEIVED";
    case "REJETE":
    case "ANNULE":
      return "CLOSED";
    default:
      return "DRAFT";
  }
};

const toApiLineRequest = (line: PurchaseOrderLine): LigneBonAchatRequest => ({
  productId: line.productId,
  productName: line.productLabel,
  orderedQuantity: line.quantity,
  unitPrice: line.unitPrice,
  totalAmount: line.quantity * line.unitPrice,
  taxable: true,
});

const toApiPurchaseOrderRequest = (
  input: CreatePurchaseOrderInput,
  status: BonAchatRequest.status = BonAchatRequest.status.BROUILLON
): BonAchatRequest => ({
  numeroBonAchat: generatePoNumber(),
  supplierId: input.supplierId,
  supplierName: input.supplierLabel,
  status,
  dateBonAchat: new Date().toISOString(),
  dateSysteme: new Date().toISOString(),
  dateLivraisonPrevue: input.expectedAt || undefined,
  deliveryAddress: input.agencyId || undefined,
  remarks: input.note || undefined,
  lines: (input.lines || []).map(toApiLineRequest),
});

const toUpdateRequestFromResponse = (
  response: BonAchatResponse,
  status: BonAchatRequest.status
): BonAchatRequest => ({
  numeroBonAchat: response.numeroBonAchat || generatePoNumber(),
  supplierId: response.supplierId || "",
  supplierName: response.supplierName || undefined,
  supplierCode: response.supplierCode || undefined,
  supplierEmail: response.supplierEmail || undefined,
  supplierContact: response.supplierContact || undefined,
  supplierAddress: response.supplierAddress || undefined,
  deliveryName: response.deliveryName || undefined,
  deliveryAddress: response.deliveryAddress || undefined,
  deliveryEmail: response.deliveryEmail || undefined,
  deliveryContact: response.deliveryContact || undefined,
  dateBonAchat: response.dateBonAchat || undefined,
  dateSysteme: response.dateSysteme || undefined,
  dateLivraisonPrevue: response.dateLivraisonPrevue || undefined,
  transportMethod: response.transportMethod || undefined,
  instructionsLivraison: response.instructionsLivraison || undefined,
  status,
  subtotalAmount: response.subtotalAmount,
  taxAmount: response.taxAmount,
  grandTotal: response.grandTotal,
  preparedBy: response.preparedBy || undefined,
  approvedBy: response.approvedBy || undefined,
  remarks: response.remarks || undefined,
  lines: (response.lines || []).map((line) => ({
    productId: line.productId,
    productCode: line.productCode,
    productName: line.productName,
    uom: line.uom,
    orderedQuantity: line.orderedQuantity,
    unitPrice: line.unitPrice,
    taxable: line.taxable,
    vatAmount: line.vatAmount,
    totalAmount: line.totalAmount,
  })),
});

const toLocalLine = (line: NonNullable<BonAchatResponse["lines"]>[number], index: number): PurchaseOrderLine => {
  const quantity = Math.max(0, Number(line.orderedQuantity || 0));
  const unitPrice = Math.max(0, Number(line.unitPrice || 0));
  return {
    id: `${line.productId || line.productCode || "line"}-${index}`,
    productId: line.productId || "",
    productLabel: line.productName || line.productCode || line.productId || "—",
    quantity,
    unitPrice,
    receivedQty: 0,
  };
};

const toLocalPurchaseOrder = (response: BonAchatResponse): PurchaseOrder => {
  const id = response.idBonAchat || response.numeroBonAchat || generatePoNumber();
  return {
    id,
    supplierId: response.supplierId || "",
    supplierLabel: response.supplierName || response.supplierCode || response.supplierId || "—",
    agencyId: response.deliveryAddress || undefined,
    expectedAt: response.dateLivraisonPrevue || undefined,
    note: response.remarks || undefined,
    status: toLocalStatus(response.status),
    createdAt: safeIso(response.createdAt || response.dateBonAchat),
    updatedAt: safeIso(response.updatedAt || response.dateSysteme || response.dateBonAchat),
    lines: (response.lines || []).map(toLocalLine),
    events: [],
  };
};

export const listPurchaseOrdersFromBilling = async (): Promise<PurchaseOrder[]> => {
  const rows = await BonDAchatService.getAllBonsAchat();
  return (rows || []).map(toLocalPurchaseOrder);
};

export const createPurchaseOrderInBilling = async (input: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
  const created = await BonDAchatService.createBonAchat(toApiPurchaseOrderRequest(input));
  const local = toLocalPurchaseOrder(created);
  return {
    ...local,
    supplierId: local.supplierId || input.supplierId,
    supplierLabel: local.supplierLabel || input.supplierLabel,
    agencyId: local.agencyId || input.agencyId,
    expectedAt: local.expectedAt || input.expectedAt,
    note: local.note || input.note,
    lines: local.lines.length ? local.lines : input.lines,
  };
};

export const updatePurchaseOrderStatusInBilling = async (
  id: string,
  status: BonAchatRequest.status
): Promise<PurchaseOrder> => {
  const current = await BonDAchatService.getBonAchatById(id);
  const payload = toUpdateRequestFromResponse(current, status);
  const updated = await BonDAchatService.updateBonAchatById(id, payload);
  return toLocalPurchaseOrder(updated);
};

export const listReceiptsFromBilling = async (): Promise<BondeReceptionResponse[]> =>
  BondeReceptionControllerService.getBons();

export const createReceiptInBilling = async ({
  po,
  line,
  quantity,
}: CreateReceiptInput): Promise<BondeReceptionResponse> => {
  const now = new Date().toISOString();
  const cleanQty = Math.max(0, Number(quantity || 0));
  const receiptLine: LineBonReception = {
    productId: line.productId,
    description: line.productLabel,
    orderedQuantity: line.quantity,
    receivedQuantity: cleanQty,
    acceptedQuantity: cleanQty,
    rejectedQuantity: 0,
    shortQuantity: Math.max(0, line.quantity - cleanQty),
    damagedQuantity: 0,
    excessQuantity: Math.max(0, cleanQty - line.quantity),
    rate: line.unitPrice,
    lineAmount: cleanQty * line.unitPrice,
  };

  const request: BondeReceptionCreateRequest = {
    grnNumber: generateReceiptNumber(),
    supplierId: po.supplierId,
    supplierName: po.supplierLabel,
    purchaseOrderId: po.id,
    purchaseOrderNumber: po.id,
    receiptDate: now,
    documentDate: now,
    systemDate: now,
    status: BondeReceptionCreateRequest.status.PARTIALLY_RECEIVED,
    lines: [receiptLine],
    remarks: `Receipt for ${line.productLabel}`,
  };

  return BondeReceptionControllerService.createBon(request);
};

export const getReceivedByProductForPo = (
  receipts: BondeReceptionResponse[],
  purchaseOrderId: string
): Map<string, number> => {
  const map = new Map<string, number>();
  (receipts || [])
    .filter((receipt) => receipt.purchaseOrderId === purchaseOrderId)
    .forEach((receipt) => {
      (receipt.lines || []).forEach((line) => {
        const productId = (line.productId || "").trim();
        if (!productId) return;
        const qty = Math.max(0, Number(line.acceptedQuantity ?? line.receivedQuantity ?? 0));
        map.set(productId, (map.get(productId) || 0) + qty);
      });
    });
  return map;
};
