/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BonAchatRequest } from '../models/BonAchatRequest';
import type { BonAchatResponse } from '../models/BonAchatResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BonDAchatService {
    /**
     * Récupérer un bon d'achat par ID
     * @param id
     * @returns BonAchatResponse OK
     * @throws ApiError
     */
    public static getBonAchatById(
        id: string,
    ): CancelablePromise<BonAchatResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bons-achat/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update un bon d'achat par ID
     * @param id
     * @param requestBody
     * @returns BonAchatResponse OK
     * @throws ApiError
     */
    public static updateBonAchatById(
        id: string,
        requestBody: BonAchatRequest,
    ): CancelablePromise<BonAchatResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/bons-achat/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un bon d'achat
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteBonAchat(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bons-achat/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister tous les bons d'achat
     * @returns BonAchatResponse OK
     * @throws ApiError
     */
    public static getAllBonsAchat(): CancelablePromise<Array<BonAchatResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bons-achat',
        });
    }
    /**
     * Créer un nouveau bon d'achat
     * @param requestBody
     * @returns BonAchatResponse OK
     * @throws ApiError
     */
    public static createBonAchat(
        requestBody: BonAchatRequest,
    ): CancelablePromise<BonAchatResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bons-achat',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
