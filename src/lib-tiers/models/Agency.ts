/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PointOfInterest } from './PointOfInterest';
export type Agency = {
    id?: string;
    organizationId?: string;
    code?: string;
    name?: string;
    shortName?: string;
    longName?: string;
    type?: string;
    location?: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    ownerId?: string;
    managerId?: string;
    transferable?: boolean;
    isHeadquarter?: boolean;
    isActive?: boolean;
    isPublic?: boolean;
    isBusiness?: boolean;
    isIndividualBusiness?: boolean;
    logoUri?: string;
    logoId?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    socialNetwork?: string;
    greetingMessage?: string;
    description?: string;
    openTime?: string;
    closeTime?: string;
    averageRevenue?: number;
    capitalShare?: number;
    registrationNumber?: string;
    taxNumber?: string;
    keywords?: Array<string>;
    totalAffiliatedCustomers?: number;
    nearbyPoints?: Array<PointOfInterest>;
    createdAt?: string;
    updatedAt?: string;
};

