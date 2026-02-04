/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données requises pour créer ou mettre à jour une organisation
 */
export type CreateOrganizationRequest = {
    /**
     * Nom légal de l'organisation
     */
    name?: string;
    /**
     * Secteur d'activité
     */
    serviceType?: string;
    /**
     * Email de contact principal
     */
    email?: string;
    /**
     * Description courte de l'activité
     */
    description?: string;
};

