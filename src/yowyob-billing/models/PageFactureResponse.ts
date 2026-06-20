/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FactureResponse } from './FactureResponse';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
export type PageFactureResponse = {
    totalElements?: number;
    totalPages?: number;
    size?: number;
    content?: Array<FactureResponse>;
    number?: number;
    sort?: SortObject;
    numberOfElements?: number;
    pageable?: PageableObject;
    first?: boolean;
    last?: boolean;
    empty?: boolean;
};

