/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CloseMaterialRequestRequest } from '../models/CloseMaterialRequestRequest';
import type { CreateDepartmentMemberRequest } from '../models/CreateDepartmentMemberRequest';
import type { CreateDepartmentRequest } from '../models/CreateDepartmentRequest';
import type { CreateMaterialRequestRequest } from '../models/CreateMaterialRequestRequest';
import type { DepartmentDto } from '../models/DepartmentDto';
import type { DepartmentMemberDto } from '../models/DepartmentMemberDto';
import type { MaterialActionRequest } from '../models/MaterialActionRequest';
import type { MaterialRequestDto } from '../models/MaterialRequestDto';
import type { RejectMaterialRequestRequest } from '../models/RejectMaterialRequestRequest';
import type { TraceEventDto } from '../models/TraceEventDto';
import type { UpdateDepartmentRequest } from '../models/UpdateDepartmentRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MaterialOperationsControllerService {
    /**
     * @param agencyId
     * @param departmentId
     * @param status
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static listMaterialRequests(
        agencyId?: string,
        departmentId?: string,
        status?: string,
    ): CancelablePromise<Array<MaterialRequestDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/material-requests',
            query: {
                'agencyId': agencyId,
                'departmentId': departmentId,
                'status': status,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns MaterialRequestDto Created
     * @throws ApiError
     */
    public static createMaterialRequest(
        requestBody: CreateMaterialRequestRequest,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/material-requests',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static registerReturn(
        id: string,
        requestBody: MaterialActionRequest,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/material-requests/{id}/return',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static reject1(
        id: string,
        requestBody?: RejectMaterialRequestRequest,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/material-requests/{id}/reject',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static issue(
        id: string,
        requestBody: MaterialActionRequest,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/material-requests/{id}/issue',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static close(
        id: string,
        requestBody?: CloseMaterialRequestRequest,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/material-requests/{id}/close',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static approve1(
        id: string,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/material-requests/{id}/approve',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param agencyId
     * @param active
     * @returns DepartmentDto OK
     * @throws ApiError
     */
    public static listDepartments(
        agencyId?: string,
        active?: boolean,
    ): CancelablePromise<Array<DepartmentDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/departments',
            query: {
                'agencyId': agencyId,
                'active': active,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns DepartmentDto Created
     * @throws ApiError
     */
    public static createDepartment(
        requestBody: CreateDepartmentRequest,
    ): CancelablePromise<DepartmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/departments',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @returns DepartmentMemberDto OK
     * @throws ApiError
     */
    public static listDepartmentMembers(
        id: string,
    ): CancelablePromise<Array<DepartmentMemberDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/departments/{id}/members',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns DepartmentMemberDto Created
     * @throws ApiError
     */
    public static addDepartmentMember(
        id: string,
        requestBody: CreateDepartmentMemberRequest,
    ): CancelablePromise<DepartmentMemberDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/departments/{id}/members',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteDepartment(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/departments/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns DepartmentDto OK
     * @throws ApiError
     */
    public static updateDepartment(
        id: string,
        requestBody: UpdateDepartmentRequest,
    ): CancelablePromise<DepartmentDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/departments/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @returns MaterialRequestDto OK
     * @throws ApiError
     */
    public static getMaterialRequest(
        id: string,
    ): CancelablePromise<MaterialRequestDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/material-requests/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @returns TraceEventDto OK
     * @throws ApiError
     */
    public static listTraceEvents(
        id: string,
    ): CancelablePromise<Array<TraceEventDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/material-requests/{id}/trace-events',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param id
     * @param userId
     * @returns void
     * @throws ApiError
     */
    public static removeDepartmentMember(
        id: string,
        userId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/departments/{id}/members/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
}
