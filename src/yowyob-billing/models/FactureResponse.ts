/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneFactureResponse } from './LigneFactureResponse';
export type FactureResponse = {
    idFacture?: string;
    numeroFacture?: string;
    dateFacturation?: string;
    dateEcheance?: string;
    dateSysteme?: string;
    type?: string;
    etat?: FactureResponse.etat;
    idClient?: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    montantTotal?: number;
    montantRestant?: number;
    finalAmount?: number;
    applyVat?: boolean;
    devise?: string;
    tauxChange?: number;
    modeReglement?: FactureResponse.modeReglement;
    conditionsPaiement?: string;
    nbreEcheance?: number;
    nosRef?: string;
    vosRef?: string;
    referenceCommande?: string;
    idDevisOrigine?: string;
    lignesFacture?: Array<LigneFactureResponse>;
    notes?: string;
    pdfPath?: string;
    envoyeParEmail?: boolean;
    dateEnvoiEmail?: string;
    referalClientId?: string;
    organizationId?: string;
    remiseGlobalePourcentage?: number;
    remiseGlobaleMontant?: number;
    createdBy?: string;
    createdByUsername?: string;
    validatedBy?: string;
    validatedByUsername?: string;
    validatedAt?: string;
    version?: number;
    createdAt?: string;
    updatedAt?: string;
};
export namespace FactureResponse {
    export enum etat {
        BROUILLON = 'BROUILLON',
        ENVOYE = 'ENVOYE',
        PAYE = 'PAYE',
        PARTIELLEMENT_PAYE = 'PARTIELLEMENT_PAYE',
        EN_RETARD = 'EN_RETARD',
        ANNULE = 'ANNULE',
        EN_ATTENTE = 'EN_ATTENTE',
    }
    export enum modeReglement {
        VIREMENT = 'VIREMENT',
        CARTE_BANCAIRE = 'CARTE_BANCAIRE',
        ESPECES = 'ESPECES',
        CHEQUE = 'CHEQUE',
        PRELEVEMENT = 'PRELEVEMENT',
        PAYPAL = 'PAYPAL',
        ORANGE_MONEY = 'ORANGE_MONEY',
        MOBILE_MONEY = 'MOBILE_MONEY',
        AUTRE = 'AUTRE',
    }
}

