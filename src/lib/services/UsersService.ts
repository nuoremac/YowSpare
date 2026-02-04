/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateOnboardingRequest } from '../models/UpdateOnboardingRequest';
import type { UpdatePlanRequest } from '../models/UpdatePlanRequest';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Mettre à jour mon plan d'abonnement
     * Permet à l'utilisateur de changer son plan (ex: passer de FREE_TIER à FREELANCE).
     * @param requestBody
     * @returns User OK
     * @throws ApiError
     */
    public static updateMyPlan(
        requestBody: UpdatePlanRequest,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/users/me/plan',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mettre à jour mon étape d'onboarding
     * Met à jour l'étape et le statut du processus d'intégration.
     * @param requestBody
     * @returns User OK
     * @throws ApiError
     */
    public static updateOnboarding(
        requestBody: UpdateOnboardingRequest,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/users/me/onboarding',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Obtenir mon profil
     * Récupère les informations complètes de l'utilisateur actuellement authentifié.
     * @returns User Profil utilisateur
     * @throws ApiError
     */
    public static getMe(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me',
        });
    }
}
