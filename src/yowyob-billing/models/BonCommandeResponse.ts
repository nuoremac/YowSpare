/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineBonCommande } from './LineBonCommande';
export type BonCommandeResponse = {
    idBonCommande?: string;
    numeroCommande?: string;
    idClient?: string;
    nomClient?: string;
    adresseClient?: string;
    emailClient?: string;
    telephoneClient?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientAddress?: string;
    recipientCity?: string;
    idDevisOrigine?: string;
    numeroDevisOrigine?: string;
    referenceExterne?: string;
    nosRef?: string;
    vosRef?: string;
    dateCommande?: string;
    dateSysteme?: string;
    dateLivraisonPrevue?: string;
    lines?: Array<LineBonCommande>;
    montantHT?: number;
    montantTVA?: number;
    montantTTC?: number;
    devise?: string;
    tauxChange?: number;
    applyVat?: boolean;
    transportMethod?: string;
    idAgency?: string;
    modeReglement?: string;
    conditionsPaiement?: string;
    delaiLivraison?: number;
    adresseLivraison?: string;
    statut?: BonCommandeResponse.statut;
    notes?: string;
    createdBy?: string;
    validatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    validatedAt?: string;
    organizationId?: string;
};
export namespace BonCommandeResponse {
    export enum statut {
        BROUILLON = 'BROUILLON',
        VALIDE = 'VALIDE',
        EN_COURS = 'EN_COURS',
        EXPEDIE = 'EXPEDIE',
        LIVRE = 'LIVRE',
        RECU_PARTIEL = 'RECU_PARTIEL',
        RECU = 'RECU',
        REJETE = 'REJETE',
        ANNULE = 'ANNULE',
    }
}

