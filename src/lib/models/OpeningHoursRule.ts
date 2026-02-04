/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimeInterval } from './TimeInterval';
export type OpeningHoursRule = {
    id?: string;
    agencyId?: string;
    dayOfWeek?: OpeningHoursRule.dayOfWeek;
    intervals?: Array<TimeInterval>;
    closed?: boolean;
};
export namespace OpeningHoursRule {
    export enum dayOfWeek {
        MONDAY = 'MONDAY',
        TUESDAY = 'TUESDAY',
        WEDNESDAY = 'WEDNESDAY',
        THURSDAY = 'THURSDAY',
        FRIDAY = 'FRIDAY',
        SATURDAY = 'SATURDAY',
        SUNDAY = 'SUNDAY',
    }
}

