/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PaiementCreateRequest = {
    idClient: string;
    montant: number;
    date: string;
    journal: string;
    modePaiement: PaiementCreateRequest.modePaiement;
    compteBancaireF?: string;
    memo?: string;
    idFacture?: string;
};
export namespace PaiementCreateRequest {
    export enum modePaiement {
        ESPECES = 'ESPECES',
        CHEQUE = 'CHEQUE',
        VIREMENT = 'VIREMENT',
        CARTE_BANCAIRE = 'CARTE_BANCAIRE',
        AUTRE = 'AUTRE',
    }
}

