/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DevisCreateRequest } from '../models/DevisCreateRequest';
import type { DevisResponse } from '../models/DevisResponse';
import type { Pageable } from '../models/Pageable';
import type { PageDevisResponse } from '../models/PageDevisResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DevisService {
    /**
     * Récupérer un devis par ID
     * @param devisId
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getDevisById(
        devisId: string,
    ): CancelablePromise<DevisResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/{devisId}',
            path: {
                'devisId': devisId,
            },
        });
    }
    /**
     * Mettre à jour un devis
     * @param devisId
     * @param requestBody
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static updateDevis(
        devisId: string,
        requestBody: DevisCreateRequest,
    ): CancelablePromise<DevisResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/devis/{devisId}',
            path: {
                'devisId': devisId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un devis
     * @param devisId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteDevis(
        devisId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/devis/{devisId}',
            path: {
                'devisId': devisId,
            },
        });
    }
    /**
     * Refuser un devis
     * @param devisId
     * @param motifRefus
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static refuserDevis(
        devisId: string,
        motifRefus?: string,
    ): CancelablePromise<DevisResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/devis/{devisId}/refuser',
            path: {
                'devisId': devisId,
            },
            query: {
                'motifRefus': motifRefus,
            },
        });
    }
    /**
     * Accepter un devis
     * @param devisId
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static accepterDevis(
        devisId: string,
    ): CancelablePromise<DevisResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/devis/{devisId}/accepter',
            path: {
                'devisId': devisId,
            },
        });
    }
    /**
     * Récupérer tous les devis
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getAllDevis(): CancelablePromise<Array<DevisResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis',
        });
    }
    /**
     * Créer un nouveau devis
     * @param requestBody
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static createDevis(
        requestBody: DevisCreateRequest,
    ): CancelablePromise<DevisResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/devis',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer les devis par statut
     * @param statut
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getDevisByStatut(
        statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE' | 'ANNULE' | 'CONVERTI_EN_FACTURE',
    ): CancelablePromise<Array<DevisResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/statut/{statut}',
            path: {
                'statut': statut,
            },
        });
    }
    /**
     * Récupérer les devis par période
     * @param dateDebut
     * @param dateFin
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getDevisByPeriode(
        dateDebut: string,
        dateFin: string,
    ): CancelablePromise<Array<DevisResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/periode',
            query: {
                'dateDebut': dateDebut,
                'dateFin': dateFin,
            },
        });
    }
    /**
     * Récupérer tous les devis avec pagination
     * @param pageable
     * @returns PageDevisResponse OK
     * @throws ApiError
     */
    public static getAllDevisPaginated(
        pageable: Pageable,
    ): CancelablePromise<PageDevisResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/paginated',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Récupérer un devis par numéro
     * @param numeroDevis
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getDevisByNumero(
        numeroDevis: string,
    ): CancelablePromise<DevisResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/numero/{numeroDevis}',
            path: {
                'numeroDevis': numeroDevis,
            },
        });
    }
    /**
     * Récupérer les devis expirés
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getDevisExpires(): CancelablePromise<Array<DevisResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/expires',
        });
    }
    /**
     * Récupérer les devis d'un client
     * @param clientId
     * @returns DevisResponse OK
     * @throws ApiError
     */
    public static getDevisByClient(
        clientId: string,
    ): CancelablePromise<Array<DevisResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/devis/client/{clientId}',
            path: {
                'clientId': clientId,
            },
        });
    }
}
