/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données pour créer ou mettre à jour une agence
 */
export type AgencyRequest = {
    name?: string;
    /**
     * Types possibles: HQ, WAREHOUSE, POS, OFFICE
     */
    type?: string;
    address?: string;
    city?: string;
    /**
     * Fuseau horaire au format IANA
     */
    timezone?: string;
    headquarter?: boolean;
};

