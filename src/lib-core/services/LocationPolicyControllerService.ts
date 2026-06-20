/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationPolicyDto } from '../models/LocationPolicyDto';
import type { UpsertLocationPolicyRequest } from '../models/UpsertLocationPolicyRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LocationPolicyControllerService {
    /**
     * @param agencyId
     * @param binCode
     * @param productId
     * @returns LocationPolicyDto OK
     * @throws ApiError
     */
    public static listForBin(
        agencyId: string,
        binCode: string,
        productId?: string,
    ): CancelablePromise<Array<LocationPolicyDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/warehouses/{agencyId}/bins/{binCode}/policies',
            path: {
                'agencyId': agencyId,
                'binCode': binCode,
            },
            query: {
                'productId': productId,
            },
        });
    }
    /**
     * @param agencyId
     * @param binCode
     * @param requestBody
     * @param productId
     * @returns LocationPolicyDto OK
     * @throws ApiError
     */
    public static upsert(
        agencyId: string,
        binCode: string,
        requestBody: UpsertLocationPolicyRequest,
        productId?: string,
    ): CancelablePromise<LocationPolicyDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/warehouses/{agencyId}/bins/{binCode}/policies',
            path: {
                'agencyId': agencyId,
                'binCode': binCode,
            },
            query: {
                'productId': productId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param agencyId
     * @param binCode
     * @param productId
     * @returns void
     * @throws ApiError
     */
    public static delete(
        agencyId: string,
        binCode: string,
        productId?: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/warehouses/{agencyId}/bins/{binCode}/policies',
            path: {
                'agencyId': agencyId,
                'binCode': binCode,
            },
            query: {
                'productId': productId,
            },
        });
    }
    /**
     * @param agencyId
     * @param productId
     * @returns LocationPolicyDto OK
     * @throws ApiError
     */
    public static listForAgency(
        agencyId: string,
        productId?: string,
    ): CancelablePromise<Array<LocationPolicyDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/warehouses/{agencyId}/policies',
            path: {
                'agencyId': agencyId,
            },
            query: {
                'productId': productId,
            },
        });
    }
}
