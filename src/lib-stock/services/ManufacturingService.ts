/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductTransformation } from '../models/ProductTransformation';
import type { TransformationRequest } from '../models/TransformationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ManufacturingService {
    /**
     * Lister les ordres de fabrication
     * @returns ProductTransformation OK
     * @throws ApiError
     */
    public static getAll(): CancelablePromise<Array<ProductTransformation>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/product-transformations',
        });
    }
    /**
     * Créer un ordre de fabrication (Brouillon)
     * @param requestBody
     * @returns ProductTransformation Ordre de fabrication créé
     * @throws ApiError
     */
    public static create(
        requestBody: TransformationRequest,
    ): CancelablePromise<ProductTransformation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/product-transformations',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Valider et exécuter la fabrication
     * @param id
     * @returns ProductTransformation OK
     * @throws ApiError
     */
    public static validate(
        id: string,
    ): CancelablePromise<ProductTransformation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/product-transformations/{id}/validate',
            path: {
                'id': id,
            },
        });
    }
}
