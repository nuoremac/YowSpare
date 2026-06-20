/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneProformaRequest } from './LigneProformaRequest';
export type ProformaInvoiceRequest = {
    numeroProformaInvoice?: string;
    idClient: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    lignes?: Array<LigneProformaRequest>;
    type?: string;
    statut?: ProformaInvoiceRequest.statut;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    devise?: string;
    tauxChange?: number;
    conditionsPaiement?: string;
    notes?: string;
    referenceExterne?: string;
    applyVat?: boolean;
    dateSysteme?: string;
    modeReglement?: ProformaInvoiceRequest.modeReglement;
    nosRef?: string;
    vosRef?: string;
    nbreEcheance?: number;
    referalClientId?: string;
    remiseGlobalePourcentage?: number;
    remiseGlobaleMontant?: number;
    validiteOffreJours?: number;
};
export namespace ProformaInvoiceRequest {
    export enum statut {
        BROUILLON = 'BROUILLON',
        ENVOYE = 'ENVOYE',
        ACCEPTE = 'ACCEPTE',
        REFUSE = 'REFUSE',
        EXPIRE = 'EXPIRE',
        ANNULE = 'ANNULE',
        CONVERTI_EN_FACTURE = 'CONVERTI_EN_FACTURE',
    }
    export enum modeReglement {
        VIREMENT = 'VIREMENT',
        CARTE_BANCAIRE = 'CARTE_BANCAIRE',
        ESPECES = 'ESPECES',
        CHEQUE = 'CHEQUE',
        PRELEVEMENT = 'PRELEVEMENT',
        PAYPAL = 'PAYPAL',
        AUTRE = 'AUTRE',
    }
}

