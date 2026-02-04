/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateEmployeeRequest } from '../models/CreateEmployeeRequest';
import type { CreateRoleRequest } from '../models/CreateRoleRequest';
import type { OrganizationMember } from '../models/OrganizationMember';
import type { Role } from '../models/Role';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmployeesRolesService {
    /**
     * Lister les employés
     * Récupère la liste des employés de l'organisation courante. La visibilité dépend des droits de l'utilisateur (Owner/Admin voit tout, Manager voit son agence).
     * @returns OrganizationMember OK
     * @throws ApiError
     */
    public static getEmployees(): CancelablePromise<Array<OrganizationMember>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/employees',
        });
    }
    /**
     * Créer un nouvel employé
     * Crée un nouveau compte utilisateur et l'ajoute comme membre à l'organisation. Nécessite des droits RH.
     * @param requestBody
     * @returns OrganizationMember Employé créé avec succès
     * @throws ApiError
     */
    public static createEmployee(
        requestBody: CreateEmployeeRequest,
    ): CancelablePromise<OrganizationMember> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/employees',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lister tous les rôles
     * Récupère la liste de tous les rôles disponibles dans le système.
     * @returns Role OK
     * @throws ApiError
     */
    public static getRoles(): CancelablePromise<Array<Role>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/employees/roles',
        });
    }
    /**
     * Créer un nouveau rôle global
     * Crée un nouveau rôle réutilisable. Seul le propriétaire de l'organisation peut le faire.
     * @param requestBody
     * @returns Role OK
     * @throws ApiError
     */
    public static createRole(
        requestBody: CreateRoleRequest,
    ): CancelablePromise<Role> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/employees/roles',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Obtenir un employé par son ID de membre
     * @param id
     * @returns OrganizationMember Détails de l'employé
     * @throws ApiError
     */
    public static getEmployeeById(
        id: string,
    ): CancelablePromise<OrganizationMember> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/employees/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Employé non trouvé`,
            },
        });
    }
    /**
     * Supprimer un employé
     * Supprime le lien membre et le compte utilisateur associé. Nécessite des droits RH.
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static removeEmployee(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/employees/{id}',
            path: {
                'id': id,
            },
        });
    }
}
