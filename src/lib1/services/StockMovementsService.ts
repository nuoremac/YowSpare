/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMovementRequest } from '../models/CreateMovementRequest';
import type { StockMovement } from '../models/StockMovement';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StockMovementsService {
    /**
     * Historique des mouvements
     * @returns StockMovement OK
     * @throws ApiError
     */
    public static getAllMovements(): CancelablePromise<Array<StockMovement>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/movements',
        });
    }
    /**
     * Créer un mouvement (Brouillon)
     * @param requestBody
     * @returns StockMovement Mouvement créé
     * @throws ApiError
     */
    public static createDraft(
        requestBody: CreateMovementRequest,
    ): CancelablePromise<StockMovement> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/movements',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Valider un mouvement
     * @param id
     * @returns StockMovement OK
     * @throws ApiError
     */
    public static validateMovement(
        id: string,
    ): CancelablePromise<StockMovement> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/movements/{id}/validate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns StockMovement OK
     * @throws ApiError
     */
    public static getMovementById(
        id: string,
    ): CancelablePromise<StockMovement> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/movements/{id}',
            path: {
                'id': id,
            },
        });
    }
}
