/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusinessActor } from '../models/BusinessActor';
import type { BusinessActorRequest } from '../models/BusinessActorRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusinessActorsService {
    /**
     * Obtenir son profil Business Actor
     * Récupère les détails du profil Business Actor associé à l'utilisateur connecté.
     * @returns BusinessActor Profil Business Actor
     * @throws ApiError
     */
    public static getMyProfile(): CancelablePromise<BusinessActor> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actors/me',
            errors: {
                404: `Aucun profil Business Actor trouvé pour cet utilisateur`,
            },
        });
    }
    /**
     * Mettre à jour son profil Business Actor
     * @param requestBody
     * @returns BusinessActor Profil mis à jour
     * @throws ApiError
     */
    public static updateProfile(
        requestBody: BusinessActorRequest,
    ): CancelablePromise<BusinessActor> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/actors/me',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Créer son profil Business Actor
     * Étape d'onboarding où l'utilisateur (futur propriétaire) enregistre ses informations légales. Prérequis à la création d'organisation.
     * @param requestBody
     * @returns BusinessActor Profil Business Actor créé avec succès
     * @throws ApiError
     */
    public static onboardUser(
        requestBody: BusinessActorRequest,
    ): CancelablePromise<BusinessActor> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/actors/onboarding',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Utilisateur déjà lié à un Business Actor`,
            },
        });
    }
}
