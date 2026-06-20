/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneFactureCreateRequest } from './LigneFactureCreateRequest';
export type FactureCreateRequest = {
    numeroFacture?: string;
    dateFacturation: string;
    dateEcheance: string;
    dateSysteme?: string;
    type?: string;
    etat?: FactureCreateRequest.etat;
    idClient: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    lignesFacture?: Array<LigneFactureCreateRequest>;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    montantTotal?: number;
    finalAmount?: number;
    montantRestant?: number;
    applyVat?: boolean;
    devise?: string;
    tauxChange?: number;
    modeReglement?: FactureCreateRequest.modeReglement;
    conditionsPaiement?: string;
    nbreEcheance?: number;
    nosRef?: string;
    vosRef?: string;
    referenceCommande?: string;
    idDevisOrigine?: string;
    notes?: string;
    pdfPath?: string;
    envoyeParEmail?: boolean;
    dateEnvoiEmail?: string;
    remiseGlobalePourcentage?: number;
    remiseGlobaleMontant?: number;
    referalClientId?: string;
    organizationId?: string;
};
export namespace FactureCreateRequest {
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

