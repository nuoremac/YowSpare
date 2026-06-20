/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PurchaseOrderLineDto } from './PurchaseOrderLineDto';
export type PurchaseOrderDto = {
    id?: string;
    poNumber?: string;
    supplierId?: string;
    supplierName?: string;
    supplierAddress?: string;
    status?: string;
    notes?: string;
    lines?: Array<PurchaseOrderLineDto>;
    /** Total hors taxes */
    totalHt?: number;
    /** TVA 19.25 % */
    totalTva?: number;
    /** Total TTC */
    totalTtc?: number;
    /** Retenue AIR 5.5 % */
    retenueAir?: number;
    /** Retenue IR 1.5 % */
    retenueIr?: number;
    /** Net à payer au fournisseur */
    netAPayer?: number;
    createdAt?: string;
    updatedAt?: string;
};
