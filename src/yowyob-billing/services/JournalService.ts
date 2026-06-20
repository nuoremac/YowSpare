/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JournalCreateRequest } from '../models/JournalCreateRequest';
import type { JournalResponse } from '../models/JournalResponse';
import type { JournalUpdateRequest } from '../models/JournalUpdateRequest';
import type { Pageable } from '../models/Pageable';
import type { PageJournalResponse } from '../models/PageJournalResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JournalService {
    /**
     * Récupérer un journal par ID
     * @param journalId
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static getJournalById(
        journalId: string,
    ): CancelablePromise<JournalResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals/{journalId}',
            path: {
                'journalId': journalId,
            },
        });
    }
    /**
     * Mettre à jour un journal
     * @param journalId
     * @param requestBody
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static updateJournal(
        journalId: string,
        requestBody: JournalUpdateRequest,
    ): CancelablePromise<JournalResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/journals/{journalId}',
            path: {
                'journalId': journalId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un journal
     * @param journalId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteJournal(
        journalId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/journals/{journalId}',
            path: {
                'journalId': journalId,
            },
        });
    }
    /**
     * Récupérer tous les journals
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static getAllJournals(): CancelablePromise<Array<JournalResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals',
        });
    }
    /**
     * Créer un nouveau journal
     * @param requestBody
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static createJournal(
        requestBody: JournalCreateRequest,
    ): CancelablePromise<JournalResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/journals',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer les journals par type
     * @param type
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static getJournalsByType(
        type: string,
    ): CancelablePromise<Array<JournalResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals/type/{type}',
            path: {
                'type': type,
            },
        });
    }
    /**
     * Rechercher des journals par nom
     * @param nom
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static searchJournalsByNom(
        nom: string,
    ): CancelablePromise<Array<JournalResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals/search',
            query: {
                'nom': nom,
            },
        });
    }
    /**
     * Récupérer tous les journals avec pagination
     * @param pageable
     * @returns PageJournalResponse OK
     * @throws ApiError
     */
    public static getAllJournalsPaginated(
        pageable: Pageable,
    ): CancelablePromise<PageJournalResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals/page',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Récupérer un journal par nom
     * @param nomJournal
     * @returns JournalResponse OK
     * @throws ApiError
     */
    public static getJournalByNom(
        nomJournal: string,
    ): CancelablePromise<JournalResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals/nom/{nomJournal}',
            path: {
                'nomJournal': nomJournal,
            },
        });
    }
    /**
     * Compter les journals par type
     * @param type
     * @returns number OK
     * @throws ApiError
     */
    public static countByType1(
        type: string,
    ): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/journals/count/type/{type}',
            path: {
                'type': type,
            },
        });
    }
}
