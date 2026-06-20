/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupplierDto } from '../models/SupplierDto';
import type { SupplierProductDto } from '../models/SupplierProductDto';
import type { UpsertSupplierProductRequest } from '../models/UpsertSupplierProductRequest';
import type { UpsertSupplierRequest } from '../models/UpsertSupplierRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SupplierControllerService {
    /**
     * @param supplierId
     * @param productId
     * @param requestBody
     * @returns SupplierProductDto OK
     * @throws ApiError
     */
    public static upsertSupplierProduct(
        supplierId: string,
        productId: string,
        requestBody: UpsertSupplierProductRequest,
    ): CancelablePromise<SupplierProductDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/suppliers/{supplierId}/products/{productId}',
            path: {
                'supplierId': supplierId,
                'productId': productId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param supplierId
     * @param productId
     * @returns void
     * @throws ApiError
     */
    public static deleteSupplierProduct(
        supplierId: string,
        productId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/suppliers/{supplierId}/products/{productId}',
            path: {
                'supplierId': supplierId,
                'productId': productId,
            },
        });
    }
    /**
     * @param id
     * @returns SupplierDto OK
     * @throws ApiError
     */
    public static get(
        id: string,
    ): CancelablePromise<SupplierDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/suppliers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns SupplierDto OK
     * @throws ApiError
     */
    public static upsert1(
        id: string,
        requestBody: UpsertSupplierRequest,
    ): CancelablePromise<SupplierDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/suppliers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static delete1(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/suppliers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param q
     * @param status
     * @returns SupplierDto OK
     * @throws ApiError
     */
    public static list1(
        q?: string,
        status?: string,
    ): CancelablePromise<Array<SupplierDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/suppliers',
            query: {
                'q': q,
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns SupplierDto Created
     * @throws ApiError
     */
    public static create1(
        requestBody: UpsertSupplierRequest,
    ): CancelablePromise<SupplierDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/suppliers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param supplierId
     * @returns SupplierProductDto OK
     * @throws ApiError
     */
    public static listSupplierProducts(
        supplierId: string,
    ): CancelablePromise<Array<SupplierProductDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/suppliers/{supplierId}/products',
            path: {
                'supplierId': supplierId,
            },
        });
    }
    /**
     * @param productId
     * @returns SupplierProductDto OK
     * @throws ApiError
     */
    public static listByProduct(
        productId: string,
    ): CancelablePromise<Array<SupplierProductDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/suppliers/products/{productId}',
            path: {
                'productId': productId,
            },
        });
    }
}
