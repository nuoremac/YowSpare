/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineBonReception } from './LineBonReception';
export type BondeReceptionCreateRequest = {
    grnNumber?: string;
    supplierId?: string;
    supplierName?: string;
    transporterCompanyName?: string;
    vehicleNumber?: string;
    purchaseOrderId?: string;
    purchaseOrderNumber?: string;
    receiptDate?: string;
    documentDate?: string;
    systemDate?: string;
    status?: BondeReceptionCreateRequest.status;
    lines?: Array<LineBonReception>;
    preparedBy?: string;
    inspectedBy?: string;
    approvedBy?: string;
    remarks?: string;
};
export namespace BondeReceptionCreateRequest {
    export enum status {
        DRAFT = 'DRAFT',
        PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
        RECEIVED = 'RECEIVED',
        REJECTED = 'REJECTED',
        ANNULE = 'ANNULE',
    }
}

