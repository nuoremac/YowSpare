/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateWorkflowRequest } from '../models/CreateWorkflowRequest';
import type { WorkflowRequestDto } from '../models/WorkflowRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkflowControllerService {
    /**
     * @param status
     * @param type
     * @returns WorkflowRequestDto OK
     * @throws ApiError
     */
    public static list(
        status?: string,
        type?: string,
    ): CancelablePromise<Array<WorkflowRequestDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/workflow/requests',
            query: {
                'status': status,
                'type': type,
            },
        });
    }
    /**
     * @param requestBody
     * @returns WorkflowRequestDto Created
     * @throws ApiError
     */
    public static create(
        requestBody: CreateWorkflowRequest,
    ): CancelablePromise<WorkflowRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/workflow/requests',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns WorkflowRequestDto OK
     * @throws ApiError
     */
    public static reject(
        id: string,
    ): CancelablePromise<WorkflowRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/workflow/requests/{id}/reject',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns WorkflowRequestDto OK
     * @throws ApiError
     */
    public static approve(
        id: string,
    ): CancelablePromise<WorkflowRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/workflow/requests/{id}/approve',
            path: {
                'id': id,
            },
        });
    }
}
