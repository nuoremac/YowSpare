/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données pour la création ou mise à jour d'un profil Business Actor
 */
export type BusinessActorRequest = {
    name?: string;
    niu?: string;
    tradeRegistryNumber?: string;
    website?: string;
    contactPhone?: string;
    privateAddress?: string;
    businessAddress?: string;
    /**
     * Description de l'activité ou du profil
     */
    businessProfile?: string;
};

