/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateOrganizationRequest } from '../models/CreateOrganizationRequest';
import type { Organization } from '../models/Organization';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrganizationsService {
    /**
     * Créer une nouvelle organisation
     * Crée une nouvelle organisation pour l'utilisateur connecté, qui doit au préalable avoir créé son profil Business Actor.
     * @param requestBody
     * @returns Organization Organisation créée avec succès
     * @throws ApiError
     */
    public static createOrganization(
        requestBody: CreateOrganizationRequest,
    ): CancelablePromise<Organization> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/organizations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requête invalide ou prérequis non rempli (ex: pas de Business Actor)`,
                403: `Accès refusé (ex: le plan de l'utilisateur ne permet pas la création)`,
            },
        });
    }
    /**
     * Transférer la propriété d'une organisation
     * Transfère la propriété d'une organisation à un autre Business Actor. Seul le propriétaire actuel peut initier le transfert.
     * @param id
     * @param newOwnerId
     * @returns Organization OK
     * @throws ApiError
     */
    public static transferOwnership(
        id: string,
        newOwnerId: string,
    ): CancelablePromise<Organization> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/organizations/{id}/transfer/{newOwnerId}',
            path: {
                'id': id,
                'newOwnerId': newOwnerId,
            },
        });
    }
    /**
     * Obtenir une organisation par son ID
     * @param id
     * @returns Organization Détails de l'organisation
     * @throws ApiError
     */
    public static getOrganizationById(
        id: string,
    ): CancelablePromise<Organization> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/organizations/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Organisation non trouvée`,
            },
        });
    }
    /**
     * Mettre à jour une organisation (partiel)
     * Met à jour les informations d'une organisation. Seul le propriétaire peut effectuer cette action.
     * @param id
     * @param requestBody
     * @returns Organization OK
     * @throws ApiError
     */
    public static updateOrganization(
        id: string,
        requestBody: CreateOrganizationRequest,
    ): CancelablePromise<Organization> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/organizations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lister mes organisations
     * Récupère la liste des organisations dont l'utilisateur connecté est propriétaire.
     * @returns Organization OK
     * @throws ApiError
     */
    public static getMyOrganizations(): CancelablePromise<Array<Organization>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/organizations/my',
        });
    }
}
