/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Agency } from '../models/Agency';
import type { AgencyRequest } from '../models/AgencyRequest';
import type { AgencySchedule } from '../models/AgencySchedule';
import type { OpeningHoursRule } from '../models/OpeningHoursRule';
import type { OpenStatus } from '../models/OpenStatus';
import type { SpecialOpeningHours } from '../models/SpecialOpeningHours';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgenciesService {
    /**
     * Mettre à jour les horaires réguliers
     * Remplace la totalité des horaires hebdomadaires pour une agence.
     * @param agencyId
     * @param requestBody
     * @returns OpeningHoursRule OK
     * @throws ApiError
     */
    public static updateRegularSchedule(
        agencyId: string,
        requestBody: Array<OpeningHoursRule>,
    ): CancelablePromise<Array<OpeningHoursRule>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/agencies/{agencyId}/schedule/regular',
            path: {
                'agencyId': agencyId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lister tous les entrepôts
     * Récupère la liste de toutes les agences de type 'WAREHOUSE'.
     * @returns Agency OK
     * @throws ApiError
     */
    public static getAllWarehouses(): CancelablePromise<Array<Agency>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/warehouses',
        });
    }
    /**
     * Créer un nouvel entrepôt
     * Raccourci pour créer une agence avec le type 'WAREHOUSE' prédéfini.
     * @param requestBody
     * @returns Agency OK
     * @throws ApiError
     */
    public static createWarehouse(
        requestBody: AgencyRequest,
    ): CancelablePromise<Agency> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/warehouses',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lister les agences de l'organisation
     * Récupère toutes les agences (siège, point de vente, entrepôt...) de l'organisation courante.
     * @returns Agency OK
     * @throws ApiError
     */
    public static getAgencies(): CancelablePromise<Array<Agency>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/agencies',
        });
    }
    /**
     * Créer une nouvelle agence
     * Crée une nouvelle agence dans l'organisation courante. Le type (HQ, WAREHOUSE, etc.) peut être spécifié.
     * @param requestBody
     * @returns Agency Agence créée
     * @throws ApiError
     */
    public static createAgency(
        requestBody: AgencyRequest,
    ): CancelablePromise<Agency> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/agencies',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Le plan de l'utilisateur ne permet pas de créer de nouvelles agences`,
            },
        });
    }
    /**
     * Ajouter une fermeture/ouverture exceptionnelle
     * @param agencyId
     * @param requestBody
     * @returns SpecialOpeningHours Exception ajoutée
     * @throws ApiError
     */
    public static addException(
        agencyId: string,
        requestBody: SpecialOpeningHours,
    ): CancelablePromise<SpecialOpeningHours> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/agencies/{agencyId}/schedule/exceptions',
            path: {
                'agencyId': agencyId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Date dans le passé`,
            },
        });
    }
    /**
     * Supprimer une agence
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteAgency(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/agencies/{id}',
            path: {
                'id': id,
            },
            errors: {
                409: `Impossible de supprimer (ex: l'agence a encore du stock, ou est un siège social)`,
            },
        });
    }
    /**
     * Mettre à jour une agence
     * Met à jour partiellement les informations d'une agence existante.
     * @param id
     * @param requestBody
     * @returns Agency Agence mise à jour
     * @throws ApiError
     */
    public static updateAgency(
        id: string,
        requestBody: AgencyRequest,
    ): CancelablePromise<Agency> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/agencies/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Obtenir le planning complet d'une agence
     * Retourne les horaires réguliers et les exceptions à venir.
     * @param agencyId
     * @returns AgencySchedule OK
     * @throws ApiError
     */
    public static getSchedule(
        agencyId: string,
    ): CancelablePromise<AgencySchedule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/agencies/{agencyId}/schedule',
            path: {
                'agencyId': agencyId,
            },
        });
    }
    /**
     * Vérifier si une agence est ouverte maintenant
     * Retourne le statut actuel (OUVERT/FERMÉ) en tenant compte du fuseau horaire de l'agence.
     * @param agencyId
     * @returns OpenStatus OK
     * @throws ApiError
     */
    public static getStatus(
        agencyId: string,
    ): CancelablePromise<OpenStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/agencies/{agencyId}/schedule/status',
            path: {
                'agencyId': agencyId,
            },
        });
    }
    /**
     * Supprimer une exception d'horaire
     * @param agencyId
     * @param exceptionId
     * @returns void
     * @throws ApiError
     */
    public static removeException(
        agencyId: string,
        exceptionId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/agencies/{agencyId}/schedule/exceptions/{exceptionId}',
            path: {
                'agencyId': agencyId,
                'exceptionId': exceptionId,
            },
        });
    }
}
