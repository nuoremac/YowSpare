/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneBonLivraisonResponse } from './LigneBonLivraisonResponse';
export type BonLivraisonResponse = {
    idBonLivraison?: string;
    numeroBonLivraison?: string;
    nomDestinataire?: string;
    adresseDestinataire?: string;
    contactDestinataire?: string;
    nomAgence?: string;
    adresseAgence?: string;
    contactAgence?: string;
    dateLivraison?: string;
    dateEcheance?: string;
    lines?: Array<LigneBonLivraisonResponse>;
    totalAmount?: number;
    termsAndConditions?: string;
    purchaseOrderNumber?: string;
    createdAt?: string;
    updatedAt?: string;
    idClient?: string;
    nomClient?: string;
    statut?: BonLivraisonResponse.statut;
    transporteur?: string;
    numeroSuivi?: string;
};
export namespace BonLivraisonResponse {
    export enum statut {
        EN_PREPARATION = 'EN_PREPARATION',
        PRET_A_EXPEDIER = 'PRET_A_EXPEDIER',
        EXPEDIE = 'EXPEDIE',
        LIVRE = 'LIVRE',
        RETOURNE = 'RETOURNE',
        ANNULE = 'ANNULE',
    }
}

