/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsRecommendationDto } from '../models/AnalyticsRecommendationDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsControllerService {
    /**
     * @param agencyId
     * @param days
     * @returns AnalyticsRecommendationDto OK
     * @throws ApiError
     */
    public static recompute(
        agencyId: string,
        days: number = 30,
    ): CancelablePromise<Array<AnalyticsRecommendationDto>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/analytics/reorder-recommendations/recompute',
            query: {
                'agencyId': agencyId,
                'days': days,
            },
        });
    }
    /**
     * @param agencyId
     * @returns AnalyticsRecommendationDto OK
     * @throws ApiError
     */
    public static list3(
        agencyId: string,
    ): CancelablePromise<Array<AnalyticsRecommendationDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/reorder-recommendations',
            query: {
                'agencyId': agencyId,
            },
        });
    }
}
