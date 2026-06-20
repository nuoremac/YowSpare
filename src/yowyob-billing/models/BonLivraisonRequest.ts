/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LigneBonLivraisonRequest } from './LigneBonLivraisonRequest';
export type BonLivraisonRequest = {
    numeroBonLivraison?: string;
    idClient: string;
    nomClient?: string;
    nomDestinataire?: string;
    adresseDestinataire?: string;
    contactDestinataire?: string;
    nomAgence?: string;
    adresseAgence?: string;
    contactAgence?: string;
    dateLivraison: string;
    dateEcheance?: string;
    idFacture?: string;
    numeroFacture?: string;
    idBonCommande?: string;
    numeroCommande?: string;
    statut?: BonLivraisonRequest.statut;
    lignes?: Array<LigneBonLivraisonRequest>;
    montantTotal?: number;
    conditionsGenerales?: string;
    transporteur?: string;
    numeroSuivi?: string;
};
export namespace BonLivraisonRequest {
    export enum statut {
        EN_PREPARATION = 'EN_PREPARATION',
        PRET_A_EXPEDIER = 'PRET_A_EXPEDIER',
        EXPEDIE = 'EXPEDIE',
        LIVRE = 'LIVRE',
        RETOURNE = 'RETOURNE',
        ANNULE = 'ANNULE',
    }
}

