import { AnalyticsControllerService } from "@/lib-spare/services/AnalyticsControllerService";
import { InvitationControllerService } from "@/lib-spare/services/InvitationControllerService";
import { MaterialOperationsControllerService } from "@/lib-spare/services/MaterialOperationsControllerService";
import { PurchaseOrderControllerService } from "@/lib-spare/services/PurchaseOrderControllerService";
import { ReceiptControllerService } from "@/lib-spare/services/ReceiptControllerService";
import { WarehouseControllerService } from "@/lib-spare/services/WarehouseControllerService";
import type { PurchaseOrderDto } from "@/lib-spare/models/PurchaseOrderDto";
import type { PurchaseOrderLineDto } from "@/lib-spare/models/PurchaseOrderLineDto";
import type { CreatePurchaseOrderRequest } from "@/lib-spare/models/CreatePurchaseOrderRequest";
import type { CreateReceiptRequest } from "@/lib-spare/models/CreateReceiptRequest";
import type { ReceiptDto } from "@/lib-spare/models/ReceiptDto";
import type { ReceiptLineDto } from "@/lib-spare/models/ReceiptLineDto";
import type { SendInvitationRequest } from "@/lib-spare/models/SendInvitationRequest";
import type { AnalyticsRecommendationDto } from "@/lib-spare/models/AnalyticsRecommendationDto";
import type { DepartmentDto } from "@/lib-spare/models/DepartmentDto";
import type { DepartmentMemberDto } from "@/lib-spare/models/DepartmentMemberDto";
import type { ProductLocationDto } from "@/lib-spare/models/ProductLocationDto";
import type { UpdateDepartmentRequest } from "@/lib-spare/models/UpdateDepartmentRequest";
import type { UpsertProductLocationRequest } from "@/lib-spare/models/UpsertProductLocationRequest";
import type { WarehouseLayoutDto } from "@/lib-spare/models/WarehouseLayoutDto";

export type ProductLocation = ProductLocationDto;
export type WarehouseLayout = WarehouseLayoutDto;
export type AnalyticsRecommendation = AnalyticsRecommendationDto;
export type Department = {
  id: string;
  agencyId: string;
  code: string;
  name: string;
  active: boolean;
  updatedAt?: string;
};

export type DepartmentMember = {
  id: string;
  departmentId: string;
  userId: string;
  updatedAt?: string;
};

const toDepartment = (dto: DepartmentDto): Department => ({
  id: dto.id || "",
  agencyId: dto.agencyId || "",
  code: dto.code || "",
  name: dto.name || "",
  active: dto.active !== false,
  updatedAt: dto.updatedAt || undefined,
});

const toDepartmentMember = (dto: DepartmentMemberDto): DepartmentMember => ({
  id: dto.id || `${dto.departmentId || ""}:${dto.userId || ""}`,
  departmentId: dto.departmentId || "",
  userId: dto.userId || "",
  updatedAt: dto.updatedAt || undefined,
});

export class WarehousesService {
  static listProductLocations(agencyId: string) {
    return WarehouseControllerService.listLocations(agencyId);
  }

  static listLocationsForProduct(productId: string) {
    return WarehouseControllerService.listLocationsForProduct(productId);
  }

  static upsertProductLocation(agencyId: string, productId: string, payload: UpsertProductLocationRequest) {
    return WarehouseControllerService.upsertLocation(agencyId, productId, payload);
  }

  static getLayout(agencyId: string) {
    return WarehouseControllerService.getLayout(agencyId);
  }

  static putLayout(agencyId: string, payload: WarehouseLayoutDto) {
    return WarehouseControllerService.putLayout(agencyId, payload);
  }
}

export class AnalyticsService {
  static listReorderRecommendations(agencyId: string) {
    return AnalyticsControllerService.list3(agencyId);
  }

  static recomputeReorderRecommendations(agencyId: string, days = 30) {
    return AnalyticsControllerService.recompute(agencyId, days);
  }
}

export class DepartmentsService {
  static list(agencyId?: string) {
    return MaterialOperationsControllerService.listDepartments(agencyId, undefined).then((rows) =>
      (rows || []).map(toDepartment).filter((row) => !!row.id)
    );
  }

  static create(payload: { agencyId: string; code: string; name: string; active?: boolean }) {
    return MaterialOperationsControllerService.createDepartment(payload).then(toDepartment);
  }

  static update(id: string, payload: UpdateDepartmentRequest) {
    return MaterialOperationsControllerService.updateDepartment(id, payload).then(toDepartment);
  }

  static delete(id: string) {
    return MaterialOperationsControllerService.deleteDepartment(id);
  }

  static listMembers(id: string) {
    return MaterialOperationsControllerService.listDepartmentMembers(id).then((rows) =>
      (rows || []).map(toDepartmentMember).filter((row) => !!row.userId)
    );
  }

  static assignMember(id: string, userId: string) {
    return MaterialOperationsControllerService.addDepartmentMember(id, { userId }).then(toDepartmentMember);
  }

  static removeMember(id: string, userId: string) {
    return MaterialOperationsControllerService.removeDepartmentMember(id, userId);
  }
}

export class InvitationsService {
  static send(payload: SendInvitationRequest) {
    return InvitationControllerService.sendInvitation(payload);
  }

  static validate(token: string) {
    return InvitationControllerService.validateToken(token);
  }

  static list() {
    return InvitationControllerService.listInvitations();
  }

  static cancel(id: string) {
    return InvitationControllerService.cancelInvitation(id);
  }
}

export type PurchaseOrderLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice?: number | null;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierAddress?: string | null;
  status: string;
  notes?: string | null;
  lines: PurchaseOrderLine[];
  totalHt?: number | null;
  totalTva?: number | null;
  totalTtc?: number | null;
  retenueAir?: number | null;
  retenueIr?: number | null;
  netAPayer?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePurchaseOrderLineInput = {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice?: number | null;
};

export type CreatePurchaseOrderInput = {
  supplierId?: string | null;
  supplierName: string;
  supplierAddress?: string | null;
  notes?: string | null;
  lines: CreatePurchaseOrderLineInput[];
};

function toPurchaseOrder(dto: PurchaseOrderDto): PurchaseOrder {
  return {
    id: dto.id || "",
    poNumber: dto.poNumber || "",
    supplierId: dto.supplierId || null,
    supplierName: dto.supplierName || "",
    supplierAddress: dto.supplierAddress || null,
    status: dto.status || "DRAFT",
    notes: dto.notes || null,
    lines: (dto.lines || []).map((l: PurchaseOrderLineDto) => ({
      id: l.id || "",
      productId: l.productId || "",
      productName: l.productName || "",
      sku: l.sku || "",
      qty: l.qty || 0,
      unitPrice: l.unitPrice ?? null,
    })),
    totalHt:    dto.totalHt    ?? null,
    totalTva:   dto.totalTva   ?? null,
    totalTtc:   dto.totalTtc   ?? null,
    retenueAir: dto.retenueAir ?? null,
    retenueIr:  dto.retenueIr  ?? null,
    netAPayer:  dto.netAPayer  ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export class PurchaseOrdersService {
  static list(params?: { q?: string; status?: string }): Promise<PurchaseOrder[]> {
    return PurchaseOrderControllerService.list(params?.q, params?.status)
      .then((rows) => (rows || []).map(toPurchaseOrder));
  }

  static get(id: string): Promise<PurchaseOrder> {
    return PurchaseOrderControllerService.get(id).then(toPurchaseOrder);
  }

  static create(body: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const request: CreatePurchaseOrderRequest = {
      supplierName: body.supplierName,
      lines: body.lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        sku: line.sku,
        qty: line.qty,
        unitPrice: line.unitPrice ?? undefined,
      })),
      supplierId: body.supplierId || undefined,
      supplierAddress: body.supplierAddress || undefined,
      notes: body.notes || undefined,
    };
    return PurchaseOrderControllerService.create(request).then(toPurchaseOrder);
  }

  static updateStatus(id: string, status: string): Promise<PurchaseOrder> {
    return PurchaseOrderControllerService.updateStatus(id, { status }).then(toPurchaseOrder);
  }

  static delete(id: string): Promise<void> {
    return PurchaseOrderControllerService.delete(id) as Promise<void>;
  }
}

export type ReceiptLine = {
  id: string;
  poLineId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  note?: string | null;
};

export type Receipt = {
  id: string;
  receiptNumber: string;
  poId: string;
  poNumber: string;
  agencyId: string;
  supplierId?: string | null;
  supplierName: string;
  supplierAddress?: string | null;
  status: string;
  stockPosted: boolean;
  receivedAt?: string | null;
  note?: string | null;
  lines: ReceiptLine[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateReceiptLineInput = {
  poLineId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  note?: string | null;
};

export type CreateReceiptInput = {
  poId: string;
  agencyId: string;
  note?: string | null;
  lines: CreateReceiptLineInput[];
};

function toReceipt(dto: ReceiptDto): Receipt {
  return {
    id: dto.id || "",
    receiptNumber: dto.receiptNumber || "",
    poId: dto.poId || "",
    poNumber: dto.poNumber || "",
    agencyId: dto.agencyId || "",
    supplierId: dto.supplierId || null,
    supplierName: dto.supplierName || "",
    supplierAddress: dto.supplierAddress || null,
    status: dto.status || "PARTIAL",
    stockPosted: dto.stockPosted === true,
    receivedAt: dto.receivedAt || null,
    note: dto.note || null,
    lines: (dto.lines || []).map((l: ReceiptLineDto) => ({
      id: l.id || "",
      poLineId: l.poLineId || "",
      productId: l.productId || "",
      productName: l.productName || "",
      sku: l.sku || "",
      orderedQty: l.orderedQty || 0,
      receivedQty: l.receivedQty || 0,
      note: l.note || null,
    })),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export class ReceiptsService {
  static list(params?: { poId?: string; stockPosted?: boolean }): Promise<Receipt[]> {
    return ReceiptControllerService.list(params?.poId, params?.stockPosted)
      .then((rows) => (rows || []).map(toReceipt));
  }

  static get(id: string): Promise<Receipt> {
    return ReceiptControllerService.get(id).then(toReceipt);
  }

  static create(body: CreateReceiptInput): Promise<Receipt> {
    const request: CreateReceiptRequest = {
      poId: body.poId,
      agencyId: body.agencyId,
      note: body.note || undefined,
      lines: body.lines.map((line) => ({
        poLineId: line.poLineId,
        productId: line.productId,
        productName: line.productName,
        sku: line.sku,
        orderedQty: line.orderedQty,
        receivedQty: line.receivedQty,
        note: line.note || undefined,
      })),
    };
    return ReceiptControllerService.create(request).then(toReceipt);
  }

  static postToStock(id: string): Promise<Receipt> {
    return ReceiptControllerService.postToStock(id).then(toReceipt);
  }
}
