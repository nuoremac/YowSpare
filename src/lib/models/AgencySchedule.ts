/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OpeningHoursRule } from './OpeningHoursRule';
import type { SpecialOpeningHours } from './SpecialOpeningHours';
export type AgencySchedule = {
    agencyName?: string;
    timezone?: string;
    regularRules?: Array<OpeningHoursRule>;
    upcomingExceptions?: Array<SpecialOpeningHours>;
};

