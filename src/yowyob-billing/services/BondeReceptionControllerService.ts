/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BondeReceptionCreateRequest } from '../models/BondeReceptionCreateRequest';
import type { BondeReceptionResponse } from '../models/BondeReceptionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BondeReceptionControllerService {
    /**
     * @param id
     * @returns BondeReceptionResponse OK
     * @throws ApiError
     */
    public static getBonById(
        id: string,
    ): CancelablePromise<BondeReceptionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/facturation/bon-receptions/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns BondeReceptionResponse OK
     * @throws ApiError
     */
    public static updateBon(
        id: string,
        requestBody: BondeReceptionResponse,
    ): CancelablePromise<BondeReceptionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/facturation/bon-receptions/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteBon(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/facturation/bon-receptions/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns BondeReceptionResponse OK
     * @throws ApiError
     */
    public static getBons(): CancelablePromise<Array<BondeReceptionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/facturation/bon-receptions',
        });
    }
    /**
     * @param requestBody
     * @returns BondeReceptionResponse OK
     * @throws ApiError
     */
    public static createBon(
        requestBody: BondeReceptionCreateRequest,
    ): CancelablePromise<BondeReceptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/facturation/bon-receptions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
