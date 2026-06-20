/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DevisResponse } from './DevisResponse';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
export type PageDevisResponse = {
    totalElements?: number;
    totalPages?: number;
    size?: number;
    content?: Array<DevisResponse>;
    number?: number;
    sort?: SortObject;
    numberOfElements?: number;
    pageable?: PageableObject;
    first?: boolean;
    last?: boolean;
    empty?: boolean;
};

