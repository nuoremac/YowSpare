/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MaterialRequestItemInput } from './MaterialRequestItemInput';
export type CreateMaterialRequestRequest = {
    departmentId: string;
    reasonCode?: string;
    reasonText?: string;
    expectedReturnAt?: string;
    items: Array<MaterialRequestItemInput>;
};

