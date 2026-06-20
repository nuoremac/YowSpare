/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Link } from '../models/Link';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActuatorService {
    /**
     * Actuator web endpoint 'health-path'
     * @param path
     * @returns any OK
     * @throws ApiError
     */
    public static healthPath(
        path: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actuator/health/{*path}',
            path: {
                '*path': path,
            },
        });
    }
    /**
     * Actuator web endpoint 'health'
     * @returns any OK
     * @throws ApiError
     */
    public static health(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actuator/health',
        });
    }
    /**
     * Actuator root web endpoint
     * @returns Link OK
     * @throws ApiError
     */
    public static links(): CancelablePromise<Record<string, Record<string, Link>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/actuator',
        });
    }
}
