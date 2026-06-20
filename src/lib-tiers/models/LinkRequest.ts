/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données pour lier une agence et un POI
 */
export type LinkRequest = {
    /**
     * ID de l'agence concernée
     */
    agencyId?: string;
    /**
     * ID du point d'intérêt à lier
     */
    poiId?: string;
    /**
     * Distance en mètres entre l'agence et le POI
     */
    distanceMeters?: number;
    description?: string;
};

