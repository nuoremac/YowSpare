/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Prospect = {
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
    type?: Prospect.type;
    businessSector?: Prospect.businessSector;
    companySize?: Prospect.companySize;
    email?: string;
    phoneNumber?: string;
    website?: string;
    preferredChannel?: Prospect.preferredChannel;
    address?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    source?: Prospect.source;
    potential?: Prospect.potential;
    probability?: number;
    conversionDate?: string;
    notes?: string;
};
export namespace Prospect {
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
    export enum source {
        WEBSITE = 'WEBSITE',
        SOCIAL_NETWORK = 'SOCIAL_NETWORK',
        EVENT = 'EVENT',
        RECOMMENDATION = 'RECOMMENDATION',
    }
    export enum potential {
        LOW = 'LOW',
        MEDIUM = 'MEDIUM',
        HIGH = 'HIGH',
        STRATEGIC = 'STRATEGIC',
    }
}

