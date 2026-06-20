/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SalesAgent = {
    id?: string;
    tenantId?: string;
    agencyId?: string;
    code?: string;
    name?: string;
    shortName?: string;
    description?: string;
    accountingAccount?: string;
    bankAccountNumber?: string;
    taxNumber?: string;
    tradeRegistryNumber?: string;
    vatNumber?: string;
    type?: SalesAgent.type;
    businessSector?: SalesAgent.businessSector;
    companySize?: SalesAgent.companySize;
    email?: string;
    phoneNumber?: string;
    website?: string;
    preferredChannel?: SalesAgent.preferredChannel;
    address?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    agentType?: SalesAgent.agentType;
    coveredZones?: string;
    specializations?: string;
    commission?: number;
    contractStartDate?: string;
    contractEndDate?: string;
};
export namespace SalesAgent {
    export enum type {
        INDIVIDUAL = 'INDIVIDUAL',
        COMPANY = 'COMPANY',
        RESELLER = 'RESELLER',
    }
    export enum businessSector {
        IT = 'IT',
        FINANCE = 'FINANCE',
        HEALTH = 'HEALTH',
        INDUSTRY = 'INDUSTRY',
        COMMERCE = 'COMMERCE',
    }
    export enum companySize {
        MICRO = 'MICRO',
        SME = 'SME',
        ETI = 'ETI',
        LARGE = 'LARGE',
    }
    export enum preferredChannel {
        EMAIL = 'EMAIL',
        PHONE = 'PHONE',
        MAIL = 'MAIL',
        IN_PERSON = 'IN_PERSON',
    }
    export enum agentType {
        INTERNAL = 'INTERNAL',
        EXTERNAL = 'EXTERNAL',
        INDEPENDENT = 'INDEPENDENT',
    }
}

