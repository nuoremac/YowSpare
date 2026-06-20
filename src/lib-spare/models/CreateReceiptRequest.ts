/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateReceiptLineRequest } from './CreateReceiptLineRequest';
export type CreateReceiptRequest = {
    poId: string;
    agencyId: string;
    note?: string;
    lines: Array<CreateReceiptLineRequest>;
};
