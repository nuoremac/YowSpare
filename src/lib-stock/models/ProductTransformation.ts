/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TransformationItem } from './TransformationItem';
export type ProductTransformation = {
    id?: string;
    organizationId?: string;
    agencyId?: string;
    reference?: string;
    status?: ProductTransformation.status;
    description?: string;
    date?: string;
    inputs?: Array<TransformationItem>;
    outputs?: Array<TransformationItem>;
    createdAt?: string;
    updatedAt?: string;
};
export namespace ProductTransformation {
    export enum status {
        DRAFT = 'DRAFT',
        VALIDATED = 'VALIDATED',
        CANCELLED = 'CANCELLED',
    }
}

