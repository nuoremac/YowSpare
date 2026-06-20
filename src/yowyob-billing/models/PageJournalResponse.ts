/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JournalResponse } from './JournalResponse';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
export type PageJournalResponse = {
    totalElements?: number;
    totalPages?: number;
    size?: number;
    content?: Array<JournalResponse>;
    number?: number;
    sort?: SortObject;
    numberOfElements?: number;
    pageable?: PageableObject;
    first?: boolean;
    last?: boolean;
    empty?: boolean;
};

