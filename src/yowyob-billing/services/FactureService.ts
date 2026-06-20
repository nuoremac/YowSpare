/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FactureCreateRequest } from '../models/FactureCreateRequest';
import type { FactureResponse } from '../models/FactureResponse';
import type { Pageable } from '../models/Pageable';
import type { PageFactureResponse } from '../models/PageFactureResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FactureService {
    /**
     * Récupérer une facture par ID
     * @param factureId
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFactureById(
        factureId: string,
    ): CancelablePromise<FactureResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/{factureId}',
            path: {
                'factureId': factureId,
            },
        });
    }
    /**
     * Mettre à jour une facture
     * @param factureId
     * @param requestBody
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static updateFacture(
        factureId: string,
        requestBody: FactureCreateRequest,
    ): CancelablePromise<FactureResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/factures/{factureId}',
            path: {
                'factureId': factureId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer une facture
     * @param factureId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteFacture(
        factureId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/factures/{factureId}',
            path: {
                'factureId': factureId,
            },
        });
    }
    /**
     * Enregistrer un paiement pour une facture
     * @param factureId
     * @param montantPaye
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static enregistrerPaiement(
        factureId: string,
        montantPaye: number,
    ): CancelablePromise<FactureResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/factures/{factureId}/paiement',
            path: {
                'factureId': factureId,
            },
            query: {
                'montantPaye': montantPaye,
            },
        });
    }
    /**
     * Marquer une facture comme payée
     * @param factureId
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static marquerCommePaye(
        factureId: string,
    ): CancelablePromise<FactureResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/factures/{factureId}/marquer-paye',
            path: {
                'factureId': factureId,
            },
        });
    }
    /**
     * Récupérer toutes les factures
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getAllFactures(): CancelablePromise<Array<FactureResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures',
        });
    }
    /**
     * Créer une nouvelle facture
     * @param requestBody
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static createFacture(
        requestBody: FactureCreateRequest,
    ): CancelablePromise<FactureResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/factures',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer les factures en retard
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFacturesEnRetard(): CancelablePromise<Array<FactureResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/retard',
        });
    }
    /**
     * Récupérer les factures par période
     * @param dateDebut
     * @param dateFin
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFacturesByPeriode(
        dateDebut: string,
        dateFin: string,
    ): CancelablePromise<Array<FactureResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/periode',
            query: {
                'dateDebut': dateDebut,
                'dateFin': dateFin,
            },
        });
    }
    /**
     * Récupérer toutes les factures avec pagination
     * @param pageable
     * @returns PageFactureResponse OK
     * @throws ApiError
     */
    public static getAllFacturesPaginated(
        pageable: Pageable,
    ): CancelablePromise<PageFactureResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/paginated',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Récupérer une facture par numéro
     * @param numeroFacture
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFactureByNumero(
        numeroFacture: string,
    ): CancelablePromise<FactureResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/numero/{numeroFacture}',
            path: {
                'numeroFacture': numeroFacture,
            },
        });
    }
    /**
     * Récupérer les factures non payées
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFacturesNonPayees(): CancelablePromise<Array<FactureResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/non-payees',
        });
    }
    /**
     * Récupérer les factures par état
     * @param etat
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFacturesByEtat(
        etat: 'BROUILLON' | 'ENVOYE' | 'PAYE' | 'PARTIELLEMENT_PAYE' | 'EN_RETARD' | 'ANNULE' | 'EN_ATTENTE',
    ): CancelablePromise<Array<FactureResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/etat/{etat}',
            path: {
                'etat': etat,
            },
        });
    }
    /**
     * Compter les factures par état
     * @param etat
     * @returns number OK
     * @throws ApiError
     */
    public static countByEtat(
        etat: 'BROUILLON' | 'ENVOYE' | 'PAYE' | 'PARTIELLEMENT_PAYE' | 'EN_RETARD' | 'ANNULE' | 'EN_ATTENTE',
    ): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/count/etat/{etat}',
            path: {
                'etat': etat,
            },
        });
    }
    /**
     * Récupérer les factures d'un client
     * @param clientId
     * @returns FactureResponse OK
     * @throws ApiError
     */
    public static getFacturesByClient(
        clientId: string,
    ): CancelablePromise<Array<FactureResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/factures/client/{clientId}',
            path: {
                'clientId': clientId,
            },
        });
    }
}
