/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReceiptLineDto } from './ReceiptLineDto';
export type ReceiptDto = {
    id?: string;
    receiptNumber?: string;
    poId?: string;
    poNumber?: string;
    agencyId?: string;
    supplierId?: string;
    supplierName?: string;
    supplierAddress?: string;
    status?: string;
    stockPosted?: boolean;
    receivedAt?: string;
    note?: string;
    lines?: Array<ReceiptLineDto>;
    createdAt?: string;
    updatedAt?: string;
};
