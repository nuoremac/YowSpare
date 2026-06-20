/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FactureFournisseurCreateRequest } from '../models/FactureFournisseurCreateRequest';
import type { FactureFournisseurResponse } from '../models/FactureFournisseurResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FactureFournisseurControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns FactureFournisseurResponse OK
     * @throws ApiError
     */
    public static updateFacture1(
        id: string,
        requestBody: FactureFournisseurResponse,
    ): CancelablePromise<FactureFournisseurResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/facture-fournisseurs/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns FactureFournisseurResponse OK
     * @throws ApiError
     */
    public static getFactures(): CancelablePromise<Array<FactureFournisseurResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/facture-fournisseurs',
        });
    }
    /**
     * @param requestBody
     * @returns FactureFournisseurResponse OK
     * @throws ApiError
     */
    public static createFacture1(
        requestBody: FactureFournisseurCreateRequest,
    ): CancelablePromise<FactureFournisseurResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/facture-fournisseurs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
