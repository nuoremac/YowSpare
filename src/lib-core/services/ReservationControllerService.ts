/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailabilityRowDto } from '../models/AvailabilityRowDto';
import type { CreateReservationRequest } from '../models/CreateReservationRequest';
import type { ReservationDto } from '../models/ReservationDto';
import type { UpdateReservationStatusRequest } from '../models/UpdateReservationStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReservationControllerService {
    /**
     * @param agencyId
     * @param productId
     * @param status
     * @returns ReservationDto OK
     * @throws ApiError
     */
    public static list2(
        agencyId?: string,
        productId?: string,
        status?: string,
    ): CancelablePromise<Array<ReservationDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reservations',
            query: {
                'agencyId': agencyId,
                'productId': productId,
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ReservationDto Created
     * @throws ApiError
     */
    public static create2(
        requestBody: CreateReservationRequest,
    ): CancelablePromise<ReservationDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reservations',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ReservationDto OK
     * @throws ApiError
     */
    public static updateStatus(
        id: string,
        requestBody: UpdateReservationStatusRequest,
    ): CancelablePromise<ReservationDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/reservations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param agencyId
     * @returns AvailabilityRowDto OK
     * @throws ApiError
     */
    public static availability(
        agencyId: string,
    ): CancelablePromise<Array<AvailabilityRowDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/availability',
            query: {
                'agencyId': agencyId,
            },
        });
    }
}
