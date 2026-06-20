/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Customer = {
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
    type?: Customer.type;
    businessSector?: Customer.businessSector;
    companySize?: Customer.companySize;
    email?: string;
    phoneNumber?: string;
    website?: string;
    preferredChannel?: Customer.preferredChannel;
    address?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    segment?: Customer.segment;
    creditLimit?: number;
    acquisitionChannel?: Customer.acquisitionChannel;
    customerVatNumber?: string;
    vatSubject?: boolean;
    retailSale?: boolean;
    semiWholesale?: boolean;
    wholesale?: boolean;
    superWholesale?: boolean;
    ohadaType?: Customer.ohadaType;
};
export namespace Customer {
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
    export enum segment {
        INDIVIDUAL = 'INDIVIDUAL',
        COMPANY = 'COMPANY',
        RESELLER = 'RESELLER',
    }
    export enum acquisitionChannel {
        WEB = 'WEB',
        NETWORK = 'NETWORK',
        RECOMMENDATION = 'RECOMMENDATION',
        PROSPECT_CONVERSION = 'PROSPECT_CONVERSION',
    }
    export enum ohadaType {
        ORDINARY = 'ORDINARY',
        STATE = 'STATE',
        GROUP = 'GROUP',
        DOUBTFUL = 'DOUBTFUL',
        MISC = 'MISC',
    }
}

