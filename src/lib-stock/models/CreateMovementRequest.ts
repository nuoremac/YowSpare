/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateItemRequest } from './CreateItemRequest';
export type CreateMovementRequest = {
    /**
     * IN, OUT, TRANSFER
     */
    type?: string;
    sourceAgencyId?: string;
    destinationAgencyId?: string;
    thirdPartyId?: string;
    notes?: string;
    items?: Array<CreateItemRequest>;
};

