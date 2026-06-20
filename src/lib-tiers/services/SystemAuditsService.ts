/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemAudit } from '../models/SystemAudit';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemAuditsService {
    /**
     * Consulter l'activité de l'organisation
     * Récupère les dernières actions effectuées au sein de l'organisation courante (définie par X-Tenant-ID).
     * @param limit Nombre maximum d'entrées à retourner
     * @returns SystemAudit OK
     * @throws ApiError
     */
    public static getOrganizationActivity(
        limit: number = 50,
    ): CancelablePromise<Array<SystemAudit>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system-audits/organization',
            query: {
                'limit': limit,
            },
        });
    }
    /**
     * Consulter mon activité récente
     * Récupère les dernières actions effectuées par l'utilisateur connecté.
     * @param limit Nombre maximum d'entrées à retourner
     * @returns SystemAudit OK
     * @throws ApiError
     */
    public static getMyActivity(
        limit: number = 50,
    ): CancelablePromise<Array<SystemAudit>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system-audits/me',
            query: {
                'limit': limit,
            },
        });
    }
}
