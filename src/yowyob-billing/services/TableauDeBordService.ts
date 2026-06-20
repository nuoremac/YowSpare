/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TableauDeBordResponse } from '../models/TableauDeBordResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TableauDeBordService {
    /**
     * Obtenir le tableau de bord complet
     * @returns TableauDeBordResponse OK
     * @throws ApiError
     */
    public static getTableauDeBord(): CancelablePromise<TableauDeBordResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tableau-de-bord',
        });
    }
}
