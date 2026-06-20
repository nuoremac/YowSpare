/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductLocationDto } from '../models/ProductLocationDto';
import type { UpsertProductLocationRequest } from '../models/UpsertProductLocationRequest';
import type { WarehouseLayoutDto } from '../models/WarehouseLayoutDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WarehouseControllerService {
    /**
     * @param agencyId
     * @param productId
     * @param requestBody
     * @returns ProductLocationDto OK
     * @throws ApiError
     */
    public static upsertLocation(
        agencyId: string,
        productId: string,
        requestBody: UpsertProductLocationRequest,
    ): CancelablePromise<ProductLocationDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/warehouses/{agencyId}/product-locations/{productId}',
            path: {
                'agencyId': agencyId,
                'productId': productId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param agencyId
     * @returns WarehouseLayoutDto OK
     * @throws ApiError
     */
    public static getLayout(
        agencyId: string,
    ): CancelablePromise<WarehouseLayoutDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/warehouses/{agencyId}/layout',
            path: {
                'agencyId': agencyId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param agencyId
     * @param requestBody
     * @returns WarehouseLayoutDto OK
     * @throws ApiError
     */
    public static putLayout(
        agencyId: string,
        requestBody: WarehouseLayoutDto,
    ): CancelablePromise<WarehouseLayoutDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/warehouses/{agencyId}/layout',
            path: {
                'agencyId': agencyId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param agencyId
     * @returns ProductLocationDto OK
     * @throws ApiError
     */
    public static listLocations(
        agencyId: string,
    ): CancelablePromise<Array<ProductLocationDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/warehouses/{agencyId}/product-locations',
            path: {
                'agencyId': agencyId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param productId
     * @returns ProductLocationDto OK
     * @throws ApiError
     */
    public static listLocationsForProduct(
        productId: string,
    ): CancelablePromise<Array<ProductLocationDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/warehouses/products/{productId}/locations',
            path: {
                'productId': productId,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
}
