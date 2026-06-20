/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneBonAchatResponse } from './LigneBonAchatResponse';
export type BonAchatResponse = {
    idBonAchat?: string;
    numeroBonAchat?: string;
    supplierId?: string;
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
    status?: BonAchatResponse.status;
    lines?: Array<LigneBonAchatResponse>;
    subtotalAmount?: number;
    taxAmount?: number;
    grandTotal?: number;
    preparedBy?: string;
    approvedBy?: string;
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId?: string;
};
export namespace BonAchatResponse {
    export enum status {
        BROUILLON = 'BROUILLON',
        RECU_PARTIEL = 'RECU_PARTIEL',
        RECU = 'RECU',
        REJETE = 'REJETE',
        ANNULE = 'ANNULE',
    }
}

