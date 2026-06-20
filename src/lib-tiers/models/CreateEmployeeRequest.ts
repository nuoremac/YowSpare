/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données requises pour créer un nouvel employé
 */
export type CreateEmployeeRequest = {
    firstName?: string;
    lastName?: string;
    email?: string;
    /**
     * Mot de passe initial défini par le RH
     */
    password?: string;
    /**
     * ID du rôle à assigner
     */
    roleId?: string;
    /**
     * ID de l'agence de rattachement (optionnel)
     */
    agencyId?: string;
    /**
     * Liste d'ID de permissions pour créer un rôle personnalisé à la volée (optionnel)
     */
    permissionIds?: Array<string>;
};

