/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LigneFactureCreateRequest = {
    quantite: number;
    description?: string;
    debit: number;
    credit: number;
    isTaxLine?: boolean;
    idProduit?: string;
    nomProduit?: string;
    prixUnitaire?: number;
    montantTotal?: number;
};

