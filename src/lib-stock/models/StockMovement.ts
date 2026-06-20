/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockMovementItem } from './StockMovementItem';
export type StockMovement = {
    id?: string;
    organizationId?: string;
    reference?: string;
    type?: StockMovement.type;
    status?: StockMovement.status;
    date?: string;
    sourceAgencyId?: string;
    destinationAgencyId?: string;
    thirdPartyId?: string;
    notes?: string;
    createdBy?: string;
    validatedBy?: string;
    validatedAt?: string;
    items?: Array<StockMovementItem>;
};
export namespace StockMovement {
    export enum type {
        IN = 'IN',
        OUT = 'OUT',
        TRANSFER = 'TRANSFER',
        ADJUSTMENT = 'ADJUSTMENT',
    }
    export enum status {
        DRAFT = 'DRAFT',
        VALIDATED = 'VALIDATED',
        CANCELLED = 'CANCELLED',
    }
}

