/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BonLivraisonRequest } from '../models/BonLivraisonRequest';
import type { BonLivraisonResponse } from '../models/BonLivraisonResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BonDeLivraisonService {
    /**
     * Lister tous les bons de livraison
     * @returns BonLivraisonResponse OK
     * @throws ApiError
     */
    public static getAllBonLivraisons(): CancelablePromise<Array<BonLivraisonResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bons-livraison',
        });
    }
    /**
     * Créer un nouveau bon de livraison
     * @param requestBody
     * @returns BonLivraisonResponse OK
     * @throws ApiError
     */
    public static createBonLivraison(
        requestBody: BonLivraisonRequest,
    ): CancelablePromise<BonLivraisonResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bons-livraison',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Marquer une livraison comme effectuée
     * @param id
     * @returns BonLivraisonResponse OK
     * @throws ApiError
     */
    public static marquerCommeEffectuee(
        id: string,
    ): CancelablePromise<BonLivraisonResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bons-livraison/{id}/effectuer',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Mettre à jour le statut d'un bon de livraison
     * @param id
     * @param statut
     * @returns BonLivraisonResponse OK
     * @throws ApiError
     */
    public static updateStatut1(
        id: string,
        statut: 'EN_PREPARATION' | 'PRET_A_EXPEDIER' | 'EXPEDIE' | 'LIVRE' | 'RETOURNE' | 'ANNULE',
    ): CancelablePromise<BonLivraisonResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/bons-livraison/{id}/statut',
            path: {
                'id': id,
            },
            query: {
                'statut': statut,
            },
        });
    }
    /**
     * Récupérer un bon de livraison par ID
     * @param id
     * @returns BonLivraisonResponse OK
     * @throws ApiError
     */
    public static getBonLivraisonById(
        id: string,
    ): CancelablePromise<BonLivraisonResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bons-livraison/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Supprimer un bon de livraison
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteBonLivraison(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bons-livraison/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les bons de livraison par client
     * @param idClient
     * @returns BonLivraisonResponse OK
     * @throws ApiError
     */
    public static getBonLivraisonsByClient(
        idClient: string,
    ): CancelablePromise<Array<BonLivraisonResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bons-livraison/client/{idClient}',
            path: {
                'idClient': idClient,
            },
        });
    }
}
