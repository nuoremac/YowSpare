/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryRequest } from '../models/CategoryRequest';
import type { CreateMediaAssetRequest } from '../models/CreateMediaAssetRequest';
import type { MediaAsset } from '../models/MediaAsset';
import type { Product } from '../models/Product';
import type { ProductCategory } from '../models/ProductCategory';
import type { ProductRequest } from '../models/ProductRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductCatalogService {
    /**
     * Lister les produits
     * @returns Product OK
     * @throws ApiError
     */
    public static getProducts(): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/products',
        });
    }
    /**
     * Créer un produit
     * @param requestBody
     * @returns Product OK
     * @throws ApiError
     */
    public static createProduct(
        requestBody: ProductRequest,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/products',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Modifier un produit
     * @param id
     * @param requestBody
     * @returns Product OK
     * @throws ApiError
     */
    public static updateProduct(
        id: string,
        requestBody: ProductRequest,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/products/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un produit
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteProduct(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/products/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les medias rattaches a une ressource
     * @param targetType
     * @param targetId
     * @returns MediaAsset OK
     * @throws ApiError
     */
    public static getMediaAssets(
        targetType: string,
        targetId: string,
    ): CancelablePromise<Array<MediaAsset>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/media-assets',
            query: {
                'targetType': targetType,
                'targetId': targetId,
            },
        });
    }
    /**
     * Attacher un media a une ressource
     * @param requestBody
     * @returns MediaAsset OK
     * @throws ApiError
     */
    public static createMediaAsset(
        requestBody: CreateMediaAssetRequest,
    ): CancelablePromise<MediaAsset> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/media-assets',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ProductCategory OK
     * @throws ApiError
     */
    public static getCategories(): CancelablePromise<Array<ProductCategory>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/products/categories',
        });
    }
    /**
     * Créer une catégorie
     * @param requestBody
     * @returns ProductCategory OK
     * @throws ApiError
     */
    public static createCategory(
        requestBody: CategoryRequest,
    ): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/products/categories',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Modifier une catégorie
     * @param id
     * @param requestBody
     * @returns ProductCategory OK
     * @throws ApiError
     */
    public static updateCategory(
        id: string,
        requestBody: CategoryRequest,
    ): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/products/categories/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer une catégorie
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteCategory(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/products/categories/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns Product OK
     * @throws ApiError
     */
    public static getProduct(
        id: string,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/products/{id}',
            path: {
                'id': id,
            },
        });
    }
}
