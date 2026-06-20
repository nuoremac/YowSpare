/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProformaInvoiceRequest } from '../models/ProformaInvoiceRequest';
import type { ProformaInvoiceResponse } from '../models/ProformaInvoiceResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FacturesProformaService {
    /**
     * Lister toutes les factures proforma
     * @returns ProformaInvoiceResponse OK
     * @throws ApiError
     */
    public static getAllProformas(): CancelablePromise<Array<ProformaInvoiceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures-proforma',
        });
    }
    /**
     * Créer une nouvelle facture proforma
     * @param requestBody
     * @returns ProformaInvoiceResponse OK
     * @throws ApiError
     */
    public static createProforma(
        requestBody: ProformaInvoiceRequest,
    ): CancelablePromise<ProformaInvoiceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/factures-proforma',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mettre à jour le statut d'une facture proforma
     * @param id
     * @param statut
     * @returns ProformaInvoiceResponse OK
     * @throws ApiError
     */
    public static updateStatut(
        id: string,
        statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE' | 'ANNULE' | 'CONVERTI_EN_FACTURE',
    ): CancelablePromise<ProformaInvoiceResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/factures-proforma/{id}/statut',
            path: {
                'id': id,
            },
            query: {
                'statut': statut,
            },
        });
    }
    /**
     * Récupérer une facture proforma par ID
     * @param id
     * @returns ProformaInvoiceResponse OK
     * @throws ApiError
     */
    public static getProformaById(
        id: string,
    ): CancelablePromise<ProformaInvoiceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures-proforma/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Supprimer une facture proforma
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteProforma(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/factures-proforma/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les factures proforma par client
     * @param idClient
     * @returns ProformaInvoiceResponse OK
     * @throws ApiError
     */
    public static getProformasByClient(
        idClient: string,
    ): CancelablePromise<Array<ProformaInvoiceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures-proforma/client/{idClient}',
            path: {
                'idClient': idClient,
            },
        });
    }
}
