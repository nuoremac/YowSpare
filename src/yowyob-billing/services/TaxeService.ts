/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Pageable } from '../models/Pageable';
import type { PageTaxeResponse } from '../models/PageTaxeResponse';
import type { TaxeCreateRequest } from '../models/TaxeCreateRequest';
import type { TaxeResponse } from '../models/TaxeResponse';
import type { TaxeUpdateRequest } from '../models/TaxeUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TaxeService {
    /**
     * Récupérer une taxe par ID
     * @param taxeId
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxeById(
        taxeId: string,
    ): CancelablePromise<TaxeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/{taxeId}',
            path: {
                'taxeId': taxeId,
            },
        });
    }
    /**
     * Mettre à jour une taxe
     * @param taxeId
     * @param requestBody
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static updateTaxe(
        taxeId: string,
        requestBody: TaxeUpdateRequest,
    ): CancelablePromise<TaxeResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/taxes/{taxeId}',
            path: {
                'taxeId': taxeId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer une taxe
     * @param taxeId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteTaxe(
        taxeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/taxes/{taxeId}',
            path: {
                'taxeId': taxeId,
            },
        });
    }
    /**
     * Désactiver une taxe
     * @param taxeId
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static desactiverTaxe(
        taxeId: string,
    ): CancelablePromise<TaxeResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/taxes/{taxeId}/desactiver',
            path: {
                'taxeId': taxeId,
            },
        });
    }
    /**
     * Activer une taxe
     * @param taxeId
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static activerTaxe(
        taxeId: string,
    ): CancelablePromise<TaxeResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/taxes/{taxeId}/activer',
            path: {
                'taxeId': taxeId,
            },
        });
    }
    /**
     * Récupérer toutes les taxes
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getAllTaxes(): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes',
        });
    }
    /**
     * Créer une nouvelle taxe
     * @param requestBody
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static createTaxe(
        requestBody: TaxeCreateRequest,
    ): CancelablePromise<TaxeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/taxes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer les taxes par type
     * @param typeTaxe
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxesByType(
        typeTaxe: string,
    ): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/type/{typeTaxe}',
            path: {
                'typeTaxe': typeTaxe,
            },
        });
    }
    /**
     * Récupérer les taxes actives par type
     * @param typeTaxe
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getActiveTaxesByType(
        typeTaxe: string,
    ): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/type/{typeTaxe}/actives',
            path: {
                'typeTaxe': typeTaxe,
            },
        });
    }
    /**
     * Récupérer les taxes par position fiscale
     * @param positionFiscale
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxesByPositionFiscale(
        positionFiscale: string,
    ): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/position/{positionFiscale}',
            path: {
                'positionFiscale': positionFiscale,
            },
        });
    }
    /**
     * Récupérer les taxes par portée
     * @param porteTaxe
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxesByPorte(
        porteTaxe: string,
    ): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/porte/{porteTaxe}',
            path: {
                'porteTaxe': porteTaxe,
            },
        });
    }
    /**
     * Récupérer toutes les taxes (paginée)
     * @param pageable
     * @returns PageTaxeResponse OK
     * @throws ApiError
     */
    public static getAllTaxesPaginated(
        pageable: Pageable,
    ): CancelablePromise<PageTaxeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/page',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Récupérer une taxe par nom
     * @param nomTaxe
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxeByNom(
        nomTaxe: string,
    ): CancelablePromise<TaxeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/nom/{nomTaxe}',
            path: {
                'nomTaxe': nomTaxe,
            },
        });
    }
    /**
     * Récupérer les taxes par plage de montant
     * @param minMontant
     * @param maxMontant
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxesByMontantRange(
        minMontant: number,
        maxMontant: number,
    ): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/montant-range',
            query: {
                'minMontant': minMontant,
                'maxMontant': maxMontant,
            },
        });
    }
    /**
     * Compter les taxes par type
     * @param typeTaxe
     * @returns number OK
     * @throws ApiError
     */
    public static countByType(
        typeTaxe: string,
    ): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/count/type/{typeTaxe}',
            path: {
                'typeTaxe': typeTaxe,
            },
        });
    }
    /**
     * Compter les taxes actives
     * @returns number OK
     * @throws ApiError
     */
    public static countActiveTaxes(): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/count/actives',
        });
    }
    /**
     * Récupérer les taxes par plage de calcul
     * @param minTaux
     * @param maxTaux
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getTaxesByCalculRange(
        minTaux: number,
        maxTaux: number,
    ): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/calcul-range',
            query: {
                'minTaux': minTaux,
                'maxTaux': maxTaux,
            },
        });
    }
    /**
     * Récupérer toutes les taxes actives
     * @returns TaxeResponse OK
     * @throws ApiError
     */
    public static getActiveTaxes(): CancelablePromise<Array<TaxeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/taxes/actives',
        });
    }
}
