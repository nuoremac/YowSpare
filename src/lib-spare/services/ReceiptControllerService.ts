/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateReceiptRequest } from '../models/CreateReceiptRequest';
import type { ReceiptDto } from '../models/ReceiptDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReceiptControllerService {
    public static list(
        poId?: string,
        stockPosted?: boolean,
    ): CancelablePromise<Array<ReceiptDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/receipts',
            query: { 'poId': poId, 'stockPosted': stockPosted },
        });
    }
    public static create(
        requestBody: CreateReceiptRequest,
    ): CancelablePromise<ReceiptDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/receipts',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    public static get(
        id: string,
    ): CancelablePromise<ReceiptDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/receipts/{id}',
            path: { 'id': id },
        });
    }
    public static postToStock(
        id: string,
    ): CancelablePromise<ReceiptDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/receipts/{id}/post-to-stock',
            path: { 'id': id },
        });
    }
}
