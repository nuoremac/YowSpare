/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneDevisResponse } from './LigneDevisResponse';
export type DevisResponse = {
    idDevis?: string;
    numeroDevis?: string;
    dateCreation?: string;
    dateValidite?: string;
    type?: string;
    statut?: DevisResponse.statut;
    montantTotal?: number;
    idClient?: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    lignesDevis?: Array<LigneDevisResponse>;
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
    applyVat?: boolean;
    dateSysteme?: string;
    modeReglement?: DevisResponse.modeReglement;
    nosRef?: string;
    vosRef?: string;
    nbreEcheance?: number;
    referalClientId?: string;
    finalAmount?: number;
    createdAt?: string;
    updatedAt?: string;
    organizationId?: string;
};
export namespace DevisResponse {
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

