/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthRequest } from '../models/AuthRequest';
import type { AuthResponse } from '../models/AuthResponse';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Inscription d'un nouvel utilisateur
     * Crée un nouveau compte utilisateur 'orphelin' (non rattaché à une organisation).
     * @param requestBody
     * @returns User Utilisateur créé avec succès
     * @throws ApiError
     */
    public static register(
        requestBody: RegisterRequest,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `L'email est déjà utilisé pour un compte en attente`,
            },
        });
    }
    /**
     * Connexion d'un utilisateur
     * Authentifie un utilisateur avec son email et mot de passe, et retourne un token JWT ainsi que le profil utilisateur.
     * @param requestBody
     * @returns AuthResponse Connexion réussie
     * @throws ApiError
     */
    public static login(
        requestBody: AuthRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Identifiants invalides`,
            },
        });
    }
}
