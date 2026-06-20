/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneProformaResponse } from './LigneProformaResponse';
export type ProformaInvoiceResponse = {
    idProformaInvoice?: string;
    numeroProformaInvoice?: string;
    dateCreation?: string;
    type?: string;
    statut?: ProformaInvoiceResponse.statut;
    montantTotal?: number;
    idClient?: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    lignes?: Array<LigneProformaResponse>;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    devise?: string;
    tauxChange?: number;
    conditionsPaiement?: string;
    notes?: string;
    referenceExterne?: string;
    pdfPath?: string;
    envoyeParEmail?: boolean;
    dateEnvoiEmail?: string;
    dateAcceptation?: string;
    dateRefus?: string;
    motifRefus?: string;
    idFactureConvertie?: string;
    remiseGlobalePourcentage?: number;
    remiseGlobaleMontant?: number;
    validiteOffreJours?: number;
    createdAt?: string;
    updatedAt?: string;
    applyVat?: boolean;
    dateSysteme?: string;
    modeReglement?: ProformaInvoiceResponse.modeReglement;
    nosRef?: string;
    vosRef?: string;
    nbreEcheance?: number;
    referalClientId?: string;
    finalAmount?: number;
};
export namespace ProformaInvoiceResponse {
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

