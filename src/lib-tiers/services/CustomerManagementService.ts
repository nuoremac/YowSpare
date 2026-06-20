/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Customer } from '../models/Customer';
import type { ThirdPartyStatistics } from '../models/ThirdPartyStatistics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CustomerManagementService {
    /**
     * Get a customer by ID
     * @param id
     * @returns Customer OK
     * @throws ApiError
     */
    public static getCustomer(
        id: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/customers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update an existing customer
     * @param id
     * @param requestBody
     * @returns Customer OK
     * @throws ApiError
     */
    public static updateCustomer(
        id: string,
        requestBody: Customer,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/customers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a customer
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteCustomer(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/customers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all customers for the current tenant
     * @param xTenantId
     * @returns Customer OK
     * @throws ApiError
     */
    public static getAllCustomers(
        xTenantId: string,
    ): CancelablePromise<Array<Customer>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/customers',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Create a new customer
     * @param xTenantId
     * @param requestBody
     * @returns Customer Created
     * @throws ApiError
     */
    public static createCustomer(
        xTenantId: string,
        requestBody: Customer,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/customers',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate a customer
     * @param id
     * @returns Customer OK
     * @throws ApiError
     */
    public static deactivateCustomer(
        id: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/customers/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update bank account number for a customer
     * @param id
     * @param requestBody
     * @returns Customer OK
     * @throws ApiError
     */
    public static defineBankAccount3(
        id: string,
        requestBody: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/customers/{id}/bank-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Activate a customer
     * @param id
     * @returns Customer OK
     * @throws ApiError
     */
    public static activateCustomer(
        id: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/customers/{id}/activate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Define/Update accounting account number for a customer
     * @param id
     * @param requestBody
     * @returns Customer OK
     * @throws ApiError
     */
    public static defineAccountingAccount3(
        id: string,
        requestBody: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/customers/{id}/accounting-account',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get customer statistics
     * @param xTenantId
     * @returns ThirdPartyStatistics OK
     * @throws ApiError
     */
    public static getCustomerStatistics(
        xTenantId: string,
    ): CancelablePromise<ThirdPartyStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/customers/statistics',
            headers: {
                'X-Tenant-ID': xTenantId,
            },
        });
    }
    /**
     * Find customer by bank account number
     * @param bankAccountNumber
     * @returns Customer OK
     * @throws ApiError
     */
    public static findByBankAccountNumber3(
        bankAccountNumber: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/customers/by-bank-account/{bankAccountNumber}',
            path: {
                'bankAccountNumber': bankAccountNumber,
            },
        });
    }
    /**
     * Find customer by accounting account number
     * @param accountingAccount
     * @returns Customer OK
     * @throws ApiError
     */
    public static findByAccountingAccount3(
        accountingAccount: string,
    ): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/customers/by-accounting-account/{accountingAccount}',
            path: {
                'accountingAccount': accountingAccount,
            },
        });
    }
}
