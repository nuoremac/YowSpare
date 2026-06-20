/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Supplier = {
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
    type?: Supplier.type;
    businessSector?: Supplier.businessSector;
    companySize?: Supplier.companySize;
    email?: string;
    phoneNumber?: string;
    website?: string;
    preferredChannel?: Supplier.preferredChannel;
    address?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    paymentMode?: Supplier.paymentMode;
    mainProductType?: Supplier.mainProductType;
    deliveryLeadTime?: string;
    certification?: string;
};
export namespace Supplier {
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
    export enum paymentMode {
        TRANSFER = 'TRANSFER',
        CHECK = 'CHECK',
        DRAFT = 'DRAFT',
    }
    export enum mainProductType {
        ELECTRONICS = 'ELECTRONICS',
        HARDWARE = 'HARDWARE',
        SOFTWARE = 'SOFTWARE',
    }
}

