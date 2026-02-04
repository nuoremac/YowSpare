/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type User = {
    id?: string;
    organizationId?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    businessActorId?: string;
    roles?: Array<string>;
    plan?: User.plan;
    onboardingStatus?: User.onboardingStatus;
    onboardingStep?: number;
    active?: boolean;
};
export namespace User {
    export enum plan {
        FREE_TIER = 'FREE_TIER',
        FREELANCE = 'FREELANCE',
        PROFESSIONAL = 'PROFESSIONAL',
    }
    export enum onboardingStatus {
        NOT_STARTED = 'NOT_STARTED',
        IN_PROGRESS = 'IN_PROGRESS',
        COMPLETED = 'COMPLETED',
    }
}

