/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données pour la création d'un point d'intérêt
 */
export type PoiRequest = {
    name?: string;
    /**
     * Type de POI (ex: HOTEL, STATION, RESTAURANT)
     */
    type?: string;
    /**
     * Description du lieu
     */
    description?: string;
    latitude?: number;
    longitude?: number;
};

