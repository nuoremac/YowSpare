/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PaiementResponse = {
    idPaiement?: string;
    idClient?: string;
    montant?: number;
    date?: string;
    journal?: string;
    modePaiement?: PaiementResponse.modePaiement;
    compteBancaireF?: string;
    memo?: string;
    idFacture?: string;
    createdAt?: string;
    updatedAt?: string;
};
export namespace PaiementResponse {
    export enum modePaiement {
        ESPECES = 'ESPECES',
        CHEQUE = 'CHEQUE',
        VIREMENT = 'VIREMENT',
        CARTE_BANCAIRE = 'CARTE_BANCAIRE',
        AUTRE = 'AUTRE',
    }
}

