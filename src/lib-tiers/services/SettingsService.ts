/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgencySettings } from '../models/AgencySettings';
import type { AgencySettingsRequest } from '../models/AgencySettingsRequest';
import type { AppBusinessSettings } from '../models/AppBusinessSettings';
import type { AppBusinessSettingsRequest } from '../models/AppBusinessSettingsRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsService {
    /**
     * Obtenir les paramètres globaux de l'organisation
     * @returns AppBusinessSettings Paramètres de l'organisation
     * @throws ApiError
     */
    public static getGlobalOptions(): CancelablePromise<AppBusinessSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/global',
        });
    }
    /**
     * Mettre à jour les paramètres globaux
     * Nécessite des droits d'administration globale.
     * @param requestBody
     * @returns AppBusinessSettings Paramètres mis à jour
     * @throws ApiError
     */
    public static updateGlobalOptions(
        requestBody: AppBusinessSettingsRequest,
    ): CancelablePromise<AppBusinessSettings> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/settings/global',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Accès refusé`,
            },
        });
    }
    /**
     * Obtenir les paramètres d'une agence
     * @param agencyId
     * @returns AgencySettings Paramètres de l'agence
     * @throws ApiError
     */
    public static getAgencyOptions(
        agencyId: string,
    ): CancelablePromise<AgencySettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/agency/{agencyId}',
            path: {
                'agencyId': agencyId,
            },
        });
    }
    /**
     * Mettre à jour les paramètres d'une agence
     * Nécessite des droits de gestion sur l'agence.
     * @param agencyId
     * @param requestBody
     * @returns AgencySettings Paramètres mis à jour
     * @throws ApiError
     */
    public static updateAgencyOptions(
        agencyId: string,
        requestBody: AgencySettingsRequest,
    ): CancelablePromise<AgencySettings> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/settings/agency/{agencyId}',
            path: {
                'agencyId': agencyId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Accès refusé`,
            },
        });
    }
}
