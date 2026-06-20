/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockLevel } from '../models/StockLevel';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StockLevelsService {
    /**
     * Consulter les niveaux de stock
     * Récupère les niveaux de stock. Si l'utilisateur est un staff global, retourne le stock de toutes les agences. Si c'est un staff local, retourne uniquement le stock de son agence.
     * @returns StockLevel OK
     * @throws ApiError
     */
    public static getStockLevels(): CancelablePromise<Array<StockLevel>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/stock-levels',
        });
    }
}
