import type { InvitationDto } from '../models/InvitationDto';
import type { SendInvitationRequest } from '../models/SendInvitationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class InvitationControllerService {
    /**
     * Send an invitation to a user by email
     */
    public static sendInvitation(
        requestBody: SendInvitationRequest,
    ): CancelablePromise<InvitationDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/invitations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `A pending invitation already exists for this email`,
            },
        });
    }

    /**
     * Validate an invitation token (public — no auth required)
     */
    public static validateToken(
        token: string,
    ): CancelablePromise<InvitationDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/invitations/validate/{token}',
            path: { token },
            errors: {
                404: `Invitation not found`,
                410: `Invitation expired or already used`,
            },
        });
    }

    /**
     * List all invitations in the current organization
     */
    public static listInvitations(): CancelablePromise<Array<InvitationDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/invitations',
        });
    }

    /**
     * Cancel a pending invitation
     */
    public static cancelInvitation(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/invitations/{id}',
            path: { id },
            errors: {
                404: `Invitation not found`,
            },
        });
    }
}
