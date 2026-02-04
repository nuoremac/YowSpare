/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CountRequest } from '../models/CountRequest';
import type { InitiateInventoryRequest } from '../models/InitiateInventoryRequest';
import type { InventorySession } from '../models/InventorySession';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InventoryService {
    /**
     * Lister les inventaires de mon agence
     * @returns InventorySession OK
     * @throws ApiError
     */
    public static getMyInventories(): CancelablePromise<Array<InventorySession>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/inventories',
        });
    }
    /**
     * Ouvrir une nouvelle session d'inventaire
     * @param requestBody
     * @returns InventorySession Session créée avec le snapshot du stock théorique
     * @throws ApiError
     */
    public static initiate(
        requestBody: InitiateInventoryRequest,
    ): CancelablePromise<InventorySession> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/inventories',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Valider l'inventaire et ajuster le stock
     * @param id
     * @returns InventorySession OK
     * @throws ApiError
     */
    public static validate1(
        id: string,
    ): CancelablePromise<InventorySession> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/inventories/{id}/validate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Soumettre les comptages
     * @param id
     * @param requestBody
     * @returns any Comptages enregistrés
     * @throws ApiError
     */
    public static submitCounts(
        id: string,
        requestBody: Array<CountRequest>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/inventories/{id}/counts',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
