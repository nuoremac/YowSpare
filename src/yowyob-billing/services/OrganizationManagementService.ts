/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationCreateRequest } from '../models/OrganizationCreateRequest';
import type { OrganizationResponse } from '../models/OrganizationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrganizationManagementService {
    /**
     * Create new organization
     * Creates a new organization and assigns creator as OWNER
     * @param creatorUserId
     * @param requestBody
     * @returns OrganizationResponse OK
     * @throws ApiError
     */
    public static createOrganization(
        creatorUserId: string,
        requestBody: OrganizationCreateRequest,
    ): CancelablePromise<OrganizationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/organizations/create',
            query: {
                'creatorUserId': creatorUserId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get organization by ID
     * @param id
     * @returns OrganizationResponse OK
     * @throws ApiError
     */
    public static getOrganization(
        id: string,
    ): CancelablePromise<OrganizationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/organizations/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get user's organizations
     * Retrieves all organizations the user is a member of
     * @param userId
     * @returns OrganizationResponse OK
     * @throws ApiError
     */
    public static getUserOrganizations(
        userId: string,
    ): CancelablePromise<Array<OrganizationResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/organizations/user/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
