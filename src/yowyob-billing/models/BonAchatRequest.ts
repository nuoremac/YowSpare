/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneBonAchatRequest } from './LigneBonAchatRequest';
export type BonAchatRequest = {
    numeroBonAchat: string;
    supplierId: string;
    supplierName?: string;
    supplierCode?: string;
    supplierEmail?: string;
    supplierContact?: string;
    supplierAddress?: string;
    deliveryName?: string;
    deliveryAddress?: string;
    deliveryEmail?: string;
    deliveryContact?: string;
    dateBonAchat?: string;
    dateSysteme?: string;
    dateLivraisonPrevue?: string;
    transportMethod?: string;
    instructionsLivraison?: string;
    status: BonAchatRequest.status;
    subtotalAmount?: number;
    taxAmount?: number;
    grandTotal?: number;
    preparedBy?: string;
    approvedBy?: string;
    remarks?: string;
    lines: Array<LigneBonAchatRequest>;
};
export namespace BonAchatRequest {
    export enum status {
        BROUILLON = 'BROUILLON',
        RECU_PARTIEL = 'RECU_PARTIEL',
        RECU = 'RECU',
        REJETE = 'REJETE',
        ANNULE = 'ANNULE',
    }
}

