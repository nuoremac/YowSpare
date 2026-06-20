/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MaterialRequestItemDto } from './MaterialRequestItemDto';
export type MaterialRequestDto = {
    id?: string;
    agencyId?: string;
    departmentId?: string;
    status?: string;
    reasonCode?: string;
    reasonText?: string;
    requestedBy?: string;
    approvedBy?: string;
    approvedAt?: string;
    issuedBy?: string;
    issuedAt?: string;
    expectedReturnAt?: string;
    closedBy?: string;
    closedAt?: string;
    closeReason?: string;
    updatedAt?: string;
    items?: Array<MaterialRequestItemDto>;
};

