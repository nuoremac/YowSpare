/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
    /**
     * Rapport des ventes par période
     * @param startDate
     * @param endDate
     * @returns any OK
     * @throws ApiError
     */
    public static getRapportVentes(
        startDate: string,
        endDate: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/ventes/periode',
            query: {
                'startDate': startDate,
                'endDate': endDate,
            },
        });
    }
    /**
     * Top clients par chiffre d'affaires
     * @param limit
     * @returns any OK
     * @throws ApiError
     */
    public static getTopClients(
        limit: number = 10,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/clients/top',
            query: {
                'limit': limit,
            },
        });
    }
}
