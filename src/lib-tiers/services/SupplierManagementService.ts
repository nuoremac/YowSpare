/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Supplier } from '../models/Supplier';
import type { ThirdPartyStatistics } from '../models/ThirdPartyStatistics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SupplierManagementService {
    /**
     * Get a supplier by ID
     * @param id
     * @returns Supplier OK
     * @throws ApiError
     */
    public static getSupplier(
        id: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing supplier
     * @param id
     * @param requestBody
     * @returns Supplier OK
     * @throws ApiError
     */
    public static updateSupplier(
        id: string,
        requestBody: Supplier,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/suppliers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a supplier
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteSupplier(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/suppliers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all suppliers for the current tenant
     * @param xTenantId
     * @returns Supplier OK
     * @throws ApiError
     */
    public static getAllSuppliers(
        xTenantId: string,
    ): CancelablePromise<Array<Supplier>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Create a new supplier
     * @param xTenantId
     * @param requestBody
     * @returns Supplier Created
     * @throws ApiError
     */
    public static createSupplier(
        xTenantId: string,
        requestBody: Supplier,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/suppliers',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate a supplier
     * @param id
     * @returns Supplier OK
     * @throws ApiError
     */
    public static deactivateSupplier(
        id: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/suppliers/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update bank account number for a supplier
     * @param id
     * @param requestBody
     * @returns Supplier OK
     * @throws ApiError
     */
    public static defineBankAccount(
        id: string,
        requestBody: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/suppliers/{id}/bank-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Activate a supplier
     * @param id
     * @returns Supplier OK
     * @throws ApiError
     */
    public static activateSupplier(
        id: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/suppliers/{id}/activate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update accounting account number for a supplier
     * @param id
     * @param requestBody
     * @returns Supplier OK
     * @throws ApiError
     */
    public static defineAccountingAccount(
        id: string,
        requestBody: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/suppliers/{id}/accounting-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get supplier statistics
     * @param xTenantId
     * @returns ThirdPartyStatistics OK
     * @throws ApiError
     */
    public static getSupplierStatistics(
        xTenantId: string,
    ): CancelablePromise<ThirdPartyStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers/statistics',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Find supplier by bank account number
     * @param bankAccountNumber
     * @returns Supplier OK
     * @throws ApiError
     */
    public static findByBankAccountNumber(
        bankAccountNumber: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers/by-bank-account/{bankAccountNumber}',
            path: {
                'bankAccountNumber': bankAccountNumber,
            },
        });
    }
    /**
     * Find supplier by accounting account number
     * @param accountingAccount
     * @returns Supplier OK
     * @throws ApiError
     */
    public static findByAccountingAccount(
        accountingAccount: string,
    ): CancelablePromise<Supplier> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/suppliers/by-accounting-account/{accountingAccount}',
            path: {
                'accountingAccount': accountingAccount,
            },
        });
    }
}
