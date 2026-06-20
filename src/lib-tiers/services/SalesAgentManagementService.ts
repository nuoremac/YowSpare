/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SalesAgent } from '../models/SalesAgent';
import type { ThirdPartyStatistics } from '../models/ThirdPartyStatistics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SalesAgentManagementService {
    /**
     * Get a sales agent by ID
     * @param id
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static getAgent(
        id: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-agents/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing sales agent
     * @param id
     * @param requestBody
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static updateAgent(
        id: string,
        requestBody: SalesAgent,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sales-agents/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a sales agent
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteSalesAgent(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/sales-agents/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all sales agents for the current tenant
     * @param xTenantId
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static getAllAgents(
        xTenantId: string,
    ): CancelablePromise<Array<SalesAgent>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-agents',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Create a new sales agent
     * @param xTenantId
     * @param requestBody
     * @returns SalesAgent Created
     * @throws ApiError
     */
    public static createAgent(
        xTenantId: string,
        requestBody: SalesAgent,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales-agents',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate a sales agent
     * @param id
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static deactivateAgent(
        id: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sales-agents/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update bank account number for a sales agent
     * @param id
     * @param requestBody
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static defineBankAccount1(
        id: string,
        requestBody: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sales-agents/{id}/bank-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Activate a sales agent
     * @param id
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static activateAgent(
        id: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sales-agents/{id}/activate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update accounting account number for a sales agent
     * @param id
     * @param requestBody
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static defineAccountingAccount1(
        id: string,
        requestBody: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sales-agents/{id}/accounting-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get sales agent statistics
     * @param xTenantId
     * @returns ThirdPartyStatistics OK
     * @throws ApiError
     */
    public static getAgentStatistics(
        xTenantId: string,
    ): CancelablePromise<ThirdPartyStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-agents/statistics',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Find sales agent by bank account number
     * @param bankAccountNumber
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static findByBankAccountNumber1(
        bankAccountNumber: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-agents/by-bank-account/{bankAccountNumber}',
            path: {
                'bankAccountNumber': bankAccountNumber,
            },
        });
    }
    /**
     * Find sales agent by accounting account number
     * @param accountingAccount
     * @returns SalesAgent OK
     * @throws ApiError
     */
    public static findByAccountingAccount1(
        accountingAccount: string,
    ): CancelablePromise<SalesAgent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-agents/by-accounting-account/{accountingAccount}',
            path: {
                'accountingAccount': accountingAccount,
            },
        });
    }
}
