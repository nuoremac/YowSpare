/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineFactureFournisseur } from './LineFactureFournisseur';
export type FactureFournisseurCreateRequest = {
    numeroFacture?: string;
    dateFacturation?: string;
    dateEcheance?: string;
    etat?: FactureFournisseurCreateRequest.etat;
    type?: string;
    idFournisseur?: string;
    nomFournisseru?: string;
    adresseFournisseur?: string;
    emailFournisseur?: string;
    telephoneFournisseur?: string;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    remiseGlobalePourcentage?: number;
    applyVat?: boolean;
    devise?: string;
    tauxChange?: number;
    modeReglement?: FactureFournisseurCreateRequest.modeReglement;
    referenceCommande?: string;
    idGRN?: string;
    numeroGRN?: string;
    lignesFacture?: Array<LineFactureFournisseur>;
    notes?: string;
    createdBy?: string;
};
export namespace FactureFournisseurCreateRequest {
    export enum etat {
        BROUILLON = 'BROUILLON',
        ENVOYE = 'ENVOYE',
        PAYE = 'PAYE',
        PARTIELLEMENT_PAYE = 'PARTIELLEMENT_PAYE',
        EN_RETARD = 'EN_RETARD',
        ANNULE = 'ANNULE',
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

