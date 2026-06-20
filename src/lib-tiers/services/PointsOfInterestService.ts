/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LinkRequest } from '../models/LinkRequest';
import type { PointOfInterest } from '../models/PointOfInterest';
import type { PoiRequest } from '../models/PoiRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PointsOfInterestService {
    /**
     * Lister tous les points d'intérêt
     * Récupère la liste de tous les POI créés dans le système.
     * @returns PointOfInterest OK
     * @throws ApiError
     */
    public static getAllPois(): CancelablePromise<Array<PointOfInterest>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pois',
        });
    }
    /**
     * Créer un nouveau point d'intérêt
     * @param requestBody
     * @returns PointOfInterest Point d'intérêt créé avec succès
     * @throws ApiError
     */
    public static createPoi(
        requestBody: PoiRequest,
    ): CancelablePromise<PointOfInterest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pois',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lier une agence à un point d'intérêt
     * Crée une relation entre une agence et un POI, en spécifiant la distance et une description (ex: 'À 50m de notre agence').
     * @param requestBody
     * @returns any Lien créé avec succès
     * @throws ApiError
     */
    public static linkAgencyToPoi(
        requestBody: LinkRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pois/link',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Délier une agence d'un point d'intérêt
     * @param agencyId
     * @param poiId
     * @returns void
     * @throws ApiError
     */
    public static unlinkAgencyFromPoi(
        agencyId: string,
        poiId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pois/link',
            query: {
                'agencyId': agencyId,
                'poiId': poiId,
            },
        });
    }
}
