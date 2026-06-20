/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NoteCreditRequest } from '../models/NoteCreditRequest';
import type { NoteCreditResponse } from '../models/NoteCreditResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NoteCreditControllerService {
    /**
     * @param id
     * @returns NoteCreditResponse OK
     * @throws ApiError
     */
    public static getNoteCreditById(
        id: string,
    ): CancelablePromise<NoteCreditResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/facturation/note-credits/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns NoteCreditResponse OK
     * @throws ApiError
     */
    public static updateNoteCredit(
        id: string,
        requestBody: NoteCreditRequest,
    ): CancelablePromise<NoteCreditResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/facturation/note-credits/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteNoteCredit(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/facturation/note-credits/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns NoteCreditResponse OK
     * @throws ApiError
     */
    public static getAllNoteCredits(): CancelablePromise<Array<NoteCreditResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/facturation/note-credits',
        });
    }
    /**
     * @param requestBody
     * @returns NoteCreditResponse OK
     * @throws ApiError
     */
    public static createNoteCredit(
        requestBody: NoteCreditRequest,
    ): CancelablePromise<NoteCreditResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/facturation/note-credits',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
