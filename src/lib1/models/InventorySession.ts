/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InventoryCount } from './InventoryCount';
export type InventorySession = {
    id?: string;
    organizationId?: string;
    agencyId?: string;
    reference?: string;
    description?: string;
    status?: InventorySession.status;
    startDate?: string;
    validatedDate?: string;
    validatedBy?: string;
    categoryIdScope?: string;
    counts?: Array<InventoryCount>;
};
export namespace InventorySession {
    export enum status {
        OPEN = 'OPEN',
        REVIEW = 'REVIEW',
        VALIDATED = 'VALIDATED',
        CANCELLED = 'CANCELLED',
    }
}

