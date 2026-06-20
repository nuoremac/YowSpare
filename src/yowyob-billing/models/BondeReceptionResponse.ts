/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineBonReception } from './LineBonReception';
export type BondeReceptionResponse = {
    idGRN?: string;
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
    status?: BondeReceptionResponse.status;
    lines?: Array<LineBonReception>;
    preparedBy?: string;
    inspectedBy?: string;
    approvedBy?: string;
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
};
export namespace BondeReceptionResponse {
    export enum status {
        DRAFT = 'DRAFT',
        PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
        RECEIVED = 'RECEIVED',
        REJECTED = 'REJECTED',
        ANNULE = 'ANNULE',
    }
}

