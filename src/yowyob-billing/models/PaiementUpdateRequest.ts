/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PaiementUpdateRequest = {
    idClient?: string;
    montant?: number;
    date?: string;
    journal?: string;
    modePaiement?: PaiementUpdateRequest.modePaiement;
    compteBancaireF?: string;
    memo?: string;
    idFacture?: string;
};
export namespace PaiementUpdateRequest {
    export enum modePaiement {
        ESPECES = 'ESPECES',
        CHEQUE = 'CHEQUE',
        VIREMENT = 'VIREMENT',
        CARTE_BANCAIRE = 'CARTE_BANCAIRE',
        AUTRE = 'AUTRE',
    }
}

