/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Données requises pour créer ou mettre à jour une organisation
 */
export type CreateOrganizationRequest = {
    businessActorId?: string;
    code?: string;
    service?: string;
    organizationType?: string;
    isIndividualBusiness?: boolean;
    /**
     * Nom légal de l'organisation
     */
    name?: string;
    shortName?: string;
    longName?: string;
    displayName?: string;
    legalName?: string;
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
    /**
     * URL publique du logo de l'organisation
     */
    logoUri?: string;
    /**
     * Identifiant du fichier logo stocké
     */
    logoId?: string;
    websiteUrl?: string;
    socialNetwork?: string;
    businessRegistrationNumber?: string;
    taxNumber?: string;
    capitalShare?: number;
    ceoName?: string;
    yearFounded?: number;
    keywords?: Array<string>;
    numberOfEmployees?: number;
    legalForm?: string;
    isActive?: boolean;
    status?: string;
};
