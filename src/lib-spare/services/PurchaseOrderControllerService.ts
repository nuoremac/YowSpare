/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePurchaseOrderRequest } from '../models/CreatePurchaseOrderRequest';
import type { PurchaseOrderDto } from '../models/PurchaseOrderDto';
import type { UpdatePurchaseOrderStatusRequest } from '../models/UpdatePurchaseOrderStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PurchaseOrderControllerService {
    public static list(
        q?: string,
        status?: string,
    ): CancelablePromise<Array<PurchaseOrderDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/purchase-orders',
            query: { 'q': q, 'status': status },
        });
    }
    public static create(
        requestBody: CreatePurchaseOrderRequest,
    ): CancelablePromise<PurchaseOrderDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/purchase-orders',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    public static get(
        id: string,
    ): CancelablePromise<PurchaseOrderDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/purchase-orders/{id}',
            path: { 'id': id },
        });
    }
    public static updateStatus(
        id: string,
        requestBody: UpdatePurchaseOrderStatusRequest,
    ): CancelablePromise<PurchaseOrderDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/purchase-orders/{id}/status',
            path: { 'id': id },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    public static delete(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/purchase-orders/{id}',
            path: { 'id': id },
        });
    }
}
