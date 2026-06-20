/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneDevisCreateRequest } from './LigneDevisCreateRequest';
export type DevisCreateRequest = {
    numeroDevis?: string;
    dateCreation: string;
    dateValidite: string;
    type?: string;
    statut?: DevisCreateRequest.statut;
    idClient: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    lignesDevis?: Array<LigneDevisCreateRequest>;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    montantTotal?: number;
    finalAmount?: number;
    devise?: string;
    tauxChange?: number;
    conditionsPaiement?: string;
    notes?: string;
    referenceExterne?: string;
    remiseGlobalePourcentage?: number;
    remiseGlobaleMontant?: number;
    validiteOffreJours?: number;
    applyVat: boolean;
    dateSysteme?: string;
    modeReglement?: DevisCreateRequest.modeReglement;
    nosRef?: string;
    vosRef?: string;
    nbreEcheance?: number;
    referalClientId?: string;
    pdfPath?: string;
    organizationId?: string;
};
export namespace DevisCreateRequest {
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
        ORANGE_MONEY = 'ORANGE_MONEY',
        MOBILE_MONEY = 'MOBILE_MONEY',
        AUTRE = 'AUTRE',
    }
}

