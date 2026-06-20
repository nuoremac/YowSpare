/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TransformationItem = {
    id?: string;
    productId?: string;
    productName?: string;
    type?: TransformationItem.type;
    quantity?: number;
};
export namespace TransformationItem {
    export enum type {
        INPUT = 'INPUT',
        OUTPUT = 'OUTPUT',
    }
}

