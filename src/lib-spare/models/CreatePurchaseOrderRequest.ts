/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePurchaseOrderLineRequest } from './CreatePurchaseOrderLineRequest';
export type CreatePurchaseOrderRequest = {
    supplierId?: string;
    supplierName: string;
    supplierAddress?: string;
    notes?: string;
    lines: Array<CreatePurchaseOrderLineRequest>;
};
