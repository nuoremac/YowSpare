/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Customer } from '../models/Customer';
import type { Prospect } from '../models/Prospect';
import type { ThirdPartyStatistics } from '../models/ThirdPartyStatistics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProspectManagementService {
    /**
     * Get a prospect by ID
     * @param id
     * @returns Prospect OK
     * @throws ApiError
     */
    public static getProspect(
        id: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prospects/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing prospect
     * @param id
     * @param requestBody
     * @returns Prospect OK
     * @throws ApiError
     */
    public static updateProspect(
        id: string,
        requestBody: Prospect,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/prospects/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a prospect
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteProspect(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/prospects/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all prospects for the current tenant
     * @param xTenantId
     * @returns Prospect OK
     * @throws ApiError
     */
    public static getAllProspects(
        xTenantId: string,
    ): CancelablePromise<Array<Prospect>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prospects',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Create a new prospect
     * @param xTenantId
     * @param requestBody
     * @returns Prospect Created
     * @throws ApiError
     */
    public static createProspect(
        xTenantId: string,
        requestBody: Prospect,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prospects',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Convert a prospect to a customer
     * @param id
     * @returns Customer Created
     * @throws ApiError
     */
    public static convertProspectToCustomer(
        id: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prospects/{id}/convert',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Deactivate a prospect
     * @param id
     * @returns Prospect OK
     * @throws ApiError
     */
    public static deactivateProspect(
        id: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/prospects/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update bank account number for a prospect
     * @param id
     * @param requestBody
     * @returns Prospect OK
     * @throws ApiError
     */
    public static defineBankAccount2(
        id: string,
        requestBody: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/prospects/{id}/bank-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Activate a prospect
     * @param id
     * @returns Prospect OK
     * @throws ApiError
     */
    public static activateProspect(
        id: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/prospects/{id}/activate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update accounting account number for a prospect
     * @param id
     * @param requestBody
     * @returns Prospect OK
     * @throws ApiError
     */
    public static defineAccountingAccount2(
        id: string,
        requestBody: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/prospects/{id}/accounting-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get prospect statistics
     * @param xTenantId
     * @returns ThirdPartyStatistics OK
     * @throws ApiError
     */
    public static getProspectStatistics(
        xTenantId: string,
    ): CancelablePromise<ThirdPartyStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prospects/statistics',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Get count of converted prospects
     * @param xTenantId
     * @returns number OK
     * @throws ApiError
     */
    public static getProspectConversionCount(
        xTenantId: string,
    ): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prospects/statistics/conversions',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Find prospect by bank account number
     * @param bankAccountNumber
     * @returns Prospect OK
     * @throws ApiError
     */
    public static findByBankAccountNumber2(
        bankAccountNumber: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prospects/by-bank-account/{bankAccountNumber}',
            path: {
                'bankAccountNumber': bankAccountNumber,
            },
        });
    }
    /**
     * Find prospect by accounting account number
     * @param accountingAccount
     * @returns Prospect OK
     * @throws ApiError
     */
    public static findByAccountingAccount2(
        accountingAccount: string,
    ): CancelablePromise<Prospect> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prospects/by-accounting-account/{accountingAccount}',
            path: {
                'accountingAccount': accountingAccount,
            },
        });
    }
}
